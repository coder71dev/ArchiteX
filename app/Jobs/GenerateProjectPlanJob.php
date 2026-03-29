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
            // Version determination:
            // If it's an update, we want to increment the version.
            // If it's NOT an update, we are either in a fresh project (v1) 
            // OR retrying a failed attempt at the current version.
            $maxVersion = (int) ($project->blueprints()->max('version') ?? 0);
            $targetVersion = $this->isUpdate ? ($maxVersion + 1) : max(1, $maxVersion);

            // --- PHASE 1: BLUEPRINT ---
            $blueprintExists = $project->blueprints()->where('version', $targetVersion)->exists();
            if (!$blueprintExists) {
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

                if (!$project->conversation_id && $blueprintResponse->conversationId) {
                    $project->update(['conversation_id' => $blueprintResponse->conversationId]);
                    $project->refresh();
                }

                $project->blueprints()->create([
                    'version' => $targetVersion,
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
            }

            // --- PHASE 2: ESTIMATE ---
            $estimateExists = $project->estimates()->where('version', $targetVersion)->exists();
            if (!$estimateExists) {
                $project->update(['current_phase' => 'estimation']);
                $estimatorAgent = (new EstimatorAgent())->continue($project->conversation_id, $user);
                
                $estimatePrompt = "Based on the updated blueprint (v{$targetVersion}), provide time and manpower estimates. Available team members: " . json_encode($team);
                /** @var \Laravel\Ai\Responses\StructuredAgentResponse $estimateResponse */
                $estimateResponse = $estimatorAgent->prompt($estimatePrompt);
                $estimateData = $estimateResponse->structured;
                
                $project->estimates()->create(array_merge($estimateData ?? [], [
                    'version' => $targetVersion,
                ]));
            }

            // --- PHASE 3: PROPOSAL ---
            $proposalExists = $project->proposals()->where('version', $targetVersion)->exists();
            if (!$proposalExists) {
                $project->update(['current_phase' => 'proposal']);
                $proposalAgent = (new ProposalAgent())->continue($project->conversation_id, $user);
                
                $proposalPrompt = "Generate a technical proposal and status briefing for '{$project->client_name}' based on the v{$targetVersion} plan. Focus on milestones and technical challenges.";
                /** @var \Laravel\Ai\Responses\StructuredAgentResponse $proposalResponse */
                $proposalResponse = $proposalAgent->prompt($proposalPrompt);
                $proposalData = $proposalResponse->structured;
                
                $project->proposals()->create([
                    'version'              => $targetVersion,
                    'content'              => $proposalData['content'] ?? 'Proposal content not available.',
                    'executive_summary'    => $proposalData['executive_summary'] ?? null,
                    'technical_challenges' => $proposalData['technical_challenges'] ?? [],
                    'tone'                 => 'formal',
                ]);
            }

            // --- PHASE 4: TASKS ---
            // For tasks, we check if ANY task exists for this version.
            // If the failure happened mid-parsing, we might have duplicate tasks unless we clear them.
            $tasksExist = $project->tasks()->where('blueprint_version', $targetVersion)->exists();
            if (!$tasksExist) {
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
