<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateProjectPlanJob;
use App\Jobs\GenerateQuestionsJob;
use App\Models\Project;
use App\Models\TeamMember;
use App\Services\ResourceAllocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PlanningWizardController extends Controller
{
    /**
     * Show the project idea submission form.
     */
    public function create()
    {
        return inertia('Projects/Create');
    }

    /**
     * Step 1: Submit a raw project idea.
     */
    public function submitIdea(Request $request)
    {
        $validated = $request->validate([
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
            'brief' => $validated['brief'],
            'client_name' => $validated['client_name'] ?? null,
            'budget' => $validated['budget'] ?? null,
            'timeline' => $validated['timeline'] ?? null,
            'target_audience' => $validated['target_audience'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'planning',
            'current_phase' => 'initializing',
            'planning_phase' => 'idea_submitted',
        ]);

        GenerateQuestionsJob::dispatchSync($project);

        return redirect()->route('projects.questions', $project->id);
    }

    /**
     * Step 2: Display clarifying questions page.
     */
    public function questions(Project $project)
    {
        if ($project->planning_phase === 'active') {
            return redirect()->route('projects.show', $project->id);
        }

        return Inertia::render('Projects/Questions', [
            'project' => $project->load('milestones'),
        ]);
    }

    /**
     * Step 2b: Submit answers to clarifying questions.
     */
    public function submitAnswers(Request $request, Project $project)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*' => 'string',
            'skip_remaining' => 'nullable|boolean',
        ]);

        $questions = $project->clarifying_questions ?? [];
        $answers = $validated['answers'];

        // Store answers back in clarifying_questions
        $answeredQuestions = [];
        foreach ($questions['questions'] ?? [] as $index => $q) {
            $answeredQuestions[] = array_merge($q, [
                'answer' => $answers[$index] ?? null,
            ]);
        }

        $project->update([
            'clarifying_questions' => array_merge($questions, [
                'questions' => $answeredQuestions,
                'answered_at' => now()->toDateTimeString(),
            ]),
            'planning_phase' => 'questions_answered',
            'current_phase' => 'blueprint',
        ]);

        // Generate blueprint first for architecture review
        GenerateProjectPlanJob::dispatchSync($project, $project->brief);

        return redirect()->route('projects.architecture', $project->id);
    }

    /**
     * Step 3: Display architecture review page.
     */
    public function architecture(Project $project)
    {
        if ($project->planning_phase === 'active') {
            return redirect()->route('projects.show', $project->id);
        }

        return Inertia::render('Projects/Architecture', [
            'project' => $project->load(['latestBlueprint', 'milestones']),
        ]);
    }

    /**
     * Step 3b: Approve architecture and continue to milestones.
     */
    public function approveArchitecture(Request $request, Project $project)
    {
        $project->update(['planning_phase' => 'plan_ready']);

        return redirect()->route('projects.milestones', $project->id);
    }

    /**
     * Step 3c: Override tech stack and regenerate blueprint.
     */
    public function overrideArchitecture(Request $request, Project $project)
    {
        $validated = $request->validate([
            'tech_override' => 'required|string|min:5',
        ]);

        // Store the override in project notes/context
        $project->update([
            'notes' => ($project->notes ? $project->notes . "\n\n" : '') . "Tech Stack Override Request:\n" . $validated['tech_override'],
        ]);

        // Regenerate blueprint with override context
        GenerateProjectPlanJob::dispatchSync($project, $validated['tech_override'], isUpdate: true);

        return redirect()->route('projects.architecture', $project->id);
    }

    /**
     * Step 3d: Regenerate blueprint from scratch.
     */
    public function regenerateBlueprint(Request $request, Project $project)
    {
        // Regenerate blueprint with the original brief
        GenerateProjectPlanJob::dispatchSync($project, $project->brief, isRetry: true);

        return redirect()->route('projects.architecture', $project->id);
    }

    /**
     * Step 3: Display milestones review page.
     */
    public function milestones(Project $project)
    {
        if ($project->planning_phase === 'active') {
            return redirect()->route('projects.show', $project->id);
        }

        if ($project->planning_phase === 'plan_generating') {
            return Inertia::render('Projects/Questions', [
                'project' => $project->load('milestones', 'blueprints', 'tasks'),
            ]);
        }

        return Inertia::render('Projects/Milestones', [
            'project' => $project->load(['milestones', 'latestBlueprint', 'tasks']),
        ]);
    }

    /**
     * Step 3b: Approve milestones and trigger task generation.
     */
    public function approveMilestones(Request $request, Project $project)
    {
        $validated = $request->validate([
            'milestones' => 'required|array',
            'milestones.*.id' => 'required|exists:milestones,id',
            'milestones.*.title' => 'required|string',
            'milestones.*.description' => 'nullable|string',
            'milestones.*.goal' => 'nullable|string',
            'milestones.*.deadline' => 'nullable|date',
            'milestones.*.deliverables' => 'nullable|array',
        ]);

        foreach ($validated['milestones'] as $milestoneData) {
            $milestone = $project->milestones()->find($milestoneData['id']);
            if ($milestone) {
                $milestone->update([
                    'title' => $milestoneData['title'],
                    'description' => $milestoneData['description'] ?? $milestone->description,
                    'goal' => $milestoneData['goal'] ?? $milestone->goal,
                    'deadline' => $milestoneData['deadline'] ?? $milestone->deadline,
                    'deliverables' => $milestoneData['deliverables'] ?? $milestone->deliverables,
                ]);
            }
        }

        $project->update(['planning_phase' => 'milestones_ready']);

        // If tasks don't exist yet, run task generation synchronously
        if ($project->tasks()->count() === 0) {
            GenerateProjectPlanJob::dispatchSync($project, $project->brief);
        } else {
            $project->update(['planning_phase' => 'tasks_ready']);
        }

        return redirect()->route('projects.tasks', $project->id);
    }

    /**
     * Step 4: Display tasks review page.
     */
    public function tasks(Project $project)
    {
        if ($project->planning_phase === 'active') {
            return redirect()->route('projects.show', $project->id);
        }

        return Inertia::render('Projects/Tasks', [
            'project' => $project->load([
                'milestones.tasks' => fn ($q) => $q->with('children.assignee')->whereNull('parent_id'),
                'tasks.assignee',
            ]),
            'team' => TeamMember::where('is_active', true)->get(),
        ]);
    }

    /**
     * Step 4b: Approve tasks and go to team assignment.
     */
    public function approveTasks(Request $request, Project $project)
    {
        $project->update(['planning_phase' => 'tasks_ready']);

        return redirect()->route('projects.team', $project->id);
    }

    /**
     * Step 5: Display team assignment page.
     */
    public function team(Project $project)
    {
        if ($project->planning_phase === 'active') {
            return redirect()->route('projects.show', $project->id);
        }

        return Inertia::render('Projects/Team', [
            'project' => $project->load([
                'milestones.tasks.children.assignee',
                'tasks' => fn ($q) => $q->whereNull('assigned_to'),
            ]),
            'team' => TeamMember::where('is_active', true)->get(),
        ]);
    }

    /**
     * Step 5b: Auto-assign team and activate project.
     */
    public function assignTeam(Request $request, Project $project, ResourceAllocationService $allocationService)
    {
        $result = $allocationService->autoAssignTasks($project->id);

        $project->update([
            'planning_phase' => 'active',
            'status' => 'in_progress',
        ]);

        return redirect()->route('projects.show', $project->id)
            ->with('success', "Project activated. Assigned {$result['assigned']} tasks.");
    }

    /**
     * Get current wizard status for polling.
     */
    public function getStatus(Project $project)
    {
        return response()->json([
            'planning_phase' => $project->planning_phase,
            'current_phase' => $project->current_phase,
            'status' => $project->status,
            'error_message' => $project->error_message,
            'questions_ready' => ! empty($project->clarifying_questions),
            'milestones_count' => $project->milestones()->count(),
            'tasks_count' => $project->tasks()->count(),
        ]);
    }
}
