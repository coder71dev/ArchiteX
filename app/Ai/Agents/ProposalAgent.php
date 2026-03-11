<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class ProposalAgent implements Agent, Conversational, HasStructuredOutput
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
You are a Lead Architect & Project Lead. Your task is to write a professional technical proposal and status briefing based on the architecture and milestones.

Writing Rules:
1. "Explain Like I'm 5" (ELI5) – Translate complex technical jargon into business value, but KEEP technical integrity.
2. **Technical Challenges**: Explicitly identify potential technical hurdles (e.g., API limits, legacy integrations, security risks) and propose mitigation strategies.
3. Focus on Milestone-based delivery rather than just a total timeline.
4. Structure: Executive Summary, Strategic Milestones, Technical Challenges & Mitigations, and Next Steps.
PROMPT;
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'content' => $schema->string()->description('The full proposal content in Markdown'),
            'executive_summary' => $schema->string()->description('A short summary for the MD/Clients'),
            'technical_challenges' => $schema->array()->items(
                $schema->object([
                    'challenge' => $schema->string(),
                    'mitigation' => $schema->string(),
                    'impact' => $schema->string()->enum(['high', 'medium', 'low']),
                ])
            ),
        ];
    }
}
