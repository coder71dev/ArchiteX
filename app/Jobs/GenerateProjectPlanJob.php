<?php

namespace App\Jobs;

use App\Ai\Workflows\Steps\GenerateBlueprint;
use App\Ai\Workflows\Steps\GenerateParallelEstimateAndProposal;
use App\Ai\Workflows\Steps\GenerateTasks;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Pipeline;
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
        public bool $isUpdate = false,
        public bool $isRetry = false
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

            // If it's a retry, we keep the same version.
            // If it's an update from chat, we increment.
            // If it's pure initial generation, target is 1.
            $targetVersion = match (true) {
                $this->isRetry => max(1, $maxVersion),
                $this->isUpdate => ($maxVersion + 1),
                default => 1
            };

            $payload = [
                'project' => $project,
                'message' => $this->message,
                'isUpdate' => $this->isUpdate,
                'targetVersion' => $targetVersion,
            ];

            Pipeline::send($payload)
                ->through([
                    GenerateBlueprint::class,
                    GenerateParallelEstimateAndProposal::class,
                    GenerateTasks::class,
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
            Log::error('Project Generation Failed: '.$e->getMessage(), [
                'project_id' => $project->id,
                'trace' => $e->getTraceAsString(),
            ]);

            $project->update([
                'status' => 'draft',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
