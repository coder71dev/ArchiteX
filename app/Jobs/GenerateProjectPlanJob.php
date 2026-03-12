<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\TeamMember;
use App\Ai\Agents\BlueprintAgent;
use App\Ai\Agents\EstimatorAgent;
use App\Ai\Agents\ProposalAgent;
use App\Ai\Agents\TaskGeneratorAgent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateProjectPlanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600; // 10 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Project $project,
        public string $message,
        public bool $isUpdate = false
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $project = $this->project;
        $user = $project->user;
        $team = TeamMember::where('is_active', true)->get();

        try {
            // --- PHASE 1: BLUEPRINT ---
            $project->update(['current_phase' => 'blueprint', 'status' => 'planning']);
            
            $blueprintAgent = new BlueprintAgent();
            if ($project->conversation_id) {
                $blueprintAgent->continue($project->conversation_id, $user);
            } else {
                $blueprintAgent->forUser($user);
            }

            /** @var \Laravel\Ai\Responses\StructuredAgentResponse $blueprintResponse */
            $blueprintResponse = $blueprintAgent->prompt($this->message);
            $blueprintData = $blueprintResponse->structured;

            if (!$this->isUpdate || isset($blueprintData['title'])) {
                $project->update(['title' => $blueprintData['title'] ?? $project->title]);
            }

            // The SDK sets conversation_id on the response (not on the agent when using forUser())
            if (!$project->conversation_id && $blueprintResponse->conversationId) {
                $project->update(['conversation_id' => $blueprintResponse->conversationId]);
                $project->refresh(); // ensure conversation_id is available for subsequent agents
            }

            $newVersion = ($project->blueprints()->max('version') ?? 0) + 1;
            $blueprint = $project->blueprints()->create([
                'version' => $newVersion,
                'change_summary' => $this->isUpdate ? $this->message : 'Initial Generation',
                'overview' => $blueprintData['overview'] ?? 'Architecture overview not available.',
                'strategy' => $blueprintData['strategy'] ?? [],
                'scope' => $blueprintData['scope'] ?? [],
                'architecture' => $blueprintData['architecture'] ?? [],
                'component_details' => $blueprintData['componentDetails'] ?? [],
                'tech_stack' => $blueprintData['techStack'] ?? [],
                'milestones' => $blueprintData['milestones'] ?? [],
                'roadmap' => $blueprintData['roadmap'] ?? [],
                'reliability_score' => $blueprintData['reliabilityScore'] ?? 0,
            ]);

            // --- PHASE 2: ESTIMATE ---
            $project->update(['current_phase' => 'estimation']);
            $estimatorAgent = (new EstimatorAgent())->continue($project->conversation_id, $user);
            
            $estimatePrompt = "Based on the updated blueprint (v{$newVersion}), provide time and manpower estimates. Available team members: " . json_encode($team);
            /** @var \Laravel\Ai\Responses\StructuredAgentResponse $estimateResponse */
            $estimateResponse = $estimatorAgent->prompt($estimatePrompt);
            $estimateData = $estimateResponse->structured;
            
            $project->estimates()->create(array_merge($estimateData ?? [], [
                'version' => $newVersion,
            ]));

            // --- PHASE 3: PROPOSAL ---
            $project->update(['current_phase' => 'proposal']);
            $proposalAgent = (new ProposalAgent())->continue($project->conversation_id, $user);
            
            $proposalPrompt = "Generate a technical proposal and status briefing for '{$project->client_name}' based on the v{$newVersion} plan. Focus on milestones and technical challenges.";
            /** @var \Laravel\Ai\Responses\StructuredAgentResponse $proposalResponse */
            $proposalResponse = $proposalAgent->prompt($proposalPrompt);
            $proposalData = $proposalResponse->structured;
            
            $project->proposals()->create([
                'version'              => $newVersion,
                'content'              => $proposalData['content'] ?? 'Proposal content not available.',
                'executive_summary'    => $proposalData['executive_summary'] ?? null,
                'technical_challenges' => $proposalData['technical_challenges'] ?? [],
                'tone'                 => 'formal',
            ]);

            // --- PHASE 4: TASKS ---
            $project->update(['current_phase' => 'tasks']);
            $taskAgent = (new TaskGeneratorAgent())->continue($project->conversation_id, $user);
            
            $taskPrompt = "Generate granular, assignable developer tasks for the team based on blueprint v{$newVersion}. Ensure every task is pinned to a milestone.";
            /** @var \Laravel\Ai\Responses\StructuredAgentResponse $taskResponse */
            $taskResponse = $taskAgent->prompt($taskPrompt);
            $taskData = $taskResponse->structured;

            if (isset($taskData['tasks']) && is_array($taskData['tasks'])) {
                foreach ($taskData['tasks'] as $taskItem) {
                    $project->tasks()->create([
                        'blueprint_version' => $newVersion,
                        'assigned_to' => $taskItem['suggested_assignee_id'] ?? null,
                        'milestone_index' => $taskItem['milestone_index'] ?? null,
                        'title' => $taskItem['title'],
                        'description' => $taskItem['description'],
                        'priority' => $taskItem['priority'],
                        'due_date' => $taskItem['due_date'] ?? null,
                        'estimated_hours' => $taskItem['estimated_hours'],
                        'phase' => $taskItem['phase'],
                    ]);
                }
            }

            // Finalizing
            $project->update([
                'status' => 'proposed',
                'current_phase' => 'completed',
                'error_message' => null
            ]);

        } catch (Throwable $e) {
            Log::error('Project Generation Failed: ' . $e->getMessage(), [
                'project_id' => $project->id,
                'trace' => $e->getTraceAsString()
            ]);

            $project->update([
                'status' => 'draft',
                'error_message' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
}
