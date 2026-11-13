<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('minecraft_managed_content', function (Blueprint $table): void {
            // Legacy queued jobs have no operation ID and cannot execute after this upgrade.
            $table->uuid('operation_id')->nullable()->after('state');
            $table->string('requested_version_id', 24)->nullable()->after('operation_id');
        });
    }

    public function down(): void
    {
        Schema::table('minecraft_managed_content', function (Blueprint $table): void {
            $table->dropColumn(['operation_id', 'requested_version_id']);
        });
    }
};
