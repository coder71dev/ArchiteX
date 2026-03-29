<?php

namespace App\Listeners;

use App\Models\Project;
use Laravel\Ai\Events\AgentFailedOver;
use Illuminate\Support\Facades\Log;

class UpdateProjectOnAiFailover
{
    /**
     * Handle the event.
     */
    public function handle(AgentFailedOver $event): void
    {
        /** @var \Laravel\Ai\Contracts\Agent|\Laravel\Ai\Concerns\RemembersConversations $agent */
        $agent = $event->agent;
        
        // Check for the existence of the method from RemembersConversations trait
        if (!method_exists($agent, 'currentConversation')) {
            return;
        }

        $conversationId = $agent->currentConversation();

        if (!$conversationId) {
            return;
        }

        // Find the project associated with this conversation
        $project = Project::where('conversation_id', $conversationId)->first();

        if ($project) {
            $providerName = ucfirst($event->provider->name() ?? 'Backup');
            
            // Log for internal tracking
            Log::warning("AI Failover detected for Project {$project->id}: " . get_class($agent) . " switched to {$providerName}.");

            // Update project with a visual message for the UI
            $project->update([
                'latest_status_message' => "Primary AI (Gemini) went offline. Switching to Neural Backup ({$providerName})..."
            ]);
        }
    }
}
