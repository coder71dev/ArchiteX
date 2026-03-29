<?php

namespace App\Ai\Workflows\Steps;

use App\Ai\Agents\BlueprintAgent;
use App\Models\Project;
use Closure;
use Illuminate\Support\Facades\Log;

class GenerateBlueprint
{
    /**
     * Handle the pipeline step.
     */
    public function __invoke(array $payload, Closure $next)
    {
        /** @var Project $project */
        $project = $payload['project'];
        $user = $project->user;
        $targetVersion = $payload['targetVersion'];
        $message = $payload['message'] ?? 'Initial Generation';

        // Check if blueprint exists
        $blueprintExists = $project->blueprints()->where('version', $targetVersion)->exists();
        if ($blueprintExists) {
            return $next($payload);
        }

        $project->update(['current_phase' => 'blueprint', 'status' => 'planning']);

        // --- Evaluator-Optimizer Pattern ---
        $blueprintAgent = new BlueprintAgent();
        if ($project->conversation_id) {
            $blueprintAgent->continue($project->conversation_id, $user);
        } else {
            $blueprintAgent->forUser($user);
        }

        $attempts = 0;
        $maxAttempts = 3;
        $blueprintData = null;
        $reliabilityScore = 0;
        $improvementFeedback = "";

        while ($attempts < $maxAttempts && $reliabilityScore < 80) {
            $prompt = $attempts === 0 
                ? $message 
                : "Your previous blueprint had a reliability score of {$reliabilityScore}. Please improve it based on these issues: {$improvementFeedback}. Request: {$message}";

            /** @var \Laravel\Ai\Responses\StructuredAgentResponse $response */
            $response = $blueprintAgent->prompt($prompt);
            $blueprintData = $response->structured;
            $reliabilityScore = $blueprintData['reliabilityScore'] ?? 0;

            if ($reliabilityScore < 80) {
                // If the score is low, try again
                $improvementFeedback = "The technical strategy needs more detail on database normalization and the HLD diagram lacks external service integrations.";
                Log::info("Blueprint attempt {$attempts} for project {$project->id} failed quality check (score: {$reliabilityScore}). Retrying...");
            }

            if (!$project->conversation_id && $response->conversationId) {
                $project->update(['conversation_id' => $response->conversationId]);
            }

            $attempts++;
        }

        Log::info("Blueprint generated for project {$project->id} with score {$reliabilityScore} after {$attempts} attempts.");

        if (!$payload['isUpdate'] || isset($blueprintData['title'])) {
            $project->update(['title' => $blueprintData['title'] ?? $project->title]);
        }

        $project->blueprints()->create([
            'version' => $targetVersion,
            'change_summary' => $payload['isUpdate'] ? $message : 'Initial Generation',
            'overview' => $blueprintData['overview'] ?? 'Architecture overview not available.',
            'strategy' => $blueprintData['strategy'] ?? [],
            'scope' => $blueprintData['scope'] ?? [],
            'architecture' => $blueprintData['architecture'] ?? [],
            'component_details' => $blueprintData['componentDetails'] ?? [],
            'tech_stack' => $blueprintData['techStack'] ?? [],
            'milestones' => $blueprintData['milestones'] ?? [],
            'roadmap' => $blueprintData['roadmap'] ?? [],
            'reliability_score' => $reliabilityScore,
        ]);

        return $next($payload);
    }
}
