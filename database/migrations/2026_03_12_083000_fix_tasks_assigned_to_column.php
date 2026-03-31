<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix the tasks.assigned_to column type mismatch.
     *
     * The original migration used foreignId('assigned_to') which creates an
     * UNSIGNED BIGINT, but team_members uses ULIDs (char 26) as primary keys.
     * This migration drops the broken column and recreates it as a nullable
     * string that can hold a ULID value.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the old integer foreign key constraint (if it exists)
            try {
                $table->dropForeign(['assigned_to']);
            } catch (Throwable $e) {
                // Constraint may not exist on all DB drivers - safe to ignore
            }

            $table->dropColumn('assigned_to');
        });

        Schema::table('tasks', function (Blueprint $table) {
            // Recreate as a string ULID reference (no DB-level FK since SQLite
            // has limited ALTER TABLE support; integrity enforced at app level)
            $table->char('assigned_to', 26)->nullable()->after('blueprint_version');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('assigned_to');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('assigned_to')->nullable()->constrained('team_members')->nullOnDelete()->after('blueprint_version');
        });
    }
};
