<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateQuestionsJob;
use App\Models\Project;
use App\Models\TeamMember;
use App\Services\ResourceAllocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'projects' => Project::with(['latestBlueprint', 'latestEstimate'])
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'brief' => 'required|string|min:10',
            'client_name' => 'nullable|string',
            'budget' => 'nullable|string',
            'timeline' => 'nullable|string',
            'target_audience' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $project = Project::create([
            'user_id' => Auth::id(),
            'title' => 'Analyzing Requirements...',
            'brief' => $request->brief,
            'client_name' => $request->client_name,
            'budget' => $request->budget,
            'timeline' => $request->timeline,
            'target_audience' => $request->target_audience,
            'notes' => $request->notes,
            'status' => 'planning',
            'current_phase' => 'initializing',
            'planning_phase' => 'idea_submitted',
        ]);

        GenerateQuestionsJob::dispatchSync($project);

        return redirect()->route('projects.questions', $project->id);
    }

    public function show(Project $project)
    {
        // Redirect to wizard if project is not yet active
        if ($project->planning_phase !== 'active') {
            return match ($project->planning_phase) {
                'idea_submitted', 'clarifying_questions' => redirect()->route('projects.questions', $project->id),
                'questions_answered', 'plan_generating', 'plan_ready' => redirect()->route('projects.milestones', $project->id),
                'milestones_ready' => redirect()->route('projects.tasks', $project->id),
                'tasks_ready', 'team_assigned' => redirect()->route('projects.team', $project->id),
                default => null,
            };
        }

        return Inertia::render('Projects/Show', [
            'project' => $project->load([
                'blueprints' => fn ($q) => $q->orderBy('version', 'desc'),
                'estimates' => fn ($q) => $q->latest(),
                'proposals' => fn ($q) => $q->latest(),
                'tasks.assignee',
                'milestones' => fn ($q) => $q->orderBy('sort_order'),
            ]),
            'team' => TeamMember::where('is_active', true)->get(),
            'messages' => $project->conversation_id
                ? DB::table('agent_conversation_messages')
                    ->where('conversation_id', $project->conversation_id)
                    ->orderBy('created_at', 'asc')
                    ->get()
                : [],
        ]);
    }

    public function chat(Request $request, Project $project)
    {
        $request->validate([
            'message' => 'required|string',
            'retry' => 'nullable|boolean',
        ]);

        $project->update([
            'status' => 'planning',
            'current_phase' => $request->retry ? $project->current_phase : 'updating',
        ]);

        // Run plan update synchronously
        GenerateProjectPlanJob::dispatchSync(
            $project,
            $request->message,
            $request->retry ? false : true,
            $request->retry ?? false
        );

        return back();
    }

    public function autoAssignTasks(Project $project, ResourceAllocationService $allocationService)
    {
        $result = $allocationService->autoAssignTasks($project->id);

        if ($result['assigned'] > 0) {
            return back()->with('success', "Successfully assigned {$result['assigned']} tasks automatically.");
        } elseif ($result['unassigned'] > 0) {
            return back()->with('warning', "Could not automatically assign {$result['unassigned']} tasks. Check team availability and skills.");
        }

        return back()->with('info', 'No unassigned tasks found.');
    }
}
