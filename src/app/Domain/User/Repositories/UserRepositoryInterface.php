<?php

declare(strict_types=1);

namespace App\Domain\User\Repositories;

use App\Domain\User\Enums\UserRole;
use App\Models\User;

interface UserRepositoryInterface
{
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findByDni(string $dni): ?User;
    public function save(User $user): User;
    
    /** @return User[] */
    public function findByAreaAndRole(string $areaId, UserRole $role): array;
}
