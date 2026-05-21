import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Zap, Layout, LogOut, User, Sparkles, ArrowRight, RefreshCw, CheckCircle, Code, Database, Server, Palette, Globe, Settings, Target, Edit3 } from 'lucide-react';

interface TechStackItem {
    category: string;
    items: string[];
    rationale: string;
    alternatives: string[];
}

interface Blueprint {
    id: string;
    version: number;
    tech_stack: TechStackItem[];
    strategy: { decision: string; tradeoffs: string[] };
    architecture: { considerations: string[] };
}

interface ProjectProps {
    project: {
        id: string;
        title: string;
        planning_phase: string;
        current_phase: string;
        brief: string;
        latestBlueprint?: Blueprint;
    };
}

const categoryIcons: Record<string, React.ReactNode> = {
    Frontend: <Code className="w-5 h-5" />,
    Backend: <Server className="w-5 h-5" />,
    Database: <Database className="w-5 h-5" />,
    DevOps: <Settings className="w-5 h-5" />,
    Design: <Palette className="w-5 h-5" />,
    Mobile: <Globe className="w-5 h-5" />,
};

export default function Architecture({ project }: ProjectProps) {
    const blueprint = project.latestBlueprint;
    const techStack = blueprint?.tech_stack || [];
    const [isOverriding, setIsOverriding] = useState(false);
    const [overrideText, setOverrideText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = () => {
        setIsSubmitting(true);
        router.post(route('projects.wizard.approve-architecture', project.id), {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleOverride = () => {
        if (!overrideText.trim()) return;
        setIsSubmitting(true);
        router.post(route('projects.wizard.override-architecture', project.id), {
            tech_override: overrideText.trim(),
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsOverriding(false);
                setOverrideText('');
            },
        });
    };

    const handleRegenerate = () => {
        setIsSubmitting(true);
        router.post(route('projects.wizard.regenerate-blueprint', project.id), {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="min-h-screen bg-[#0f0c13] text-white selection:bg-[#F93A8B]/30">
            <Head title="Architecture Review" />
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

            <main className="pl-20 min-h-screen">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F93A8B]/10 flex items-center justify-center border border-[#F93A8B]/20">
                                <Sparkles className="w-5 h-5 text-[#F93A8B]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Architecture Review</h1>
                                <p className="text-sm text-zinc-500">Review and customize the proposed tech stack</p>
                            </div>
                        </div>
                        <div className="h-1 bg-[#1a1523] rounded-full overflow-hidden">
                            <div className="h-full bg-[#F93A8B] rounded-full" style={{ width: '60%' }} />
                        </div>
                    </header>

                    {/* Strategy Decision */}
                    {blueprint?.strategy && (
                        <section className="bg-[#15121a] rounded-2xl border border-[#261E2E] p-6 mb-8">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#F93A8B]" />
                                Architectural Strategy
                            </h2>
                            <div className="bg-[#0f0c13] rounded-xl p-4 border border-[#261E2E]">
                                <p className="text-white font-medium mb-2">{blueprint.strategy.decision}</p>
                                <div className="space-y-1">
                                    {blueprint.strategy.tradeoffs.map((tradeoff, i) => (
                                        <p key={i} className="text-sm text-zinc-500">• {tradeoff}</p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Tech Stack */}
                    <section className="mb-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Code className="w-5 h-5 text-[#F93A8B]" />
                            Proposed Tech Stack
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {techStack.map((stack, index) => (
                                <div key={index} className="bg-[#15121a] rounded-2xl border border-[#261E2E] p-5 hover:border-[#F93A8B]/30 transition-all group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#F93A8B]/10 flex items-center justify-center text-[#F93A8B]">
                                            {categoryIcons[stack.category] || <Code className="w-4 h-4" />}
                                        </div>
                                        <h3 className="font-bold text-white">{stack.category}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {stack.items.map((item, i) => (
                                            <span key={i} className="px-2 py-1 bg-[#0f0c13] rounded-lg text-xs text-zinc-300 border border-[#261E2E]">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500 mb-2">{stack.rationale}</p>
                                    {stack.alternatives.length > 0 && (
                                        <p className="text-[10px] text-zinc-600">
                                            Alternatives: {stack.alternatives.join(', ')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Override Section */}
                        {!isOverriding ? (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#F93A8B] rounded-xl font-bold hover:bg-[#e73681] transition-all disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Continue
                                </button>
                                <button
                                    onClick={() => setIsOverriding(true)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#15121a] border border-[#261E2E] rounded-xl font-bold hover:border-[#F93A8B]/30 transition-all disabled:opacity-50"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Override Tech Stack
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#15121a] border border-[#261E2E] rounded-xl font-bold hover:border-[#F93A8B]/30 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#15121a] rounded-2xl border border-[#F93A8B]/30 p-6 animate-fade-in">
                                <h3 className="font-bold mb-3">Override Tech Stack</h3>
                                <p className="text-sm text-zinc-500 mb-4">
                                    Describe your preferred tech stack. The AI will regenerate the blueprint using your specifications.
                                </p>
                                <textarea
                                    value={overrideText}
                                    onChange={(e) => setOverrideText(e.target.value)}
                                    placeholder="e.g., I want to use Next.js 14 with App Router, Prisma ORM, PostgreSQL, and Tailwind CSS. For auth, use NextAuth.js..."
                                    rows={4}
                                    className="w-full bg-[#0f0c13] border-[#261E2E] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 resize-none mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleOverride}
                                        disabled={isSubmitting || !overrideText.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#F93A8B] rounded-xl font-bold hover:bg-[#e73681] transition-all disabled:opacity-50"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        Apply Override & Regenerate
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsOverriding(false);
                                            setOverrideText('');
                                        }}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 bg-[#15121a] border border-[#261E2E] rounded-xl font-bold hover:border-zinc-600 transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Technical Considerations */}
                    {blueprint?.architecture?.considerations && (
                        <section className="bg-[#15121a] rounded-2xl border border-[#261E2E] p-6">
                            <h2 className="text-lg font-bold mb-4">Technical Considerations</h2>
                            <div className="space-y-3">
                                {blueprint.architecture.considerations.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-[#0f0c13] rounded-xl border border-[#261E2E]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F93A8B] mt-2 shrink-0" />
                                        <p className="text-sm text-zinc-400">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
