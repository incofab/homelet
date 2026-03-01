<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lease_id')->constrained('leases')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->enum('payment_method', ['manual', 'online']);
            $table->string('transaction_reference')->nullable();
            $table->date('payment_date');
            $table->enum('status', ['pending', 'paid', 'failed'])->default('paid');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['lease_id', 'status']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
