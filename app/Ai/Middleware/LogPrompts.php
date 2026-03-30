<?php

namespace App\Ai\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;

class LogPrompts
{
    /**
     * Handle the incoming prompt.
     */
    public function handle(AgentPrompt $prompt, Closure $next)
    {
        Log::info('Prompting AI Agent', [
            'agent' => get_class($prompt->agent),
            'prompt' => $prompt->prompt,
            'model' => $prompt->model,
            'provider' => (string) $prompt->provider,
        ]);

        return $next($prompt)->then(function (AgentResponse $response) use ($prompt) {
            Log::info('AI Agent Responded', [
                'agent' => get_class($prompt->agent),
                'usage' => $response->usage,
            ]);
        });
    }
}
