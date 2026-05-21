<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskAssignmentLog;
use App\Models\TeamMember;
use Illuminate\Support\Collection;

class ResourceAllocationService
{
    /**
     * Auto-assign tasks for a given project based on stack and availability.
     */
    public function autoAssignTasks(string $projectId): array
    {
        $tasks = Task::where('project_id', $projectId)
            ->whereNull('assigned_to')
            ->get();

        if ($tasks->isEmpty()) {
            return ['assigned' => 0, 'unassigned' => 0];
        }

        $teamMembers = TeamMember::where('is_active', true)->get();
        $assignedCount = 0;

        // Track stack allocations for this project (1 person per stack)
        $stackAllocations = [];

        $assignedTasks = Task::with('assignee')
            ->where('project_id', $projectId)
            ->whereNotNull('assigned_to')
            ->get();

        foreach ($assignedTasks as $t) {
            if ($t->assignee && $t->assignee->stack) {
                $stackAllocations[$t->assignee->stack] = $t->assignee->id;
            }
        }

        foreach ($tasks as $task) {
            $bestMember = $this->findBestMemberForTask($task, $teamMembers, $stackAllocations);

            if ($bestMember) {
                $task->update(['assigned_to' => $bestMember->id]);
                $stackAllocations[$task->stack] = $bestMember->id;
                $assignedCount++;
            }
        }

        // Update workload for all assigned members
        foreach ($stackAllocations as $memberId) {
            $this->updateMemberWorkload($memberId);
        }

        return [
            'assigned' => $assignedCount,
            'unassigned' => $tasks->count() - $assignedCount,
        ];
    }

    /**
     * Find the best team member for a task based on stack matching and availability.
     */
    private function findBestMemberForTask(Task $task, Collection $teamMembers, array $stackAllocations): ?TeamMember
    {
        $taskStack = $task->stack ?? 'other';
        $bestMember = null;
        $highestScore = -1;

        foreach ($teamMembers as $member) {
            $score = 0;
            $memberStack = $member->stack ?? 'other';

            // 1. Stack Match (highest priority)
            if ($memberStack === $taskStack) {
                $score += 1000;
            } elseif ($memberStack === 'fullstack' && in_array($taskStack, ['frontend', 'backend'])) {
                $score += 500;
            }

            // 2. Strict Stack Allocation Check
            if (isset($stackAllocations[$taskStack]) && $stackAllocations[$taskStack] !== $member->id) {
                continue;
            }

            // 3. Bonus if already owns this stack on this project
            if (isset($stackAllocations[$taskStack]) && $stackAllocations[$taskStack] === $member->id) {
                $score += 10000;
            }

            // 4. Skill Matching (secondary)
            $skills = $member->skills ?? [];
            $taskText = strtolower($task->title.' '.$task->description);
            foreach ($skills as $skill) {
                if (stripos($taskText, trim($skill)) !== false) {
                    $score += 50;
                }
            }

            // 5. Workload Availability
            $currentWorkload = $this->getWorkloadHours($member->id);
            $availableHours = max(0, $member->availability_hours - $currentWorkload);
            $taskHours = $task->estimated_hours ?? 1;

            if ($availableHours < $taskHours) {
                $score -= 100; // Strong penalty for over-allocation
            } else {
                $score += ($availableHours / 5);
            }

            if ($score > $highestScore) {
                $highestScore = $score;
                $bestMember = $member;
            }
        }

        return $highestScore >= 0 ? $bestMember : null;
    }

    /**
     * Calculate workload for a team member.
     */
    public function calculateWorkload(string $memberId): array
    {
        $used = $this->getWorkloadHours($memberId);
        $member = TeamMember::find($memberId);
        $total = $member?->availability_hours ?? 0;

        return [
            'used' => (float) $used,
            'total' => $total,
            'percentage' => $total > 0 ? round(($used / $total) * 100, 1) : 0,
            'is_overallocated' => $used > $total,
        ];
    }

    /**
     * Reassign a task to a new team member with audit logging.
     */
    public function reassignTask(Task $task, string $newMemberId, string $reason = ''): void
    {
        $oldMemberId = $task->assigned_to;

        $task->update(['assigned_to' => $newMemberId]);

        TaskAssignmentLog::create([
            'task_id' => $task->id,
            'from_member_id' => $oldMemberId,
            'to_member_id' => $newMemberId,
            'reason' => $reason,
            'changed_by' => auth()->id(),
        ]);

        // Recalculate workloads
        if ($oldMemberId) {
            $this->updateMemberWorkload($oldMemberId);
        }
        $this->updateMemberWorkload($newMemberId);
    }

    /**
     * Get workload data for all active team members.
     */
    public function getTeamWorkload(): Collection
    {
        return TeamMember::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($member) {
                return array_merge(
                    ['id' => $member->id, 'name' => $member->name, 'role' => $member->role, 'stack' => $member->stack],
                    $this->calculateWorkload($member->id)
                );
            });
    }

    /**
     * Update the cached workload_hours for a team member.
     */
    public function updateMemberWorkload(string $memberId): void
    {
        $used = $this->getWorkloadHours($memberId);
        TeamMember::where('id', $memberId)->update(['current_workload_hours' => $used]);
    }

    /**
     * Get raw workload hours for a member.
     */
    private function getWorkloadHours(string $memberId): float
    {
        return (float) Task::where('assigned_to', $memberId)
            ->whereIn('status', ['todo', 'in_progress'])
            ->sum('estimated_hours');
    }
}
