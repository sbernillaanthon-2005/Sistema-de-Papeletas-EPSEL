<?php

namespace App\Policies;

use App\Domain\ExitSlip\Enums\ExitSlipStatus as Status;
use App\Domain\User\Enums\UserRole as Role;
use App\Models\ExitSlip;
use App\Models\User;

class ExitSlipPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->activo;
    }

    public function create(User $user): bool
    {
        return $user->activo && in_array($user->rol, [Role::PRACTITIONER, Role::WORKER, Role::AREA_HEAD], true);
    }

    public function view(User $user, ExitSlip $slip): bool
    {
        return $user->activo && ($user->id === $slip->user_id || $user->rol === Role::ADMIN
            || ($slip->estado !== Status::DRAFT && ($user->rol === Role::HR || ($user->rol === Role::AREA_HEAD && $user->id === $slip->jefe_asignado_id)))
            || ($user->rol === Role::SECURITY && in_array($slip->estado, [Status::SUBMITTED_TO_SECURITY, Status::COMPLETED], true)));
    }

    public function generatePdf(User $user, ExitSlip $slip): bool
    {
        return $this->view($user, $slip);
    }

    public function update(User $user, ExitSlip $slip): bool
    {
        return ($user->activo && $user->rol === Role::ADMIN)
            || ($this->create($user) && $user->id === $slip->user_id && $slip->estado === Status::DRAFT);
    }

    public function delete(User $user, ExitSlip $slip): bool
    {
        return $user->activo && $user->rol === Role::ADMIN;
    }

    public function submit(User $user, ExitSlip $slip): bool
    {
        return $this->create($user) && $user->id === $slip->user_id && $slip->estado === Status::DRAFT;
    }

    public function revert(User $user, ExitSlip $slip): bool
    {
        return $this->create($user) && $user->id === $slip->user_id && $slip->estado === Status::REJECTED;
    }

    public function approve(User $user, ExitSlip $slip): bool
    {
        return $user->activo && $user->id !== $slip->user_id && (
            ($user->rol === Role::AREA_HEAD && $user->id === $slip->jefe_asignado_id && $slip->estado === Status::SUBMITTED)
            || ($user->rol === Role::HR && $slip->estado === Status::SUBMITTED_TO_HR));
    }

    public function reject(User $user, ExitSlip $slip): bool
    {
        return $this->approve($user, $slip);
    }

    public function submit_to_hr(User $user, ExitSlip $slip): bool
    {
        return $user->activo && $user->id === $slip->user_id && $slip->estado === Status::APPROVED_BY_AREA;
    }

    public function submit_to_security(User $user, ExitSlip $slip): bool
    {
        return $user->activo && $user->id === $slip->user_id && $slip->estado === Status::APPROVED_BY_HR;
    }

    public function security(User $user, ExitSlip $slip): bool
    {
        return $user->activo && $user->rol === Role::SECURITY && $slip->estado === Status::SUBMITTED_TO_SECURITY;
    }
}
