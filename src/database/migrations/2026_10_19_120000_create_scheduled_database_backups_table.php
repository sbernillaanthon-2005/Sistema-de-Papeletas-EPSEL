<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_database_backups', function (Blueprint $table) {
            $table->id();
            $table->string('file_path');
            $table->string('filename');
            $table->unsignedBigInteger('size_bytes');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_database_backups');
    }
};
