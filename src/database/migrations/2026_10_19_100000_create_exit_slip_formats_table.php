<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_slip_formats', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('file_path');
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->boolean('is_active')->default(false)->index();
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_slip_formats');
    }
};
