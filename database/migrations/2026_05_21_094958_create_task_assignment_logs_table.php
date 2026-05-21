<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_assignment_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignUlid('from_member_id')->nullable()->constrained('team_members')->nullOnDelete();
            $table->foreignUlid('to_member_id')->constrained('team_members')->cascadeOnDelete();
            $table->string('reason')->nullable();
            $table->foreignUlid('changed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignment_logs');
    }
};
