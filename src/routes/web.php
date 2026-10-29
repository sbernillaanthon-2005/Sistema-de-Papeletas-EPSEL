<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HR\HrSolicitantesController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Profile\SignatureController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AuditController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\ExitSlipFormatController;
use App\Http\Controllers\ExitSlipFormatPreviewController;
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
        Route::post('/areas', [UserController::class, 'storeArea'])->name('areas.store');
        Route::put('/areas/{area}', [UserController::class, 'updateArea'])->name('areas.update');
        Route::delete('/areas/{area}', [UserController::class, 'destroyArea'])->name('areas.destroy');
        Route::post('/roles', [UserController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{customRole}', [UserController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{customRole}', [UserController::class, 'destroyRole'])->name('roles.destroy');
        Route::post('/responsible-heads', [UserController::class, 'storeResponsibleHead'])->name('responsible-heads.store');
        Route::put('/responsible-heads/{responsibleHead}', [UserController::class, 'updateResponsibleHead'])->name('responsible-heads.update');
        Route::delete('/responsible-heads/{responsibleHead}', [UserController::class, 'destroyResponsibleHead'])->name('responsible-heads.destroy');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::get('/reniec/{dni}', [\App\Http\Controllers\Admin\ReniecController::class, 'consult'])->name('reniec.consult');
        Route::get('/documentation', [\App\Http\Controllers\Admin\DocumentationController::class, 'index'])->name('documentation');
        Route::get('/backups', [BackupController::class, 'index'])->name('backups.index');
        Route::post('/backups/download', [BackupController::class, 'download'])->name('backups.download');
        Route::get('/backups/automatic/{scheduledDatabaseBackup}/download', [BackupController::class, 'downloadAutomatic'])->name('backups.automatic.download');
        Route::delete('/backups/automatic/{scheduledDatabaseBackup}', [BackupController::class, 'destroyAutomatic'])->name('backups.automatic.destroy');
        Route::get('/exit-slip-formats', [ExitSlipFormatController::class, 'index'])->name('exit-slip-formats.index');
        Route::post('/exit-slip-formats', [ExitSlipFormatController::class, 'store'])->name('exit-slip-formats.store');
        Route::put('/exit-slip-formats/{exitSlipFormat}', [ExitSlipFormatController::class, 'update'])->name('exit-slip-formats.update');
        Route::put('/exit-slip-formats/{exitSlipFormat}/activate', [ExitSlipFormatController::class, 'activate'])->name('exit-slip-formats.activate');
        Route::delete('/exit-slip-formats/base', [ExitSlipFormatController::class, 'destroyBase'])->name('exit-slip-formats.destroy-base');
        Route::delete('/exit-slip-formats/{exitSlipFormat}', [ExitSlipFormatController::class, 'destroy'])->name('exit-slip-formats.destroy');
        Route::get('/audit', [AuditController::class, 'index'])->name('audit.index');
        Route::put('/reminder-settings', [UserController::class, 'updateReminderSettings'])->name('reminder-settings.update');
    });

    Route::get('/exit-slips/export', [\App\Http\Controllers\ExitSlipController::class, 'export'])->name('exit-slips.export');
    Route::get('/exit-slip-format/current', [ExitSlipFormatPreviewController::class, 'show'])->name('exit-slip-formats.current');
    Route::resource('exit-slips', \App\Http\Controllers\ExitSlipController::class)->except('destroy');
    Route::post('/exit-slips/{exitSlip}/actions/{action}', [\App\Http\Controllers\ExitSlipController::class, 'transition'])->name('exit-slips.transition');
    Route::get('/exit-slips/{exitSlip}/pdf', [\App\Http\Controllers\ExitSlipController::class, 'generatePdf'])->name('exit-slips.pdf');
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'read'])->name('notifications.read');
    // Profile & Signatures
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    
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
