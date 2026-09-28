<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\User\Enums\UserRole;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Models\User;

final class EloquentUserRepository implements UserRepositoryInterface
{
    public function findById(string $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findByDni(string $dni): ?User
    {
        return User::where('dni', $dni)->first();
    }

    public function save(User $user): User
    {
        $user->save();
        return $user;
    }

    /**
     * @return User[]
     */
    public function findByAreaAndRole(string $areaId, UserRole $role): array
    {
        return User::where('area_id', $areaId)
            ->where('rol', $role->value)
            ->where('activo', true)
            ->get()
            ->all();
    }
}
