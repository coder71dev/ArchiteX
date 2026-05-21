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
#[Model('gemini-1.5-flash')]
#[Timeout(180)]
class TaskGeneratorAgent implements Agent, Conversational, HasMiddleware, HasStructuredOutput
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
You are a Senior Project Lead & Technical Lead at Coder71. Your task is to break down the engineering blueprint into a hierarchical task structure with parent tasks and child tasks.

Structure Rules:
1. Group tasks by milestone index.
2. For each milestone, define ONE parent task that represents the high-level feature (e.g., "Authentication System").
3. Under each parent task, define 2-6 child tasks that break down the implementation details.
4. Each child task MUST include a checklist of specific deliverables or sub-steps.
5. Assign a stack to every task: frontend, backend, mobile, design, devops, qa, or other.

Stack Definitions:
- frontend: UI/UX, React, Vue, HTML/CSS, client-side logic
- backend: API, Laravel, Node.js, database, server logic
- mobile: Flutter, React Native, iOS, Android
- design: Figma, wireframes, UI design, branding
- devops: CI/CD, deployment, Docker, AWS, infrastructure
- qa: testing, QA automation, manual testing
- other: project management, documentation, etc.

When assigning stacks, consider the primary work involved. A "Registration API" task is backend even if it returns JSON for the frontend to consume.
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
            'task_groups' => $schema->array()->items(
                $schema->object([
                    'milestone_index' => $schema->integer()->description('0-based index of the linked milestone')->required(),
                    'parent_task' => $schema->object([
                        'title' => $schema->string()->description('High-level task name')->required(),
                        'description' => $schema->string()->description('Brief overview of this feature area')->required(),
                        'stack' => $schema->string()->enum(['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other'])->required(),
                        'estimated_hours' => $schema->integer()->description('Total hours for all work in this group')->required(),
                    ])->required(),
                    'child_tasks' => $schema->array()->items(
                        $schema->object([
                            'title' => $schema->string()->description('Specific implementation task')->required(),
                            'description' => $schema->string()->description('Detailed dev instructions')->required(),
                            'stack' => $schema->string()->enum(['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other'])->required(),
                            'estimated_hours' => $schema->integer()->description('Hours for this specific task')->required(),
                            'priority' => $schema->string()->enum(['critical', 'high', 'medium', 'low'])->required(),
                            'checklist_items' => $schema->array()->items($schema->string())->description('Specific sub-steps or deliverables')->required(),
                        ])
                    )->description('Granular child tasks under the parent')->required(),
                ])
            )->description('Hierarchical task groups organized by milestone')->required(),
        ];
    }
}
