<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_slips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('codigo')->unique()->comment('Ej. PS-2026-000123');
            $table->uuid('user_id')->index();
            $table->string('tipo_plantilla')->default('practitioner'); // 'practitioner', 'worker'
            $table->date('fecha_emision');
            $table->string('apellidos_nombres'); // snapshot
            $table->string('designado')->nullable(); // snapshot
            
            $table->string('motivo_salida'); // enum string
            $table->text('motivo_detalle'); // NOT NULL
            
            $table->date('fecha_autorizada');
            $table->time('hora_desde')->nullable();
            $table->time('hora_hasta')->nullable();
            
            $table->string('estado')->index(); // enum string
            
            $table->uuid('jefe_asignado_id')->nullable();
            
            // Auditoría de Aprobación
            $table->uuid('aprobado_jefe_por')->nullable();
            $table->timestamp('aprobado_jefe_at')->nullable();
            $table->uuid('aprobado_rrhh_por')->nullable();
            $table->timestamp('aprobado_rrhh_at')->nullable();

            // Control de Vigilancia
            $table->time('hora_salida')->nullable();
            $table->time('hora_retorno')->nullable();
            $table->text('observaciones')->nullable();
            $table->string('supervisor')->nullable();
            
            // Snapshots de las firmas
            $table->string('firma_practicante_path')->nullable();
            $table->string('firma_jefe_path')->nullable();
            $table->string('firma_rrhh_path')->nullable();
            $table->string('firma_gerente_path')->nullable(); // V° B° Gerente de Línea
            
            $table->string('pdf_final_ruta')->nullable();
            
            $table->timestamps();

            // Constraints
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('jefe_asignado_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('aprobado_jefe_por')->references('id')->on('users')->nullOnDelete();
            $table->foreign('aprobado_rrhh_por')->references('id')->on('users')->nullOnDelete();
        });

        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_motivo CHECK (motivo_salida IN ('essalud', 'personal', 'commission', 'other'))");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_estado CHECK (estado IN ('draft', 'submitted', 'approved_by_area', 'approved_by_hr', 'completed', 'rejected'))");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_tipo CHECK (tipo_plantilla IN ('practitioner', 'worker'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_slips');
    }
};
