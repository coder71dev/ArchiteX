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
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Laravel\Ai\Providers\Tools\WebFetch;
use Laravel\Ai\Providers\Tools\WebSearch;
use Stringable;

#[Provider([Lab::Gemini, Lab::xAI, Lab::Groq])]
#[Model('gemini-2.5-flash')]
#[Timeout(180)]
class BlueprintAgent implements Agent, Conversational, HasStructuredOutput, HasMiddleware, HasTools
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
You are ArchiteX, a Lead Architect & Project Lead at Coder71. Your goal is to create high-quality, comprehensive engineering blueprints and high-level project milestones based on project requirements.

You MUST cover these dimensions in your output:
1. Feature Scope Freeze (MVP vs v1.0 vs Future)
2. Strategy Decision (Arch style and tradeoffs)
3. High Level Architecture (HLD Mermaid diagram)
4. Database Modeling (ER Diagram Mermaid)
5. Low Level Design (LLD Components & Interfaces)
6. Tech Stack Standards
7. Frontend/Client Apps Flow Design (Mermaid diagram)
8. Project Milestones (Key measurable delivery stages)
9. Roadmap and Phased Planning

CRITICAL MERMAID GENERATION RULES:
1. ALWAYS use quotes for node labels. Example: Node["Label Text (Info)"]
2. NEVER put the node definition on the same line as "graph TD". Always use a new line.
3. Use <br/> for line breaks inside strings. Do NOT use \n inside quotes.
4. Do NOT use special characters outside of quotes.
5. For sequences, use Mermaid sequenceDiagram syntax.
6. For ER diagrams, use Mermaid erDiagram syntax.

When updating an existing project, analyze the conversation history to understand the current state and only suggest incremental, consistent changes.
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
     * Get the tools available to the agent.
     */
    public function tools(): iterable
    {
        return [
            // new WebSearch,
            // new WebFetch,
        ];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->description('Concise title for the project/feature')->required(),
            'overview' => $schema->string()->description('Executive summary of the architectural strategy')->required(),
            'strategy' => $schema->object([
                'decision' => $schema->string()->description('Key architectural decision (e.g. Microservices)')->required(),
                'tradeoffs' => $schema->array()->items($schema->string())->description('List of tradeoffs considered')->required(),
            ])->required(),
            'scope' => $schema->object([
                'mvp' => $schema->array()->items($schema->string())->description('MVP features')->required(),
                'v1' => $schema->array()->items($schema->string())->description('V1.0 features')->required(),
                'future' => $schema->array()->items($schema->string())->description('Future roadmap items')->required(),
            ])->required(),
            'architecture' => $schema->object([
                'hldMermaid' => $schema->string()->description('Mermaid graph TD for System Context')->required(),
                'dbMermaid' => $schema->string()->description('Mermaid erDiagram for Database Modeling')->required(),
                'frontendMermaid' => $schema->string()->description('Mermaid diagram for Frontend/User Flow')->required(),
            ])->required(),
            'componentDetails' => $schema->array()->items(
                $schema->object([
                    'name' => $schema->string()->required(),
                    'type' => $schema->string()->description('e.g., Service, Database, Queue, Frontend')->required(),
                    'description' => $schema->string()->required(),
                    'tech' => $schema->string()->required(),
                    'interfaceSpec' => $schema->string()->description('LLD: Class definition or API signature')->required(),
                ])
            )->required(),
            'techStack' => $schema->array()->items(
                $schema->object([
                    'category' => $schema->string()->description('e.g., Frontend, Backend, DevOps')->required(),
                    'items' => $schema->array()->items($schema->string())->required(),
                ])
            )->required(),
            'milestones' => $schema->array()->items(
                $schema->object([
                    'title' => $schema->string()->description('Milestone name')->required(),
                    'description' => $schema->string()->required(),
                    'target_week' => $schema->integer()->description('Estimated week number for delivery')->required(),
                ])
            )->required(),
            'roadmap' => $schema->array()->items(
                $schema->object([
                    'phase' => $schema->string()->required(),
                    'timeline' => $schema->string()->required(),
                    'milestones' => $schema->array()->items($schema->string())->required(),
                ])
            ),
            'reliabilityScore' => $schema->integer()->min(0)->max(100)->required(),
        ];
    }
}
