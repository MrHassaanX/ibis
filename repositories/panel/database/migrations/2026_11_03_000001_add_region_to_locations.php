<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table): void {
            $table->char('country_code', 2)->nullable();
            $table->string('region_name', 100)->nullable();
            $table->string('display_label', 100)->nullable();
            $table->boolean('region_visible')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table): void {
            $table->dropColumn(['country_code', 'region_name', 'display_label', 'region_visible']);
        });
    }
};
