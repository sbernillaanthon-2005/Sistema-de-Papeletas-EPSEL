<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\ExitSlip\Actions\ApproveByAreaHead;
use App\Application\ExitSlip\Actions\ApproveByHR;
use App\Application\ExitSlip\Actions\CreateExitSlip;
use App\Application\ExitSlip\Actions\RejectExitSlip;
use App\Application\ExitSlip\Actions\SubmitExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Repositories\EloquentExitSlipRepository;
use App\Infrastructure\Persistence\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider — enlaza interfaces de dominio con implementaciones concretas.
 *
 * Principio: Inversión de dependencias.
 * La capa de dominio y aplicación depende de interfaces; las implementaciones
 * concretas (Eloquent) viven en Infrastructure y se registran aquí.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // ── Repositorios ───────────────────────────────────────────────────
        $this->app->bind(
            ExitSlipRepositoryInterface::class,
            EloquentExitSlipRepository::class
        );

        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class
        );

        // ── Casos de uso (Actions) ─────────────────────────────────────────
        // Laravel los resuelve automáticamente por constructor injection,
        // pero los registramos explícitamente para claridad.
        $this->app->bind(CreateExitSlip::class);
        $this->app->bind(SubmitExitSlip::class);
        $this->app->bind(ApproveByAreaHead::class);
        $this->app->bind(ApproveByHR::class);
        $this->app->bind(RejectExitSlip::class);
    }

    public function boot(): void
    {
        //
    }
}
