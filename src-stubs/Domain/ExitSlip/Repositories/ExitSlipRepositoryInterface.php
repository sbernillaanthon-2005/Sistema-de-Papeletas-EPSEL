<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\Repositories;

use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;

/**
 * Interfaz del repositorio de papeletas — pertenece al dominio.
 * La implementación concreta está en Infrastructure/Persistence/Repositories.
 */
interface ExitSlipRepositoryInterface
{
    public function findById(string $id): ?ExitSlip;

    /** @return ExitSlip[] */
    public function findByPractitioner(string $practitionerId): array;

    /** @return ExitSlip[] */
    public function findByStatus(ExitSlipStatus $status): array;

    /** @return ExitSlip[] */
    public function findPendingForArea(string $areaId): array;

    public function save(ExitSlip $exitSlip): ExitSlip;

    public function delete(string $id): void;
}
