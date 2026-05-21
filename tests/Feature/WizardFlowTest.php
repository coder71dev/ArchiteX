<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WizardFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_project_idea(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('projects.wizard.idea'), [
            'brief' => 'I want to build a food delivery app like UberEats but for pets.',
            'client_name' => 'PetEats Inc',
            'budget' => '$50k - $100k',
            'timeline' => '6 months',
        ]);

        $response->assertRedirect();

        $project = Project::latest()->first();
        $this->assertNotNull($project);
        $this->assertEquals('idea_submitted', $project->planning_phase);
        $this->assertEquals('PetEats Inc', $project->client_name);
    }

    public function test_questions_page_shows_clarifying_questions(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'planning_phase' => 'clarifying_questions',
            'clarifying_questions' => [
                'questions' => [
                    ['question' => 'What payment methods?', 'reason' => 'Affects architecture', 'category' => 'scope'],
                ],
                'suggested_timeline' => '6 months',
            ],
        ]);

        $response = $this->actingAs($user)->get(route('projects.questions', $project->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Questions')
            ->has('project')
        );
    }

    public function test_user_can_submit_answers_and_trigger_plan_generation(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'planning_phase' => 'clarifying_questions',
            'clarifying_questions' => [
                'questions' => [
                    ['question' => 'What payment methods?', 'reason' => 'Affects architecture', 'category' => 'scope'],
                ],
            ],
        ]);

        $response = $this->actingAs($user)->post(route('projects.wizard.answers', $project->id), [
            'answers' => ['Credit cards, PayPal, Apple Pay'],
        ]);

        $response->assertRedirect();

        $project->refresh();
        $this->assertEquals('questions_answered', $project->planning_phase);
    }

    public function test_milestones_page_is_accessible_after_plan_ready(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'planning_phase' => 'plan_ready',
        ]);

        $response = $this->actingAs($user)->get(route('projects.milestones', $project->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Milestones')
        );
    }

    public function test_show_redirects_to_wizard_if_not_active(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'planning_phase' => 'clarifying_questions',
        ]);

        $response = $this->actingAs($user)->get(route('projects.show', $project->id));

        $response->assertRedirect(route('projects.questions', $project->id));
    }

    public function test_show_works_when_project_is_active(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'user_id' => $user->id,
            'planning_phase' => 'active',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($user)->get(route('projects.show', $project->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Show')
        );
    }
}
