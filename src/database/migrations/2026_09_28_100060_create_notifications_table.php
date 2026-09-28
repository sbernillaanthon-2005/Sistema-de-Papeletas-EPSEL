<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id')->index();
            $table->string('tipo'); // STATUS_CHANGED, NEW_REQUEST, etc.
            $table->uuid('exit_slip_id')->nullable()->index();
            $table->string('titulo');
            $table->text('mensaje');
            $table->timestamp('leida_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('exit_slip_id')->references('id')->on('exit_slips')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
