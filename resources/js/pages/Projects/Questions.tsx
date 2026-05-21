import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Send, SkipForward, Zap, Layout, LogOut, User, Sparkles, MessageSquare, Clock, AlertCircle } from 'lucide-react';

interface Question {
    question: string;
    reason: string;
    category: string;
    answer?: string;
    suggested_answers?: string[];
}

interface ProjectProps {
    project: {
        id: string;
        title: string;
        planning_phase: string;
        current_phase: string;
        error_message?: string;
        clarifying_questions?: {
            questions?: Question[];
            suggested_timeline?: string;
            complexity_assessment?: string;
            answered_at?: string;
        };
    };
}

// Fallback suggestions based on question category when AI doesn't provide them
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
    scope: ['Full-featured platform', 'MVP with core features', 'Progressive rollout', 'Other (custom)'],
    tech: ['Recommend best-fit stack', 'Laravel + React + Tailwind', 'Node.js + Next.js', 'Other (custom)'],
    timeline: ['As soon as possible', 'Within 3 months', 'Flexible — quality first', 'Other (custom)'],
    budget: ['Up to $10k', '$10k – $50k', 'Budget is flexible', 'Other (custom)'],
    team: ['Small team (2-3)', 'Medium team (4-6)', 'Large team (7+)', 'Other (custom)'],
    other: ['Yes', 'No', 'Not sure yet', 'Other (custom)'],
};

function getSuggestions(q: Question): string[] {
    if (q.suggested_answers && q.suggested_answers.length > 0) return q.suggested_answers;
    return FALLBACK_SUGGESTIONS[q.category?.toLowerCase()] || FALLBACK_SUGGESTIONS.other;
}

export default function Questions({ project }: ProjectProps) {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState<Record<number, boolean>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const questions = project.clarifying_questions?.questions || [];
    const totalQuestions = questions.length;
    const isLoading = project.planning_phase === 'idea_submitted';
    const isGenerating = project.planning_phase === 'questions_answered' || project.planning_phase === 'plan_generating' || project.planning_phase === 'plan_ready';

    // Auto-scroll to bottom only when currentIndex changes (new question appears)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentIndex]);

    // Poll for status updates when loading or generating
    useEffect(() => {
        if (isLoading || isGenerating) {
            const interval = setInterval(() => {
                router.reload({ only: ['project'] });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoading, isGenerating]);

    // Redirect when plan is ready
    useEffect(() => {
        if (project.planning_phase === 'plan_ready' || project.planning_phase === 'milestones_ready') {
            window.location.href = route('projects.architecture', project.id);
        }
    }, [project.planning_phase]);

    // Keep textarea focused after submitting intermediate answers
    useEffect(() => {
        if (!isSubmitting && currentIndex < totalQuestions) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [currentIndex, isSubmitting, totalQuestions]);

    const submitAnswer = (answer: string) => {
        const trimmed = answer.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);

        // Store answer locally for optimistic UI
        setAnswers(prev => ({ ...prev, [currentIndex]: trimmed }));
        if (questions[currentIndex]) {
            questions[currentIndex].answer = trimmed;
        }

        if (currentIndex < totalQuestions - 1) {
            // Not the last question - advance to next
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setIsSubmitting(false);
                setShowCustomInput({}); // reset custom input for next question
            }, 300);
        } else {
            // Last question - submit all answers to backend
            const allAnswers = questions.map((q, i) => {
                if (i === currentIndex) return trimmed;
                return answers[i]?.trim() || q.answer || '';
            });

            router.post(
                route('projects.wizard.answers', project.id),
                { answers: allAnswers },
                {
                    onFinish: () => setIsSubmitting(false),
                    onError: () => setIsSubmitting(false),
                }
            );
        }
    };

    const handleAnswer = () => {
        submitAnswer(answers[currentIndex] || '');
    };

    const handleSkip = () => {
        router.post(route('projects.wizard.answers', project.id), {
            answers: [],
            skip_remaining: true,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAnswer();
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setAnswers(prev => ({ ...prev, [currentIndex]: value }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f0c13] text-white flex items-center justify-center">
                <Head title="Generating Questions..." />
                <div className="text-center space-y-6 max-w-md mx-auto px-4">
                    {project.error_message ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2 text-rose-400">Generation Failed</h2>
                                <p className="text-zinc-400 text-sm mb-4">{project.error_message}</p>
                                <button
                                    onClick={() => router.post(route('projects.chat', project.id), { message: 'Retry generating questions', retry: true })}
                                    className="px-6 py-2 bg-[#F93A8B] rounded-xl text-sm font-bold hover:bg-[#e73681] transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-[#F93A8B]/20 border-t-[#F93A8B] animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-[#F93A8B] animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Analyzing Your Idea</h2>
                                <p className="text-zinc-400">The AI is preparing clarifying questions...</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[#0f0c13] text-white flex items-center justify-center">
                <Head title="Generating Plan..." />
                <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-[#F93A8B]/20 border-t-[#F93A8B] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#F93A8B] animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Building Your Plan</h2>
                        <p className="text-zinc-400">Generating blueprint, estimates, and task breakdown...</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${project.current_phase === 'blueprint' ? 'bg-[#F93A8B]/10 border-[#F93A8B]/20 text-[#F93A8B]' : 'bg-[#1a1523] border-[#261E2E] text-zinc-600'}`}>Blueprint</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${project.current_phase === 'estimation_and_proposal' ? 'bg-[#F93A8B]/10 border-[#F93A8B]/20 text-[#F93A8B]' : 'bg-[#1a1523] border-[#261E2E] text-zinc-600'}`}>Estimate</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${project.current_phase === 'tasks' ? 'bg-[#F93A8B]/10 border-[#F93A8B]/20 text-[#F93A8B]' : 'bg-[#1a1523] border-[#261E2E] text-zinc-600'}`}>Tasks</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0c13] text-white selection:bg-[#F93A8B]/30">
            <Head title="Clarifying Questions" />
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                h1, h2, h3, h4, h5, h6, .font-outfit { font-family: 'Outfit', sans-serif !important; }
                body { font-family: 'Space Grotesk', sans-serif; }
            ` }} />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 border-r border-[#261E2E] bg-[#15121a]/50 backdrop-blur-xl z-50">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F93A8B] to-[#F3B323] flex items-center justify-center mb-12 shadow-lg shadow-[#F93A8B]/20">
                    <Zap className="text-white w-6 h-6" />
                </div>
                <div className="space-y-8 flex-1">
                    <Link href={route('dashboard')} className="p-3 rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors block">
                        <Layout className="w-6 h-6" />
                    </Link>
                    <Link href={route('team-members.index')} className="p-3 rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors block">
                        <User className="w-6 h-6" />
                    </Link>
                </div>
                <button 
                    onClick={() => router.post(route('logout'))}
                    className="p-3 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all mb-4"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            <main className="pl-20 h-screen flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#261E2E] bg-[#0f0c13]/80 backdrop-blur-xl shrink-0">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[#F93A8B]" />
                                Project Discovery
                            </h1>
                            <p className="text-sm text-zinc-500 mt-1">
                                Question {Math.min(currentIndex + 1, totalQuestions)} of {totalQuestions}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm text-zinc-500">{project.clarifying_questions?.suggested_timeline || 'TBD'}</span>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="max-w-3xl mx-auto mt-4">
                        <div className="h-1 bg-[#1a1523] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#F93A8B] rounded-full transition-all duration-500"
                                style={{ width: `${totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {questions.map((q, index) => {
                            const isAnswered = index < currentIndex || (index === currentIndex && answers[index]);
                            const isCurrent = index === currentIndex;
                            
                            if (!isAnswered && !isCurrent) return null;

                            return (
                                <React.Fragment key={index}>
                                    {/* AI Question */}
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F93A8B] to-[#c033d6] flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-[#15121a] p-5 rounded-2xl rounded-tl-none border border-[#261E2E]">
                                                <p className="text-white leading-relaxed">{q.question}</p>
                                                <div className="mt-3 flex items-start gap-2 p-3 bg-[#0f0c13] rounded-xl border border-[#261E2E]/60">
                                                    <span className="text-[10px] font-bold text-[#F93A8B] uppercase tracking-wider shrink-0 mt-0.5">Why:</span>
                                                    <p className="text-xs text-zinc-500">{q.reason}</p>
                                                </div>
                                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-3 block">{q.category}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Answer (if answered) */}
                                    {index < currentIndex && (
                                        <div className="flex gap-4 flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-[#261E2E] flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-[#F93A8B]/10 p-5 rounded-2xl rounded-tr-none border border-[#F93A8B]/20">
                                                    <p className="text-white">{answers[index] || q.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Current Question Input with Suggested Answers */}
                        {currentIndex < totalQuestions && (
                            <div className="flex gap-4 mt-8">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F93A8B] to-[#c033d6] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <div className="bg-[#15121a] p-5 rounded-2xl rounded-tl-none border border-[#261E2E]">
                                        <p className="text-white leading-relaxed mb-4">{questions[currentIndex]?.question}</p>

                                        {/* Suggested Answer Buttons */}
                                        <div className="space-y-2 mb-4">
                                            <p className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider mb-2">Choose a recommended answer</p>
                                            <div className="flex flex-wrap gap-2">
                                                {getSuggestions(questions[currentIndex]).map((suggestion, si) => {
                                                    const isCustom = suggestion.toLowerCase().includes('custom');
                                                    const isSelected = answers[currentIndex] === suggestion && !isCustom;
                                                    return (
                                                        <button
                                                            key={si}
                                                            onClick={() => {
                                                                if (isCustom) {
                                                                    setShowCustomInput(prev => ({ ...prev, [currentIndex]: true }));
                                                                    setTimeout(() => textareaRef.current?.focus(), 100);
                                                                } else {
                                                                    submitAnswer(suggestion);
                                                                }
                                                            }}
                                                            disabled={isSubmitting}
                                                            className={`px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-50 ${
                                                                isSelected
                                                                    ? 'bg-[#F93A8B]/20 border-[#F93A8B]/40 text-[#F93A8B]'
                                                                    : isCustom
                                                                        ? 'bg-[#0f0c13] border-[#261E2E] text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                                                                        : 'bg-[#0f0c13] border-[#261E2E] text-zinc-300 hover:bg-[#F93A8B]/10 hover:border-[#F93A8B]/30 hover:text-white'
                                                            }`}
                                                        >
                                                            {isCustom ? '✎ Custom answer...' : suggestion}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Custom Textarea (shown when "Custom" is clicked) */}
                                        {showCustomInput[currentIndex] && (
                                            <div className="relative animate-fade-in">
                                                <textarea
                                                    ref={textareaRef}
                                                    value={answers[currentIndex] || ''}
                                                    onChange={handleTextChange}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder="Type your custom answer..."
                                                    rows={3}
                                                    disabled={isSubmitting}
                                                    className="w-full bg-[#0f0c13] border-[#261E2E] rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 resize-none disabled:opacity-50"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleAnswer}
                                                    disabled={isSubmitting || !answers[currentIndex]?.trim()}
                                                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#F93A8B] text-white hover:bg-[#e73681] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {showCustomInput[currentIndex] && (
                                            <p className="text-[10px] text-zinc-600 mt-2">Press Enter to submit</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-[#261E2E] bg-[#0f0c13]/80 backdrop-blur-xl shrink-0">
                    <div className="max-w-3xl mx-auto flex justify-between items-center">
                        <button
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[#F93A8B] transition-colors disabled:opacity-50"
                        >
                            <SkipForward className="w-4 h-4" />
                            Skip Remaining Questions
                        </button>
                        <span className="text-xs text-zinc-600">
                            {totalQuestions - currentIndex} remaining
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
