<?php

namespace App\Ai\Workflows\Steps;

use App\Ai\Agents\EstimatorAgent;
use App\Ai\Agents\ProposalAgent;
use App\Models\Project;
use App\Models\TeamMember;
use Closure;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\Log;

class GenerateParallelEstimateAndProposal
{
    /**
     * Handle the pipeline step using Concurrency to run multiple agents.
     */
    public function __invoke(array $payload, Closure $next)
    {
        /** @var Project $project */
        $project = $payload['project'];
        $user = $project->user;
        $targetVersion = $payload['targetVersion'];
        $team = TeamMember::where('is_active', true)->get();

        $estimateExists = $project->estimates()->where('version', $targetVersion)->exists();
        $proposalExists = $project->proposals()->where('version', $targetVersion)->exists();

        if ($estimateExists && $proposalExists) {
            return $next($payload);
        }

        $project->update(['current_phase' => 'estimation_and_proposal']);

        // --- Parallelization Pattern ---
        $tasks = [];

        if (!$estimateExists) {
            $tasks['estimate'] = function () use ($project, $user, $targetVersion, $team) {
                $estimatorAgent = (new EstimatorAgent())->continue($project->conversation_id, $user);
                $estimatePrompt = "Based on the updated blueprint (v{$targetVersion}), provide time and manpower estimates. Available team members: " . json_encode($team);
                /** @var \Laravel\Ai\Responses\StructuredAgentResponse $estimateResponse */
                $estimateResponse = $estimatorAgent->prompt($estimatePrompt);
                $estimateData = $estimateResponse->structured;

                return $project->estimates()->create(array_merge($estimateData ?? [], [
                    'version' => $targetVersion,
                ]));
            };
        }

        if (!$proposalExists) {
            $tasks['proposal'] = function () use ($project, $user, $targetVersion) {
                $proposalAgent = (new ProposalAgent())->continue($project->conversation_id, $user);
                $proposalPrompt = "Generate a technical proposal and status briefing for '{$project->client_name}' based on the v{$targetVersion} plan. Focus on milestones and technical challenges.";
                /** @var \Laravel\Ai\Responses\StructuredAgentResponse $proposalResponse */
                $proposalResponse = $proposalAgent->prompt($proposalPrompt);
                $proposalData = $proposalResponse->structured;

                return $project->proposals()->create([
                    'version'              => $targetVersion,
                    'content'              => $proposalData['content'] ?? 'Proposal content not available.',
                    'executive_summary'    => $proposalData['executive_summary'] ?? null,
                    'technical_challenges' => $proposalData['technical_challenges'] ?? [],
                    'tone'                 => 'formal',
                ]);
            };
        }

        if (!empty($tasks)) {
            Log::info("Running Estimate and Proposal in parallel for Project {$project->id}");
            Concurrency::run($tasks);
        }

        return $next($payload);
    }
}
