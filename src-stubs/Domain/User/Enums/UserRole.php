<?php

declare(strict_types=1);

namespace App\Domain\User\Enums;

enum UserRole: string
{
    case PRACTITIONER = 'practitioner';
    case AREA_HEAD    = 'area_head';
    case HR           = 'hr';
    case SECURITY     = 'security';
    case ADMIN        = 'admin';

    public function label(): string
    {
        return match($this) {
            self::PRACTITIONER => 'Practicante',
            self::AREA_HEAD    => 'Jefe de Área',
            self::HR           => 'Oficina de Recursos Humanos',
            self::SECURITY     => 'Control de Vigilancia',
            self::ADMIN        => 'Administrador',
        };
    }

    /**
     * Orden de aprobación en el flujo de la papeleta
     * (mayor número = mayor en la jerarquía de aprobación)
     */
    public function approvalLevel(): int
    {
        return match($this) {
            self::PRACTITIONER => 0,
            self::SECURITY     => 1,
            self::AREA_HEAD    => 2,
            self::HR           => 3,
            self::ADMIN        => 99,
        };
    }
}
