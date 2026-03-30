<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'projects' => Project::with(['latestBlueprint', 'latestEstimate'])
                ->latest()
                ->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'brief' => 'required|string|min:10',
            'client_name' => 'nullable|string',
        ]);

        // 1. Create the project
        $project = Project::create([
            'user_id' => Auth::id(),
            'title' => 'Analyzing Requirements...',
            'brief' => $request->brief,
            'client_name' => $request->client_name,
            'status' => 'planning',
            'current_phase' => 'initializing',
        ]);

        // 2. Dispatch Background Job
        \App\Jobs\GenerateProjectPlanJob::dispatch($project, $request->brief);

        return redirect()->route('projects.show', $project->id);
    }

    public function show(Project $project)
    {
        return Inertia::render('Projects/Show', [
            'project' => $project->load([
                'blueprints' => fn($q) => $q->orderBy('version', 'desc'),
                'estimates' => fn($q) => $q->latest(),
                'proposals' => fn($q) => $q->latest(),
                'tasks.assignee'
            ]),
            'team' => TeamMember::where('is_active', true)->get(),
            'messages' => $project->conversation_id 
                ? \Illuminate\Support\Facades\DB::table('agent_conversation_messages')
                    ->where('conversation_id', $project->conversation_id)
                    ->orderBy('created_at', 'asc')
                    ->get()
                : []
        ]);
    }

    public function chat(Request $request, Project $project)
    {
        $request->validate(['message' => 'required|string']);

        $project->update([
            'status' => 'planning',
            'current_phase' => 'updating',
        ]);

        // Dispatch Update Job
        \App\Jobs\GenerateProjectPlanJob::dispatch($project, $request->message, true);

        return back();
    }
}

