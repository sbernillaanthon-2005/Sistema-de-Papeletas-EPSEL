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
use App\Infrastructure\Persistence\Eloquent\EloquentExitSlipCodeGenerator;
use App\Infrastructure\Persistence\Eloquent\EloquentExitSlipRepository;
use App\Infrastructure\Persistence\Eloquent\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider — enlaza interfaces de dominio con implementaciones concretas.
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
        
        $this->app->bind(
            \App\Domain\User\Services\SignatureStorageInterface::class,
            \App\Infrastructure\Storage\DiskSignatureStorage::class
        );
        
        $this->app->bind(
            \App\Domain\ExitSlip\Services\ExitSlipCodeGeneratorInterface::class,
            EloquentExitSlipCodeGenerator::class
        );

        // ── Casos de uso (Actions) ─────────────────────────────────────────
        $this->app->bind(CreateExitSlip::class);
        $this->app->bind(SubmitExitSlip::class);
        $this->app->bind(ApproveByAreaHead::class);
        $this->app->bind(ApproveByHR::class);
        $this->app->bind(RejectExitSlip::class);
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        if ($this->app->environment('testing')) {
            // Browser tests use the production bundle, independent of the dev server.
            \Illuminate\Support\Facades\Vite::useHotFile(storage_path('framework/testing.hot'));
        }
    }
}
