<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TeamMember;
use Inertia\Inertia;

class TeamWorkloadController extends Controller
{
    public function index()
    {
        $members = TeamMember::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Team/Workload', [
            'teamMembers' => $members->map(function ($member) {
                $used = Task::where('assigned_to', $member->id)
                    ->whereIn('status', ['todo', 'in_progress'])
                    ->sum('estimated_hours');

                $total = $member->availability_hours;

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'role' => $member->role,
                    'stack' => $member->stack,
                    'availability_hours' => $total,
                    'used_hours' => (float) $used,
                    'percentage' => $total > 0 ? round(($used / $total) * 100, 1) : 0,
                    'is_overallocated' => $used > $total,
                    'active_tasks' => Task::where('assigned_to', $member->id)
                        ->whereIn('status', ['todo', 'in_progress'])
                        ->count(),
                ];
            }),
        ]);
    }
}
