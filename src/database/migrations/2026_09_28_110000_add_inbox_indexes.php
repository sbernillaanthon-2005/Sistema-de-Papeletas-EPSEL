<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exit_slips', function (Blueprint $table) {
            $table->index(['jefe_asignado_id', 'estado', 'created_at'], 'exit_slips_head_inbox');
            $table->index(['user_id', 'estado', 'created_at'], 'exit_slips_owner_inbox');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'leida_at'], 'notifications_unread');
        });
    }

    public function down(): void
    {
        Schema::table('exit_slips', function (Blueprint $table) {
            $table->dropIndex('exit_slips_head_inbox');
            $table->dropIndex('exit_slips_owner_inbox');
        });
        Schema::table('notifications', fn (Blueprint $table) => $table->dropIndex('notifications_unread'));
    }
};
