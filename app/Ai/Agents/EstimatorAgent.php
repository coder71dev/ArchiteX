<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class EstimatorAgent implements Agent, Conversational, HasStructuredOutput
{
    use Promptable, RemembersConversations;

    protected string $model = 'gemini-1.5-flash-latest';

    /**
     * Get the timeout for the agent prompt.
     */
    public function timeout(): int
    {
        return 120;
    }

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
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'total_hours' => $schema->integer()->description('Total estimated development hours'),
            'duration_weeks' => $schema->integer()->description('Calendar weeks estimated for completion'),
            'team_composition' => $schema->array()->items(
                $schema->object([
                    'role' => $schema->string(),
                    'count' => $schema->integer(),
                    'hours_per_day' => $schema->integer(),
                ])
            ),
            'phase_breakdown' => $schema->array()->items(
                $schema->object([
                    'phase' => $schema->string(),
                    'hours' => $schema->integer(),
                    'team' => $schema->array()->items($schema->string()),
                ])
            ),
            'assumptions' => $schema->array()->items($schema->string())->description('Key assumptions made for these estimates'),
            'risk_buffer_percent' => $schema->integer()->description('Suggested risk buffer percentage'),
        ];
    }
}
