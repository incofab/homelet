<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->string('collection')->default('images');
            $table->string('disk');
            $table->string('path');
            $table->string('url')->nullable();
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->boolean('is_video')->default(false);
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['model_type', 'model_id']);
            $table->index(['collection']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
