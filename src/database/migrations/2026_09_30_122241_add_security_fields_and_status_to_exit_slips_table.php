<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exit_slips', function (Blueprint $table) {
            $table->string('firma_vigilancia_path')->nullable()->after('firma_gerente_path');
        });

        DB::statement("ALTER TABLE exit_slips DROP CONSTRAINT chk_exit_slips_estado");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_estado CHECK (estado IN ('draft', 'submitted', 'approved_by_area', 'submitted_to_hr', 'approved_by_hr', 'submitted_to_security', 'completed', 'rejected'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE exit_slips DROP CONSTRAINT chk_exit_slips_estado");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_estado CHECK (estado IN ('draft', 'submitted', 'approved_by_area', 'submitted_to_hr', 'approved_by_hr', 'completed', 'rejected'))");
        
        Schema::table('exit_slips', function (Blueprint $table) {
            $table->dropColumn('firma_vigilancia_path');
        });
    }
};
