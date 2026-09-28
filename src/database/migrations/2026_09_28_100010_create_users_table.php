<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('dni')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('rol');
            $table->uuid('area_id')->nullable();
            $table->string('cargo_designado')->nullable();
            $table->uuid('jefe_id')->nullable();
            $table->boolean('activo')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('area_id')->references('id')->on('areas')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('jefe_id')->references('id')->on('users')->nullOnDelete();
        });

        // Add check constraint for enum (PHP-level Enum will map to these strings)
        DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_rol CHECK (rol IN ('practitioner', 'worker', 'area_head', 'hr', 'security', 'admin'))");

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
