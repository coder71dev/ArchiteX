<?php

namespace Tests\Unit;

use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\ResourceAllocationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceAllocationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ResourceAllocationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ResourceAllocationService;
    }

    public function test_calculate_workload_returns_correct_data(): void
    {
        $member = TeamMember::factory()->create([
            'availability_hours' => 40,
            'stack' => 'backend',
        ]);

        // Create assigned tasks
        Task::factory()->create([
            'assigned_to' => $member->id,
            'estimated_hours' => 10,
            'status' => 'todo',
        ]);
        Task::factory()->create([
            'assigned_to' => $member->id,
            'estimated_hours' => 5,
            'status' => 'in_progress',
        ]);
        Task::factory()->create([
            'assigned_to' => $member->id,
            'estimated_hours' => 8,
            'status' => 'done',
        ]);

        $workload = $this->service->calculateWorkload($member->id);

        $this->assertEquals(15, $workload['used']); // 10 + 5 (done tasks excluded)
        $this->assertEquals(40, $workload['total']);
        $this->assertEquals(37.5, $workload['percentage']);
        $this->assertFalse($workload['is_overallocated']);
    }

    public function test_calculate_workload_flags_overallocation(): void
    {
        $member = TeamMember::factory()->create([
            'availability_hours' => 20,
            'stack' => 'frontend',
        ]);

        Task::factory()->create([
            'assigned_to' => $member->id,
            'estimated_hours' => 25,
            'status' => 'todo',
        ]);

        $workload = $this->service->calculateWorkload($member->id);

        $this->assertTrue($workload['is_overallocated']);
        $this->assertEquals(125.0, $workload['percentage']);
    }

    public function test_reassign_task_moves_assignment_and_logs(): void
    {
        $member1 = TeamMember::factory()->create(['stack' => 'backend']);
        $member2 = TeamMember::factory()->create(['stack' => 'backend']);
        $task = Task::factory()->create([
            'assigned_to' => $member1->id,
            'stack' => 'backend',
        ]);

        $this->actingAs(User::factory()->create());
        $this->service->reassignTask($task, $member2->id, 'Rebalancing workload');

        $task->refresh();
        $this->assertEquals($member2->id, $task->assigned_to);

        $this->assertDatabaseHas('task_assignment_logs', [
            'task_id' => $task->id,
            'from_member_id' => $member1->id,
            'to_member_id' => $member2->id,
            'reason' => 'Rebalancing workload',
        ]);
    }

    public function test_auto_assign_assigns_by_stack(): void
    {
        $project = Project::factory()->create();
        $backendDev = TeamMember::factory()->create(['stack' => 'backend', 'skills' => ['Laravel', 'PHP']]);
        $frontendDev = TeamMember::factory()->create(['stack' => 'frontend', 'skills' => ['React', 'Vue']]);

        // Create unassigned tasks
        Task::factory()->create([
            'project_id' => $project->id,
            'stack' => 'backend',
            'title' => 'API Development',
            'assigned_to' => null,
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'stack' => 'frontend',
            'title' => 'Login Page',
            'assigned_to' => null,
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'stack' => 'backend',
            'title' => 'Database Schema',
            'assigned_to' => null,
        ]);

        $result = $this->service->autoAssignTasks($project->id);

        $this->assertEquals(3, $result['assigned']);
        $this->assertEquals(0, $result['unassigned']);

        // All backend tasks should go to backendDev
        $backendTasks = Task::where('project_id', $project->id)
            ->where('stack', 'backend')
            ->get();
        foreach ($backendTasks as $task) {
            $this->assertEquals($backendDev->id, $task->assigned_to);
        }

        // Frontend task should go to frontendDev
        $frontendTask = Task::where('project_id', $project->id)
            ->where('stack', 'frontend')
            ->first();
        $this->assertEquals($frontendDev->id, $frontendTask->assigned_to);
    }

    public function test_get_team_workload_returns_all_members(): void
    {
        $member1 = TeamMember::factory()->create(['stack' => 'backend', 'is_active' => true]);
        $member2 = TeamMember::factory()->create(['stack' => 'frontend', 'is_active' => true]);
        TeamMember::factory()->create(['is_active' => false]);

        $workloads = $this->service->getTeamWorkload();

        $this->assertCount(2, $workloads);
        $stacks = $workloads->pluck('stack')->toArray();
        $this->assertContains('backend', $stacks);
        $this->assertContains('frontend', $stacks);
    }
}
