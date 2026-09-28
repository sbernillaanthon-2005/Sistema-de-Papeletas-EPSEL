<?php

declare(strict_types=1);

namespace App\Application\User\Actions;

use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Domain\User\Services\SignatureStorageInterface;
use App\Models\User;
use App\Models\Signature;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use DomainException;

final class UploadSignature
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly SignatureStorageInterface $storage,
    ) {}

    public function execute(string $userId, UploadedFile $file): User
    {
        $user = $this->userRepository->findById($userId)
            ?? throw new DomainException("Usuario no encontrado.");

        if ($file->getSize() > 2 * 1024 * 1024) {
            throw new InvalidArgumentException("El tamaño máximo permitido es 2MB.");
        }

        DB::transaction(function () use ($user, $file) {
            // Guardar en disco (sanitizado)
            $path = $this->storage->storeSignature($file);

            // Eliminar firma anterior del disco si existe
            $oldSignature = Signature::where('user_id', $user->id)->first();
            if ($oldSignature) {
                // Retain immutable files referenced by historical slips.
                
                $oldSignature->update([
                    'ruta_archivo' => $path,
                    'mime' => 'image/png',
                    'hash_sha256' => hash_file('sha256', Storage::disk('private')->path($path)),
                ]);
            } else {
                // Registrar en base de datos
                Signature::create([
                    'user_id' => $user->id,
                    'ruta_archivo' => $path,
                    'mime' => 'image/png',
                    'hash_sha256' => hash_file('sha256', Storage::disk('private')->path($path)),
                ]);
            }
        });

        return $user;
    }
}
