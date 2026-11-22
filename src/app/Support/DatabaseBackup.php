<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use PDO;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackup
{
    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int, format: string} */
    public function export(): array
    {
        return $this->createExport(storage_path('app/backups'), 'epsel-papeletas');
    }

    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int, format: string} */
    public function exportAutomatic(): array
    {
        return $this->createExport(storage_path('app/private/backups/automatic'), 'epsel-papeletas-auto');
    }

    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int, format: string} */
    private function createExport(string $directory, string $prefix): array
    {
        $connectionName = config('database.default');
        $connection = config('database.connections.'.$connectionName);

        if (($connection['driver'] ?? null) !== 'pgsql') {
            throw new RuntimeException('El respaldo está disponible únicamente para PostgreSQL.');
        }

        File::ensureDirectoryExists($directory);
        $timestamp = now('America/Lima')->format('Ymd-His');
        $suffix = bin2hex(random_bytes(4));

        // 1. Intentar pg_dump nativo (formato custom binario .dump)
        $dumpFilename = "{$prefix}-{$timestamp}-{$suffix}.dump";
        $dumpPath = $directory.'/'.$dumpFilename;

        if ($this->tryPgDump($connection, $dumpPath)) {
            return [
                'path' => $dumpPath,
                'relative_path' => 'backups/automatic/'.$dumpFilename,
                'filename' => $dumpFilename,
                'size_bytes' => File::size($dumpPath),
                'format' => 'postgresql-custom',
            ];
        }

        File::delete($dumpPath);

        // 2. Respaldo puro en PHP vía PDO PostgreSQL (compatible sin pg_dump instalado)
        return $this->exportViaPdo($connectionName, $directory, "{$prefix}-{$timestamp}-{$suffix}");
    }

    private function tryPgDump(array $connection, string $path): bool
    {
        $args = ['pg_dump', '--format=custom', '--no-owner', '--no-privileges', '--file='.$path];
        $env = [];

        if (! empty($connection['url'])) {
            $args[] = '--dbname='.$connection['url'];
        } else {
            if (! empty($connection['host'])) {
                $args[] = '--host='.$connection['host'];
            }
            if (! empty($connection['port'])) {
                $args[] = '--port='.(string) $connection['port'];
            }
            if (! empty($connection['username'])) {
                $args[] = '--username='.$connection['username'];
            }
            if (! empty($connection['database'])) {
                $args[] = '--dbname='.$connection['database'];
            }
            if (isset($connection['password'])) {
                $env['PGPASSWORD'] = (string) $connection['password'];
            }
        }

        try {
            $process = new Process($args, null, $env);
            $process->setTimeout(120);
            $process->run();

            return $process->isSuccessful() && File::exists($path) && File::size($path) > 0;
        } catch (\Throwable) {
            return false;
        }
    }

    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int, format: string} */
    private function exportViaPdo(string $connectionName, string $directory, string $baseName): array
    {
        /** @var PDO $pdo */
        $pdo = DB::connection($connectionName)->getPdo();

        $tables = $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
            ->fetchAll(PDO::FETCH_COLUMN);

        if (empty($tables)) {
            throw new RuntimeException('No se encontraron tablas en PostgreSQL para respaldar.');
        }

        $sql = "-- EPSEL Sistema de Papeletas - Respaldo PostgreSQL\n";
        $sql .= '-- Generado: '.now('America/Lima')->toIso8601String()."\n";
        $sql .= "BEGIN;\n";
        $sql .= "SET session_replication_role = replica;\n\n";

        foreach ($tables as $table) {
            $quotedTable = $this->quoteIdentifier((string) $table);
            $sql .= "TRUNCATE TABLE {$quotedTable} RESTART IDENTITY CASCADE;\n";

            $stmt = $pdo->query("SELECT * FROM {$quotedTable}");
            $columnCount = $stmt->columnCount();
            if ($columnCount === 0) {
                continue;
            }

            $columns = [];
            for ($i = 0; $i < $columnCount; $i++) {
                $meta = $stmt->getColumnMeta($i);
                $columns[] = $this->quoteIdentifier($meta['name']);
            }
            $columnList = implode(', ', $columns);

            $batch = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $values = [];
                foreach ($row as $value) {
                    if ($value === null) {
                        $values[] = 'NULL';
                    } elseif (is_bool($value)) {
                        $values[] = $value ? 'TRUE' : 'FALSE';
                    } elseif (is_int($value) || is_float($value)) {
                        $values[] = (string) $value;
                    } elseif (is_resource($value)) {
                        $bytes = stream_get_contents($value);
                        $values[] = "'\\x".bin2hex($bytes === false ? '' : $bytes)."'";
                    } else {
                        $values[] = $pdo->quote((string) $value);
                    }
                }
                $batch[] = '('.implode(', ', $values).')';

                if (count($batch) >= 100) {
                    $sql .= "INSERT INTO {$quotedTable} ({$columnList}) VALUES\n".implode(",\n", $batch).";\n";
                    $batch = [];
                }
            }

            if ($batch !== []) {
                $sql .= "INSERT INTO {$quotedTable} ({$columnList}) VALUES\n".implode(",\n", $batch).";\n";
            }

            $sql .= "\n";
        }

        // Restaurar secuencias auto-incrementales
        $sequences = $pdo->query("
            SELECT c.relname AS table_name, a.attname AS column_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_attribute a ON a.attrelid = c.oid
            JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($sequences as $seq) {
            $t = $this->quoteIdentifier($seq['table_name']);
            $c = $this->quoteIdentifier($seq['column_name']);
            $sql .= "SELECT setval(pg_get_serial_sequence(".$pdo->quote($seq['table_name']).", ".$pdo->quote($seq['column_name'])."), COALESCE((SELECT MAX({$c}) FROM {$t}), 1), true);\n";
        }

        $sql .= "SET session_replication_role = DEFAULT;\n";
        $sql .= "COMMIT;\n";

        if (function_exists('gzencode')) {
            $filename = $baseName.'.sql.gz';
            $path = $directory.'/'.$filename;
            $compressed = gzencode($sql, 6);
            if ($compressed === false) {
                throw new RuntimeException('No se pudo comprimir el respaldo SQL.');
            }
            File::put($path, $compressed);
            $format = 'postgresql-sql-gz';
        } else {
            $filename = $baseName.'.sql';
            $path = $directory.'/'.$filename;
            File::put($path, $sql);
            $format = 'postgresql-sql';
        }

        if (! File::exists($path) || File::size($path) === 0) {
            throw new RuntimeException('No se pudo escribir el archivo de respaldo en disco.');
        }

        return [
            'path' => $path,
            'relative_path' => 'backups/automatic/'.$filename,
            'filename' => $filename,
            'size_bytes' => File::size($path),
            'format' => $format,
        ];
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }
}
