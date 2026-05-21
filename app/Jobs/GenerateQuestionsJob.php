<?php

namespace App\Jobs;

use App\Ai\Agents\ClarifyingQuestionsAgent;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Responses\StructuredAgentResponse;

class GenerateQuestionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120;

    public function __construct(
        public Project $project,
    ) {}

    public function handle(): void
    {
        $project = $this->project;
        $user = $project->user;

        $project->update([
            'planning_phase' => 'clarifying_questions',
            'current_phase' => 'clarifying_questions',
        ]);

        $agent = new ClarifyingQuestionsAgent;
        $agent->forUser($user);

        $context = "Project Idea/Brief:\n{$project->brief}\n\n";
        if ($project->client_name) {
            $context .= "Client: {$project->client_name}\n";
        }
        if ($project->budget) {
            $context .= "Budget: {$project->budget}\n";
        }
        if ($project->timeline) {
            $context .= "Timeline Hint: {$project->timeline}\n";
        }
        if ($project->target_audience) {
            $context .= "Target Audience: {$project->target_audience}\n";
        }

        try {
            /** @var StructuredAgentResponse $response */
            $response = $agent->prompt($context);
            $data = $response->structured;

            $project->update([
                'clarifying_questions' => array_merge($data ?? [], [
                    'conversation_id' => $response->conversationId,
                ]),
                'timeline' => $project->timeline ?: ($data['suggested_timeline'] ?? null),
            ]);

            if ($response->conversationId && ! $project->conversation_id) {
                $project->update(['conversation_id' => $response->conversationId]);
            }

            Log::info("Questions generated for project {$project->id}");
        } catch (\Throwable $e) {
            Log::error("Question generation failed for project {$project->id}: {$e->getMessage()}");
            $project->update([
                'error_message' => 'Failed to generate clarifying questions: '.$e->getMessage(),
            ]);
            throw $e;
        }
    }
}
