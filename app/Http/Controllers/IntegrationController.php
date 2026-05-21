<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IntegrationController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'type' => 'required|in:webhook,jira',
            'config' => 'required|array',
            'config.url' => 'required_if:type,webhook|url',
            'config.headers' => 'nullable|array',
            'config.project_key' => 'nullable|string',
        ]);

        $integration = $project->integrations()->create([
            'type' => $validated['type'],
            'config' => $validated['config'],
        ]);

        return back()->with('success', 'Integration configured successfully.');
    }

    public function sync(Project $project, Integration $integration)
    {
        if ($integration->project_id !== $project->id) {
            abort(403);
        }

        try {
            if ($integration->type === 'webhook') {
                $this->syncToWebhook($project, $integration);
            } elseif ($integration->type === 'jira') {
                $this->syncToJira($project, $integration);
            }

            $integration->update([
                'last_sync_at' => now(),
                'status' => 'active',
            ]);

            return back()->with('success', 'Sync completed successfully.');
        } catch (\Throwable $e) {
            Log::error("Sync failed for integration {$integration->id}: {$e->getMessage()}");
            $integration->update(['status' => 'error']);

            return back()->with('error', 'Sync failed: '.$e->getMessage());
        }
    }

    public function test(Project $project, Integration $integration)
    {
        if ($integration->project_id !== $project->id) {
            abort(403);
        }

        try {
            $payload = [
                'event' => 'integration.test',
                'timestamp' => now()->toIso8601String(),
                'project' => [
                    'id' => $project->id,
                    'title' => $project->title,
                ],
            ];

            if ($integration->type === 'webhook') {
                $response = Http::withHeaders($integration->config['headers'] ?? [])
                    ->post($integration->config['url'], $payload);

                if (! $response->successful()) {
                    return back()->with('error', 'Webhook test failed: '.$response->body());
                }
            }

            return back()->with('success', 'Test payload sent successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Test failed: '.$e->getMessage());
        }
    }

    private function syncToWebhook(Project $project, Integration $integration): void
    {
        $payload = $this->buildPayload($project);

        $response = Http::withHeaders($integration->config['headers'] ?? [])
            ->post($integration->config['url'], $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Webhook returned status '.$response->status().': '.$response->body());
        }
    }

    private function syncToJira(Project $project, Integration $integration): void
    {
        // Jira sync placeholder for future implementation
        Log::info("Jira sync requested for project {$project->id} but not yet implemented.");
        throw new \RuntimeException('Jira integration is coming soon.');
    }

    private function buildPayload(Project $project): array
    {
        $milestones = $project->milestones()->with('tasks')->get()->map(function ($milestone) {
            $totalTasks = $milestone->tasks()->count();
            $completedTasks = $milestone->tasks()->where('status', 'done')->count();

            return [
                'title' => $milestone->title,
                'deadline' => $milestone->deadline?->toDateString(),
                'status' => $milestone->status,
                'progress_percent' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            ];
        });

        $tasks = $project->tasks()->with('assignee')->get()->map(function ($task) {
            $totalChecklist = count($task->checklist_items ?? []);
            $completedChecklist = count(array_filter($task->completed_checklist ?? []));

            return [
                'title' => $task->title,
                'stack' => $task->stack,
                'status' => $task->status,
                'assignee' => $task->assignee?->name,
                'estimated_hours' => $task->estimated_hours,
                'checklist' => [
                    'total' => $totalChecklist,
                    'completed' => $completedChecklist,
                ],
            ];
        });

        $team = TeamMember::where('is_active', true)->get()->map(function ($member) {
            $used = Task::where('assigned_to', $member->id)
                ->whereIn('status', ['todo', 'in_progress'])
                ->sum('estimated_hours');

            return [
                'name' => $member->name,
                'stack' => $member->stack,
                'workload' => [
                    'used' => (float) $used,
                    'total' => $member->availability_hours,
                    'percentage' => $member->availability_hours > 0 ? round(($used / $member->availability_hours) * 100, 1) : 0,
                ],
            ];
        });

        return [
            'event' => 'project.sync',
            'timestamp' => now()->toIso8601String(),
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'status' => $project->status,
                'client_name' => $project->client_name,
            ],
            'milestones' => $milestones,
            'tasks' => $tasks,
            'team' => $team,
        ];
    }
}
