<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minecraft_content_profiles', function (Blueprint $table): void {
            $table->unsignedInteger('server_id')->primary();
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
            $table->string('software', 24);
            $table->string('minecraft_version', 24);
            $table->string('loader_version', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('minecraft_managed_content', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('server_id');
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
            $table->string('type', 8);
            $table->string('provider', 24);
            $table->string('project_id', 24);
            $table->string('version_id', 24);
            $table->string('filename', 180);
            $table->char('sha512', 128)->nullable();
            $table->string('state', 16);
            $table->string('error', 500)->nullable();
            $table->timestamps();
            $table->unique(['server_id', 'type', 'provider', 'project_id'], 'minecraft_content_project_unique');
            $table->unique(['server_id', 'type', 'filename'], 'minecraft_content_filename_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minecraft_managed_content');
        Schema::dropIfExists('minecraft_content_profiles');
    }
};
