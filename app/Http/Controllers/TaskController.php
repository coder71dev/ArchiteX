<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\ResourceAllocationService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'checklist_items' => 'nullable|array',
            'checklist_items.*' => 'string',
            'stack' => 'nullable|in:frontend,backend,mobile,design,devops,qa,other',
            'priority' => 'nullable|in:critical,high,medium,low',
            'estimated_hours' => 'nullable|numeric|min:0',
        ]);

        $task->update(array_filter($validated));

        return back();
    }

    public function updateStatus(Request $request, Task $task)
    {
        $request->validate(['status' => 'required|in:todo,in_progress,review,done']);

        $oldStatus = $task->status;
        $task->update(['status' => $request->status]);

        // If child task completed, check if parent should auto-complete
        if ($task->parent_id && $request->status === 'done') {
            $this->checkParentCompletion($task->parent);
        }

        // If status changed from done to not-done, update parent too
        if ($oldStatus === 'done' && $request->status !== 'done' && $task->parent_id) {
            $task->parent->update(['status' => 'in_progress']);
        }

        return back();
    }

    public function updateChecklist(Request $request, Task $task)
    {
        $request->validate(['completed_checklist' => 'required|array']);

        $completed = $request->completed_checklist;
        $task->update(['completed_checklist' => $completed]);

        // Auto-mark done if all checklist items completed
        $totalItems = count($task->checklist_items ?? []);
        $completedItems = count(array_filter($completed));

        if ($totalItems > 0 && $completedItems === $totalItems && $task->status !== 'done') {
            $task->update(['status' => 'done']);
            if ($task->parent_id) {
                $this->checkParentCompletion($task->parent);
            }
        }

        return back();
    }

    public function assign(Request $request, Task $task, ResourceAllocationService $service)
    {
        $request->validate([
            'team_member_id' => 'required|exists:team_members,id',
            'reason' => 'nullable|string',
        ]);

        $service->reassignTask($task, $request->team_member_id, $request->reason ?? 'Manual reassignment');

        return back();
    }

    /**
     * Bulk reassign all tasks from one member to another.
     */
    public function bulkReassign(Request $request, ResourceAllocationService $service)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'from_member_id' => 'required|exists:team_members,id',
            'to_member_id' => 'required|exists:team_members,id',
            'reason' => 'nullable|string',
        ]);

        $tasks = Task::where('project_id', $request->project_id)
            ->where('assigned_to', $request->from_member_id)
            ->get();

        foreach ($tasks as $task) {
            $service->reassignTask($task, $request->to_member_id, $request->reason ?? 'Bulk reassignment from Resource Commitment');
        }

        return back()->with('success', "Reassigned {$tasks->count()} tasks to new team member.");
    }

    /**
     * Check if all children of a parent task are done, and auto-complete the parent.
     */
    private function checkParentCompletion(Task $parent): void
    {
        $allDone = $parent->children()
            ->where('status', '!=', 'done')
            ->doesntExist();

        if ($allDone && $parent->status !== 'done') {
            $parent->update(['status' => 'done']);
        }
    }
}
