<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_slip_format_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->boolean('base_available')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_slip_format_settings');
    }
};
