<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE exit_slips DROP CONSTRAINT IF EXISTS chk_exit_slips_estado");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_estado CHECK (estado IN ('draft', 'submitted', 'approved_by_area', 'submitted_to_hr', 'approved_by_hr', 'completed', 'rejected'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE exit_slips DROP CONSTRAINT IF EXISTS chk_exit_slips_estado");
        DB::statement("ALTER TABLE exit_slips ADD CONSTRAINT chk_exit_slips_estado CHECK (estado IN ('draft', 'submitted', 'approved_by_area', 'approved_by_hr', 'completed', 'rejected'))");
    }
};
