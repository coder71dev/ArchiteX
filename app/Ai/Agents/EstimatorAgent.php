<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogPrompts;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider([Lab::Gemini, Lab::xAI, Lab::Groq])]
#[Model('gemini-2.5-flash')]
#[Timeout(120)]
class EstimatorAgent implements Agent, Conversational, HasStructuredOutput, HasMiddleware
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
You are an expert Project Estimator and Resource Planner at Coder71. Your task is to analyze the engineering blueprint and provide realistic time and manpower estimates.

Considerations:
1. Standard 8-hour workdays.
2. Parallel vs Sequential tasks.
3. Realistic buffers for integration and testing (usually 15-25%).
4. Team skills and availability provided in context.

When requirements change, re-evaluate how the changes affect the existing timeline.
PROMPT;
    }

    /**
     * Get the agent's middleware.
     */
    public function middleware(): array
    {
        return [
            new LogPrompts,
        ];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'total_hours' => $schema->integer()->description('Total estimated development hours')->required(),
            'duration_weeks' => $schema->integer()->description('Calendar weeks estimated for completion')->required(),
            'team_composition' => $schema->array()->items(
                $schema->object([
                    'role' => $schema->string()->required(),
                    'count' => $schema->integer()->required(),
                    'hours_per_day' => $schema->integer()->required(),
                ])
            )->required(),
            'phase_breakdown' => $schema->array()->items(
                $schema->object([
                    'phase' => $schema->string()->required(),
                    'hours' => $schema->integer()->required(),
                    'team' => $schema->array()->items($schema->string())->required(),
                ])
            )->required(),
            'assumptions' => $schema->array()->items($schema->string())->description('Key assumptions made for these estimates')->required(),
            'risk_buffer_percent' => $schema->integer()->description('Suggested risk buffer percentage')->required(),
        ];
    }
}
