<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HR\HrSolicitantesController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Profile\SignatureController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AuditController;
use App\Http\Controllers\Admin\BackupController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::pattern('exit_slip', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
Route::pattern('exitSlip', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard unificado — métricas y resumen por rol
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // HR — módulo solicitantes
    Route::get('/hr/solicitantes', [HrSolicitantesController::class, 'index'])
         ->middleware('role:hr')
         ->name('hr.solicitantes');

    // Admin panel
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [UserController::class, 'index'])->name('dashboard');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::get('/reniec/{dni}', [\App\Http\Controllers\Admin\ReniecController::class, 'consult'])->name('reniec.consult');
        Route::get('/documentation', [\App\Http\Controllers\Admin\DocumentationController::class, 'index'])->name('documentation');
        Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
        Route::post('/backups/download', [BackupController::class, 'download'])->name('backups.download');
        Route::get('/audit', [AuditController::class, 'index'])->name('audit.index');
    });

    Route::resource('exit-slips', \App\Http\Controllers\ExitSlipController::class)->except('destroy');
    Route::post('/exit-slips/{exitSlip}/actions/{action}', [\App\Http\Controllers\ExitSlipController::class, 'transition'])->name('exit-slips.transition');
    Route::get('/exit-slips/{exitSlip}/pdf', [\App\Http\Controllers\ExitSlipController::class, 'generatePdf'])->name('exit-slips.pdf');
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'read'])->name('notifications.read');
    // Profile & Signatures
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::post('/profile-photo', [\App\Http\Controllers\Profile\ProfilePhotoController::class, 'update'])->name('profile-photo.update');
    Route::delete('/profile-photo', [\App\Http\Controllers\Profile\ProfilePhotoController::class, 'destroy'])->name('profile-photo.destroy');
    
    Route::post('/signatures', [SignatureController::class, 'store'])->name('signatures.store');
    Route::delete('/signatures', [SignatureController::class, 'destroy'])->name('signatures.destroy');
    Route::get('/signatures/{id}', [SignatureController::class, 'show'])->name('signatures.show');
});

// Route for PDF visually aligning
Route::get('/calibrador', function () {
    return view('calibrador');
});

require __DIR__.'/auth.php';
