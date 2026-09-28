<?php

declare(strict_types=1);

namespace App\Domain\User\Services;

use Illuminate\Http\UploadedFile;

interface SignatureStorageInterface
{
    /**
     * Guarda la firma, aplicando validaciones (dimensiones, formato, MIME)
     * y sanitizándola (GD/Intervention). Retorna la ruta relativa final.
     */
    public function storeSignature(UploadedFile $file): string;

    /**
     * Elimina el archivo de firma dada una ruta relativa.
     */
    public function deleteSignature(string $path): void;
}
