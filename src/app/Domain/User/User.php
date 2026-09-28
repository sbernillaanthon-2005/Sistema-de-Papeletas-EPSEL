<?php

declare(strict_types=1);

namespace App\Domain\User;

use App\Domain\User\Enums\UserRole;

/**
 * Entidad de dominio: Usuario del sistema
 */
final class User
{
    public function __construct(
        public readonly string   $id,
        public readonly string   $name,
        public readonly string   $lastName,
        public readonly string   $email,
        public readonly UserRole $role,
        public readonly ?string  $areaId,
        public readonly ?string  $designation,
        public readonly ?string  $signaturePath,
        public readonly ?string  $stampPath,
    ) {}

    public function fullName(): string
    {
        return "{$this->lastName}, {$this->name}";
    }

    public function isPractitioner(): bool
    {
        return $this->role === UserRole::PRACTITIONER;
    }

    public function isAreaHead(): bool
    {
        return $this->role === UserRole::AREA_HEAD;
    }

    public function isHR(): bool
    {
        return $this->role === UserRole::HR;
    }

    public function isSecurity(): bool
    {
        return $this->role === UserRole::SECURITY;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function canApproveAsAreaHead(): bool
    {
        return $this->isAreaHead() || $this->isAdmin();
    }

    public function canApproveAsHR(): bool
    {
        return $this->isHR() || $this->isAdmin();
    }
}
