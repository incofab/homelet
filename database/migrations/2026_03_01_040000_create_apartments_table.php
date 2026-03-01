<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apartments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained('buildings')->cascadeOnDelete();
            $table->string('unit_code');
            $table->string('type');//, ['one_room', 'self_contain', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'custom']);
            $table->decimal('yearly_price', 15, 2);
            $table->text('description')->nullable();
            $table->string('floor')->nullable();
            $table->string('status')->default('vacant');//, ['vacant', 'occupied', 'maintenance'])->default('vacant');
            $table->boolean('is_public')->default(false);
            $table->json('amenities')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apartments');
    }
};
