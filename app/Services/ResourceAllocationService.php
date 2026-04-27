<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TeamMember;

class ResourceAllocationService
{
    /**
     * Auto-assign tasks for a given project based on skills and availability.
     */
    public function autoAssignTasks(string $projectId)
    {
        $tasks = Task::where('project_id', $projectId)
            ->whereNull('assigned_to')
            ->get();

        if ($tasks->isEmpty()) {
            return ['assigned' => 0, 'unassigned' => 0];
        }

        $teamMembers = TeamMember::where('is_active', true)->get();
        $assignedCount = 0;

        // Track role allocations for this project to ensure 1 person per stack
        $stackAllocations = [];
        
        $assignedTasks = Task::with('assignee')->where('project_id', $projectId)
            ->whereNotNull('assigned_to')
            ->get();
            
        foreach ($assignedTasks as $t) {
            if ($t->assignee && $t->assignee->role) {
                $stack = $this->normalizeStack($t->assignee->role);
                $stackAllocations[$stack] = $t->assignee->id;
            }
        }

        foreach ($tasks as $task) {
            $bestMember = $this->findBestMemberForTask($task, $teamMembers, $stackAllocations);

            if ($bestMember) {
                $task->update(['assigned_to' => $bestMember->id]);
                if ($bestMember->role) {
                    $stack = $this->normalizeStack($bestMember->role);
                    $stackAllocations[$stack] = $bestMember->id;
                }
                $assignedCount++;
            }
        }

        return [
            'assigned' => $assignedCount,
            'unassigned' => $tasks->count() - $assignedCount,
        ];
    }

    /**
     * Find the best team member based on matching skills, availability, and strict stack limits.
     */
    private function findBestMemberForTask(Task $task, $teamMembers, array $stackAllocations)
    {
        $taskText = strtolower($task->title.' '.$task->description);

        $bestMember = null;
        $highestScore = -1;

        foreach ($teamMembers as $member) {
            $score = 0;
            $matchCount = 0;

            // 1. Skill Matching Score
            $skills = $member->skills ?? [];
            foreach ($skills as $skill) {
                if (stripos($taskText, trim($skill)) !== false) {
                    $score += 100; // Strong weight per skill
                    $matchCount++;
                }
            }

            if ($matchCount === 0) {
                continue; // Must match at least one skill
            }

            $memberStack = $this->normalizeStack($member->role);

            // 2. Strict Stack Allocation Check
            // If someone else already owns this stack on this project, disqualify!
            if (isset($stackAllocations[$memberStack]) && $stackAllocations[$memberStack] !== $member->id) {
                continue;
            }

            // If this member already owns this stack on this project, huge bonus PER matched skill
            // This prevents a backend dev (who might match 1 frontend skill) from stealing a frontend task
            // from the frontend dev (who matches 3 frontend skills)
            if (isset($stackAllocations[$memberStack]) && $stackAllocations[$memberStack] === $member->id) {
                $score += (10000 * $matchCount);
            }

            // 3. Workload Availability Score
            $currentWorkload = Task::where('assigned_to', $member->id)
                ->whereIn('status', ['todo', 'in_progress'])
                ->sum('estimated_hours');

            $availableHours = max(0, $member->availability_hours - $currentWorkload);
            $taskHours = $task->estimated_hours ?? 1;

            if ($availableHours < $taskHours) {
                $score -= 50; // Penalize, but don't disqualify, as they still "own" the stack
            } else {
                $score += ($availableHours / 10);
            }

            if ($score > $highestScore) {
                $highestScore = $score;
                $bestMember = $member;
            }
        }

        return $highestScore >= 0 ? $bestMember : null;
    }

    /**
     * Normalize roles into distinct stacks (frontend, backend, design, etc.)
     */
    private function normalizeStack(?string $role): string
    {
        if (!$role) return 'general';
        $r = strtolower($role);
        
        if (str_contains($r, 'frontend')) return 'frontend';
        if (str_contains($r, 'backend') || str_contains($r, 'software engineer')) return 'backend';
        if (str_contains($r, 'ui') || str_contains($r, 'ux') || str_contains($r, 'design')) return 'design';
        if (str_contains($r, 'flutter') || str_contains($r, 'app') || str_contains($r, 'mobile')) return 'mobile';
        if (str_contains($r, 'full-stack') || str_contains($r, 'fullstack')) return 'fullstack';
        
        return 'general';
    }
}
