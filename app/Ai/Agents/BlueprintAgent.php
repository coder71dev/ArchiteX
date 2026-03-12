<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class BlueprintAgent implements Agent, Conversational, HasStructuredOutput
{
    use Promptable, RemembersConversations;

    protected string $model = 'gemini-1.5-flash-latest';
    
    /**
     * Get the timeout for the agent prompt.
     */
    public function timeout(): int
    {
        return 180;
    }

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
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->description('Concise title for the project/feature'),
            'overview' => $schema->string()->description('Executive summary of the architectural strategy'),
            'strategy' => $schema->object([
                'decision' => $schema->string()->description('Key architectural decision (e.g. Microservices)'),
                'tradeoffs' => $schema->array()->items($schema->string())->description('List of tradeoffs considered'),
            ]),
            'scope' => $schema->object([
                'mvp' => $schema->array()->items($schema->string())->description('MVP features'),
                'v1' => $schema->array()->items($schema->string())->description('V1.0 features'),
                'future' => $schema->array()->items($schema->string())->description('Future roadmap items'),
            ]),
            'architecture' => $schema->object([
                'hldMermaid' => $schema->string()->description('Mermaid graph TD for System Context'),
                'dbMermaid' => $schema->string()->description('Mermaid erDiagram for Database Modeling'),
                'frontendMermaid' => $schema->string()->description('Mermaid diagram for Frontend/User Flow'),
            ]),
            'componentDetails' => $schema->array()->items(
                $schema->object([
                    'name' => $schema->string(),
                    'type' => $schema->string()->description('e.g., Service, Database, Queue, Frontend'),
                    'description' => $schema->string(),
                    'tech' => $schema->string(),
                    'interfaceSpec' => $schema->string()->description('LLD: Class definition or API signature'),
                ])
            ),
            'techStack' => $schema->array()->items(
                $schema->object([
                    'category' => $schema->string()->description('e.g., Frontend, Backend, DevOps'),
                    'items' => $schema->array()->items($schema->string()),
                ])
            ),
            'milestones' => $schema->array()->items(
                $schema->object([
                    'title' => $schema->string()->description('Milestone name'),
                    'description' => $schema->string(),
                    'target_week' => $schema->integer()->description('Estimated week number for delivery'),
                ])
            ),
            'roadmap' => $schema->array()->items(
                $schema->object([
                    'phase' => $schema->string(),
                    'timeline' => $schema->string(),
                    'milestones' => $schema->array()->items($schema->string()),
                ])
            ),
            'reliabilityScore' => $schema->integer()->min(0)->max(100),
        ];
    }
}
