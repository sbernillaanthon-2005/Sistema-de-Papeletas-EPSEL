<?php

declare(strict_types=1);

namespace App\Infrastructure\Storage;

use App\Domain\User\Services\SignatureStorageInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use InvalidArgumentException;

final class DiskSignatureStorage implements SignatureStorageInterface
{
    private const MAX_WIDTH = 800;
    private const MAX_HEIGHT = 400;
    private const MIN_WIDTH = 100;
    private const MIN_HEIGHT = 50;

    public function storeSignature(UploadedFile $file): string
    {
        // 1. Validar el MIME real
        $mime = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $file->getRealPath());
        if (!in_array($mime, ['image/png', 'image/jpeg'])) {
            throw new InvalidArgumentException("Solo se permiten archivos PNG y JPEG válidos. Detectado: {$mime}");
        }

        // 2. Procesar con Intervention para sanitizar (elimina metadatos)
        $manager = new ImageManager(new Driver());
        $image = $manager->decodePath($file->getRealPath());

        $width = $image->width();
        $height = $image->height();

        // 3. Validar dimensiones
        if ($width < self::MIN_WIDTH || $height < self::MIN_HEIGHT) {
            throw new InvalidArgumentException("La imagen es demasiado pequeña. Mínimo: " . self::MIN_WIDTH . "x" . self::MIN_HEIGHT);
        }

        if ($width > self::MAX_WIDTH || $height > self::MAX_HEIGHT) {
            $image->scaleDown(width: self::MAX_WIDTH, height: self::MAX_HEIGHT);
        }

        // 4. Guardar codificado
        $encoded = $image->encodeUsingMediaType('image/png');
        $hashName = hash('sha256', uniqid('', true) . microtime(true)) . '.png';
        
        $path = "signatures/{$hashName}";
        
        Storage::disk('private')->put($path, (string)$encoded);

        return $path;
    }

    public function deleteSignature(string $path): void
    {
        if (Storage::disk('private')->exists($path)) {
            Storage::disk('private')->delete($path);
        }
    }
}
