<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('estimates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->integer('version')->default(1);
            $table->integer('total_hours');
            $table->integer('duration_weeks');
            $table->json('team_composition');
            $table->json('phase_breakdown');
            $table->json('assumptions');
            $table->integer('risk_buffer_percent');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimates');
    }
};
