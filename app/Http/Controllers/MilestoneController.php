<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function update(Request $request, Milestone $milestone)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'goal' => 'nullable|string',
            'deadline' => 'nullable|date',
            'deliverables' => 'nullable|array',
            'deliverables.*' => 'string',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        $milestone->update(array_filter($validated));

        return back();
    }

    public function destroy(Milestone $milestone)
    {
        // Cascade delete is handled by DB constraint
        $milestone->delete();

        return back();
    }
}
