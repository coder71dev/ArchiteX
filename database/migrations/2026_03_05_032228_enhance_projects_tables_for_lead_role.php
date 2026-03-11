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
        Schema::table('projects', function (Blueprint $table) {
            $table->date('target_deadline')->nullable()->after('client_name');
        });

        Schema::table('blueprints', function (Blueprint $table) {
            $table->json('milestones')->nullable()->after('tech_stack');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->json('technical_challenges')->nullable()->after('content');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->integer('milestone_index')->nullable()->after('assigned_to');
            $table->date('due_date')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('target_deadline');
        });

        Schema::table('blueprints', function (Blueprint $table) {
            $table->dropColumn('milestones');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn('technical_challenges');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['milestone_index', 'due_date']);
        });
    }
};
