<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_slip_transitions', function (Blueprint $table) {
            $table->id();
            $table->uuid('exit_slip_id')->index();
            $table->uuid('actor_id')->nullable()->index(); // Quien hizo el cambio
            $table->string('estado_origen')->nullable();
            $table->string('estado_destino');
            $table->text('comentario')->nullable();
            $table->timestamp('created_at')->useCurrent(); // inmutable

            $table->foreign('exit_slip_id')->references('id')->on('exit_slips')->cascadeOnDelete();
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_slip_transitions');
    }
};
