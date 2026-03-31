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
class BlueprintAgent implements Agent, Conversational, HasMiddleware, HasStructuredOutput, HasTools
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
3. Business Context (Identify challenges and strategic suggestions)
4. High Level Architecture (HLD Mermaid diagram)
5. Database Modeling (ER Diagram Mermaid)
6. Technical Considerations (Scalability, Security, Performance)
7. Tech Stack Selection (With specific rationales and recommended alternatives)
8. Frontend/Client Apps Flow Design (Mermaid diagram)
9. Project Milestones & Roadmap
10. Client Clarifications (Open questions)

CRITICAL ANALYSIS RULES:
- Identify underlying business risks and challenges from the brief.
- Provide strategic, actionable suggestions for product success.
- For every tech choice, explain the 'Why' (rationale) and suggest 'Next Best' alternatives.
- Keep the technical considerations practical and grounded in the tech stack choices.
- RIGHT-SIZE the architecture: Default to Monoliths or Majestic Monoliths for simple startups, side projects, or low-budget requests. NEVER suggest event-driven microservices unless explicitly justified by high scale, enterprise complexity, or global distribution needs.
- Match Tech Stack choices with actual Team Capabilities provided in the prompt context.

CRITICAL MERMAID GENERATION RULES:
1. ALWAYS start the string with the diagram type (e.g., "graph TD", "erDiagram", "sequenceDiagram").
2. ALWAYS include a SPACE or NEWLINE after the diagram signature (e.g., "graph TD\nNodeID").
3. For "graph TD":
   - Use ALWAYS quotes for node labels: NodeID["Label Text"].
   - Avoid special characters in NodeIDs (use alpha-numeric only).
   - Use <br/> for line breaks inside quotes. Do NOT use \n.
3. For "erDiagram":
   - Use standard entity naming: ENTITY_NAME { string field_name }.
   - NO quotes for entity names or fields.
4. For "sequenceDiagram":
   - ParticipantID["Display Name"].
5. NEVER start the diagram with triple backticks (```) or code block markers. Just the pure mermaid code.

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
            'businessContext' => $schema->object([
                'challenges' => $schema->array()->items($schema->string())->description('Key business challenges identified')->required(),
                'suggestions' => $schema->array()->items($schema->string())->description('Strategic suggestions for business growth')->required(),
            ])->required(),
            'architecture' => $schema->object([
                'hldMermaid' => $schema->string()->description('Mermaid graph TD for System Context')->required(),
                'dbMermaid' => $schema->string()->description('Mermaid erDiagram for Database Modeling')->required(),
                'frontendMermaid' => $schema->string()->description('Mermaid diagram for Frontend/User Flow')->required(),
                'considerations' => $schema->array()->items($schema->string())->description('Technical architectural considerations')->required(),
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
                    'rationale' => $schema->string()->description('Why this stack was chosen')->required(),
                    'alternatives' => $schema->array()->items($schema->string())->description('Recommended alternatives')->required(),
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
            'clientQuestions' => $schema->array()->items(
                $schema->object([
                    'question' => $schema->string()->required(),
                    'reason' => $schema->string()->description('Why this needs clarification')->required(),
                ])
            )->required(),
            'reliabilityScore' => $schema->integer()->min(0)->max(100)->required(),
        ];
    }
}
