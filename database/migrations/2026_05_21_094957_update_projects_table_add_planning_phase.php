<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->enum('planning_phase', [
                'idea_submitted',
                'clarifying_questions',
                'questions_answered',
                'plan_generating',
                'plan_ready',
                'milestones_ready',
                'tasks_ready',
                'team_assigned',
                'active',
            ])->default('idea_submitted')->after('status');
            $table->json('clarifying_questions')->nullable()->after('planning_phase');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['planning_phase', 'clarifying_questions']);
        });
    }
};
