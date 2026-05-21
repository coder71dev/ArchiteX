<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->enum('stack', ['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other'])->default('other')->after('role');
            $table->integer('current_workload_hours')->default(0)->after('availability_hours');
        });
    }

    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn(['stack', 'current_workload_hours']);
        });
    }
};
