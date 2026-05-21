<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite workaround: rename old column, add new one with updated enum, copy data
        Schema::table('team_members', function (Blueprint $table) {
            $table->renameColumn('stack', 'stack_old');
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->enum('stack', ['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'fullstack', 'other'])->default('other')->after('role');
        });

        DB::statement('UPDATE team_members SET stack = stack_old');

        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn('stack_old');
        });
    }

    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->renameColumn('stack', 'stack_old');
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->enum('stack', ['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other'])->default('other')->after('role');
        });

        DB::statement('UPDATE team_members SET stack = stack_old WHERE stack_old IN ("frontend", "backend", "mobile", "design", "devops", "qa", "other")');
        DB::statement('UPDATE team_members SET stack = "other" WHERE stack_old = "fullstack"');

        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn('stack_old');
        });
    }
};
