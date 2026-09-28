<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Profile\SignatureController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::pattern('exit_slip', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
Route::pattern('exitSlip', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Practitioner dashboard
    Route::get('/dashboard', function () {
        return app(\App\Http\Controllers\ExitSlipController::class)->index(request());
    })->name('dashboard');

    // Area Head dashboard
    Route::get('/head/dashboard', function () {
        return app(\App\Http\Controllers\ExitSlipController::class)->index(request());
    })->middleware('role:area_head')->name('head.dashboard');

    // HR dashboard
    Route::get('/hr/dashboard', function () {
        return app(\App\Http\Controllers\ExitSlipController::class)->index(request());
    })->middleware('role:hr')->name('hr.dashboard');

    // Admin panel
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [UserController::class, 'index'])->name('dashboard');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
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
    
    Route::post('/signatures', [SignatureController::class, 'store'])->name('signatures.store');
    Route::get('/signatures/{id}', [SignatureController::class, 'show'])->name('signatures.show');
});

// Route for PDF visually aligning
Route::get('/calibrador', function () {
    return view('calibrador');
});

require __DIR__.'/auth.php';
