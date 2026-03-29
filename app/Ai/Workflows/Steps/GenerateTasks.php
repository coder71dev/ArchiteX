<?php

namespace App\Ai\Workflows\Steps;

use App\Ai\Agents\TaskGeneratorAgent;
use App\Models\Project;
use Closure;
use Illuminate\Support\Facades\Log;

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

        $taskAgent = (new TaskGeneratorAgent())->continue($project->conversation_id, $user);
        $taskPrompt = "Generate granular, assignable developer tasks for the team based on blueprint v{$targetVersion}. Ensure every task is pinned to a milestone.";

        /** @var \Laravel\Ai\Responses\StructuredAgentResponse $taskResponse */
        $taskResponse = $taskAgent->prompt($taskPrompt);
        $taskData = $taskResponse->structured;
        $rawTasks = $taskData['task_list'] ?? [];

        foreach ($rawTasks as $rawTaskString) {
            $parts = explode('|', $rawTaskString);
            
            $title            = trim($parts[0] ?? 'New Task');
            $description      = trim($parts[1] ?? 'Follow-up requirement');
            $priority         = trim($parts[2] ?? 'medium');
            $hours            = (float) ($parts[3] ?? 0);
            $milestoneIndex   = (int) ($parts[4] ?? 0);
            $dueDate          = trim($parts[5] ?? null);
            $rawAssignee      = trim($parts[6] ?? null);
            $assigneeId       = (!empty($rawAssignee)) ? $rawAssignee : null;

            $project->tasks()->create([
                'blueprint_version' => $targetVersion,
                'title'             => $title,
                'description'       => $description,
                'priority'          => $priority,
                'status'            => 'backlog',
                'estimated_hours'   => $hours,
                'milestone_index'   => $milestoneIndex,
                'due_date'          => $dueDate ?: null,
                'assigned_to'       => $assigneeId,
                'phase'             => 'Execution',
            ]);
        }

        return $next($payload);
    }
}
