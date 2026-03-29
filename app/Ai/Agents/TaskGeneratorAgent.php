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
class TaskGeneratorAgent implements Agent, Conversational, HasStructuredOutput, HasMiddleware
{
    use Promptable, RemembersConversations;

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
            'task_list' => $schema->array()->items($schema->string())->description('List of pipe-delimited task strings')->required(),
        ];
    }
}
