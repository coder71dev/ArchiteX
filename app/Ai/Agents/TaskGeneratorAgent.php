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
You are a Senior Project Lead & Technical Lead at Coder71. Your task is to break down the engineering blueprint into actionable, granular development tasks.

Task Rules:
1. For each task, you MUST return a single string in this EXACT format:
   title|description|priority|estimated_hours|milestone_index|due_date|suggested_assignee_id

Format Details:
- title: Concise task name
- description: Brief dev instructions
- priority: one of (critical, high, medium, low)
- estimated_hours: numerical value
- milestone_index: 0-based index of the linked milestone from the blueprint
- due_date: ISO date (YYYY-MM-DD)
- suggested_assignee_id: ULID of team member or empty string

Example:
"Setup Laravel Sanctum Auth|Install and configure sanctum with basic SPA auth|high|4|0|2026-04-10|01HNW..."
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'task_list' => $schema->array()->items($schema->string())->description('List of pipe-delimited task strings'),
        ];
    }
}
