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
        $project->update(['latest_status_message' => null]);

        try {
            $maxVersion = (int) ($project->blueprints()->max('version') ?? 0);
            $targetVersion = $this->isUpdate ? ($maxVersion + 1) : max(1, $maxVersion);

            $payload = [
                'project' => $project,
                'message' => $this->message,
                'isUpdate' => $this->isUpdate,
                'targetVersion' => $targetVersion,
            ];

            \Illuminate\Support\Facades\Pipeline::send($payload)
                ->through([
                    \App\Ai\Workflows\Steps\GenerateBlueprint::class,
                    \App\Ai\Workflows\Steps\GenerateParallelEstimateAndProposal::class,
                    \App\Ai\Workflows\Steps\GenerateTasks::class,
                ])
                ->then(fn ($payload) => $payload);

            // Finalizing
            $project->update([
                'status' => 'proposed',
                'current_phase' => 'completed',
                'error_message' => null,
                'latest_status_message' => null,
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
