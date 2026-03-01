<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buildings', function (Blueprint $table) {
            $table->boolean('for_sale')->default(false)->after('description');
            $table->unsignedBigInteger('sale_price')->nullable()->after('for_sale');
            $table->index(['for_sale', 'sale_price']);
        });
    }

    public function down(): void
    {
        Schema::table('buildings', function (Blueprint $table) {
            $table->dropIndex(['for_sale', 'sale_price']);
            $table->dropColumn(['for_sale', 'sale_price']);
        });
    }
};
