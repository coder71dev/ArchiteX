<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class TaskGeneratorAgent implements Agent, Conversational, HasStructuredOutput
{
    use Promptable, RemembersConversations;

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
You are a Senior Project Lead & Technical Lead. Your task is to break down the engineering blueprint into actionable, granular development tasks and pin them to project milestones.

Task Rules:
1. Each task MUST be pinned to a specific Milestone from the blueprint using a 0-based index.
2. Assign logical due dates based on the milestone target week and estimated hours.
3. Suggest a teammate based on the skills roster provided in context (e.g. React tasks to Frontend devs).
4. Estimate hours for each task individually.
5. group tasks by Phase and Milestone.
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'tasks' => $schema->array()->items(
                $schema->object([
                    'title' => $schema->string(),
                    'description' => $schema->string(),
                    'priority' => $schema->string()->enum(['critical', 'high', 'medium', 'low']),
                    'estimated_hours' => $schema->number(),
                    'milestone_index' => $schema->integer()->description('0-based index of the linked milestone'),
                    'due_date' => $schema->string()->description('ISO date (YYYY-MM-DD) for task completion'),
                    'phase' => $schema->string(),
                    'suggested_assignee_id' => $schema->string()->nullable()->description('ULID of the suggested team member'),
                ])
            ),
        ];
    }
}
