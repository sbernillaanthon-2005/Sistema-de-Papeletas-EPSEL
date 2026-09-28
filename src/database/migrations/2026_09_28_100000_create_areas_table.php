<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre');
            $table->timestamps();
            // Not FK to user here to avoid circular dep, as requested.
            // Jefe truth will be users.jefe_id or handled by Role.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};
