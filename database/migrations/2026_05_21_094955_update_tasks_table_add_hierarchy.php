<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignUlid('parent_id')->nullable()->after('project_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignUlid('milestone_id')->nullable()->after('parent_id')->constrained('milestones')->nullOnDelete();
            $table->enum('stack', ['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other'])->default('other')->after('assigned_to');
            $table->json('checklist_items')->nullable()->after('phase');
            $table->json('completed_checklist')->nullable()->after('checklist_items');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['milestone_id']);
            $table->dropColumn(['parent_id', 'milestone_id', 'stack', 'checklist_items', 'completed_checklist']);
        });
    }
};
