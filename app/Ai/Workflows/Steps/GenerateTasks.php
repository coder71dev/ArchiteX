<?php

namespace App\Ai\Workflows\Steps;

use App\Ai\Agents\TaskGeneratorAgent;
use App\Models\Project;
use Closure;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Responses\StructuredAgentResponse;

class GenerateTasks
{
    /**
     * Handle the pipeline step.
     */
    public function __invoke(array $payload, Closure $next)
    {
        /** @var Project $project */
        $project = $payload['project'];
        $user = $project->user;
        $targetVersion = $payload['targetVersion'];

        $tasksExist = $project->tasks()->where('blueprint_version', $targetVersion)->exists();

        if ($tasksExist) {
            return $next($payload);
        }

        $project->update(['current_phase' => 'tasks']);

        // 1. Ensure milestones exist from blueprint
        $this->ensureMilestonesExist($project, $targetVersion);

        // 2. Generate hierarchical tasks via AI
        $taskAgent = (new TaskGeneratorAgent)->continue($project->conversation_id, $user);
        $taskPrompt = "Generate a hierarchical task breakdown for blueprint v{$targetVersion}. Create parent tasks per milestone with child tasks and checklists. Available team context will be used for assignment later.";

        /** @var StructuredAgentResponse $taskResponse */
        $taskResponse = $taskAgent->prompt($taskPrompt);
        $taskData = $taskResponse->structured;
        $taskGroups = $taskData['task_groups'] ?? [];

        $milestones = $project->milestones()->orderBy('sort_order')->get();

        foreach ($taskGroups as $group) {
            $milestoneIndex = (int) ($group['milestone_index'] ?? 0);
            $milestone = $milestones->get($milestoneIndex);

            if (! $milestone) {
                Log::warning("GenerateTasks: Milestone index {$milestoneIndex} not found for project {$project->id}");

                continue;
            }

            $parentData = $group['parent_task'] ?? [];

            // Create parent task
            $parentTask = $project->tasks()->create([
                'blueprint_version' => $targetVersion,
                'milestone_id' => $milestone->id,
                'parent_id' => null,
                'title' => $parentData['title'] ?? 'Untitled Feature',
                'description' => $parentData['description'] ?? '',
                'stack' => $parentData['stack'] ?? 'other',
                'priority' => 'high',
                'status' => 'backlog',
                'estimated_hours' => $parentData['estimated_hours'] ?? 0,
                'milestone_index' => $milestoneIndex,
                'phase' => 'Execution',
            ]);

            // Create child tasks
            foreach ($group['child_tasks'] ?? [] as $childData) {
                $project->tasks()->create([
                    'blueprint_version' => $targetVersion,
                    'milestone_id' => $milestone->id,
                    'parent_id' => $parentTask->id,
                    'title' => $childData['title'] ?? 'Untitled Task',
                    'description' => $childData['description'] ?? '',
                    'stack' => $childData['stack'] ?? 'other',
                    'priority' => $childData['priority'] ?? 'medium',
                    'status' => 'backlog',
                    'estimated_hours' => $childData['estimated_hours'] ?? 0,
                    'milestone_index' => $milestoneIndex,
                    'checklist_items' => $childData['checklist_items'] ?? [],
                    'completed_checklist' => [],
                    'phase' => 'Execution',
                ]);
            }
        }

        return $next($payload);
    }

    /**
     * Create milestone records from blueprint data if they don't exist.
     */
    private function ensureMilestonesExist(Project $project, int $targetVersion): void
    {
        $existingMilestones = $project->milestones()->exists();

        if ($existingMilestones) {
            return;
        }

        $blueprint = $project->blueprints()->where('version', $targetVersion)->first();

        if (! $blueprint || empty($blueprint->milestones)) {
            return;
        }

        foreach ($blueprint->milestones as $index => $milestoneData) {
            $project->milestones()->create([
                'title' => $milestoneData['title'] ?? "Milestone {$index}",
                'description' => $milestoneData['description'] ?? '',
                'goal' => $milestoneData['goal'] ?? '',
                'deliverables' => $milestoneData['deliverables'] ?? [],
                'deadline' => $milestoneData['deadline'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }
}
