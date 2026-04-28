<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city');
            $table->string('state');
            $table->string('postal_code')->nullable();
            $table->string('country');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('formatted_address')->nullable();
            $table->string('address_hash')->unique();
            $table->timestamps();

            $table->index(['city', 'state', 'country']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
