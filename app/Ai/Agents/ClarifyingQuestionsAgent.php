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
#[Timeout(60)]
class ClarifyingQuestionsAgent implements Agent, Conversational, HasMiddleware, HasStructuredOutput
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
You are a Project Discovery Specialist at Coder71. Your job is to analyze a raw project idea or brief and ask targeted clarifying questions that will help the engineering team build an accurate plan.

Rules:
1. Ask 3 to 5 concise, specific questions.
2. Each question should help define scope, tech preferences, team size, budget, or timeline.
3. Provide a brief reason for WHY each question matters.
4. Categorize each question (e.g., "scope", "tech", "timeline", "budget").
5. For EACH question, provide 3-4 suggested answer options that a user can click to respond quickly. Include a mix of specific and open-ended options.
6. If the user provided a timeline hint, extract and return it as `suggested_timeline`.
7. If no timeline was mentioned, suggest a reasonable default timeline based on project complexity.

MANDATORY QUESTION:
- One question MUST be about tech stack preference (category: "tech"). Ask what technology stack the user prefers or if they want the AI to recommend the best fit.

Suggested Answer Guidelines:
- Make answers actionable and specific (e.g., "Laravel + React + Tailwind", "MVP with core features only")
- Include an "Other (I'll specify)" option as the last choice
- Tailor suggestions to the project type and question category
- For tech questions, recommend the best-fit modern stack based on project requirements
- Include "Recommend best-fit stack for me" as one of the options

Be direct and professional. Do not ask questions that can be answered by the brief itself.
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
            'questions' => $schema->array()->items(
                $schema->object([
                    'question' => $schema->string()->description('The clarifying question to ask the user')->required(),
                    'reason' => $schema->string()->description('Why this question matters for planning')->required(),
                    'category' => $schema->string()->description('Category: scope, tech, timeline, budget, team, or other')->required(),
                    'suggested_answers' => $schema->array()->items($schema->string())->description('3-4 clickable answer options for the user, with "Other (custom)" as the last option')->required(),
                ])
            )->description('List of 3-5 clarifying questions')->required(),
            'suggested_timeline' => $schema->string()->description('Suggested project timeline based on complexity, e.g., "3 months" or "6 weeks"')->required(),
            'complexity_assessment' => $schema->string()->description('Brief assessment: small, medium, large, or enterprise')->required(),
        ];
    }
}
