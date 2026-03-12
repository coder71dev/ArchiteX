<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add executive_summary to proposals table (returned by ProposalAgent schema).
     */
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->text('executive_summary')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn('executive_summary');
        });
    }
};
