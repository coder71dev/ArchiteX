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
        Schema::create('blueprints', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->integer('version')->default(1);
            $table->string('change_summary')->nullable();
            $table->text('overview');
            $table->json('strategy');
            $table->json('scope');
            $table->json('architecture');
            $table->json('component_details');
            $table->json('tech_stack');
            $table->json('roadmap');
            $table->integer('reliability_score');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blueprints');
    }
};
