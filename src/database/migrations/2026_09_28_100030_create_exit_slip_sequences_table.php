<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_slip_sequences', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->integer('last_number');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_slip_sequences');
    }
};
