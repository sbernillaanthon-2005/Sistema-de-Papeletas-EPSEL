<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Signature extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ruta_archivo',
        'mime',
        'hash_sha256',
        'imagen_base64',
    ];

    protected $hidden = [
        'imagen_base64',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Garantiza que el archivo físico de la firma exista en disco,
     * restaurándolo desde la copia en base de datos si el contenedor fue reemplazado.
     */
    public function ensureFileExists(): bool
    {
        if (Storage::disk('private')->exists($this->ruta_archivo)) {
            return true;
        }

        if (! empty($this->imagen_base64)) {
            $decoded = base64_decode($this->imagen_base64, true);
            if ($decoded !== false) {
                Storage::disk('private')->put($this->ruta_archivo, $decoded);
                return Storage::disk('private')->exists($this->ruta_archivo);
            }
        }

        return false;
    }
}
