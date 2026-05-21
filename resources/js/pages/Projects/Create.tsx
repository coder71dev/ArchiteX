import React from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { ArrowRight, Zap, FileText, Layout, LogOut, User } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        brief: '',
        client_name: '',
        budget: '',
        timeline: '',
        target_audience: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.wizard.idea'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="min-h-screen bg-[#0f0c13] text-white selection:bg-[#F93A8B]/30">
            <Head title="New Project" />
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                h1, h2, h3, h4, h5, h6, .font-outfit { font-family: 'Outfit', sans-serif !important; }
                body { font-family: 'Space Grotesk', sans-serif; }
                .glass { background: rgba(21, 18, 26, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .btn-accent { background: linear-gradient(135deg, #F93A8B 0%, #c033d6 100%); color: white; display: flex; align-items: center; border-radius: 0.75rem; font-weight: bold; transition: all 0.3s; }
                .btn-accent:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 10px 20px -10px rgba(249, 58, 139, 0.5); }
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

            <main className="pl-20 min-h-screen flex items-center justify-center p-12">
                <div className="w-full max-w-4xl">
                    <header className="mb-12">
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                            <span className="gradient-text">New Project</span>
                        </h1>
                        <p className="text-zinc-400 text-lg">Describe your idea. The AI will ask clarifying questions before building the full plan.</p>
                    </header>

                    <div className="glass p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F93A8B]/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[#F93A8B]/10 transition-colors duration-700"></div>
                        
                        <form onSubmit={submit} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-400 ml-1">Client Name</label>
                                    <input
                                        type="text"
                                        value={data.client_name}
                                        onChange={e => setData('client_name', e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full bg-[#1a1523] border-[#261E2E] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-400 ml-1">Budget</label>
                                    <input
                                        type="text"
                                        value={data.budget}
                                        onChange={e => setData('budget', e.target.value)}
                                        placeholder="e.g. $10k - $20k"
                                        className="w-full bg-[#1a1523] border-[#261E2E] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-400 ml-1">Required Timeframe</label>
                                    <input
                                        type="text"
                                        value={data.timeline}
                                        onChange={e => setData('timeline', e.target.value)}
                                        placeholder="e.g. 3 months, June 2026"
                                        className="w-full bg-[#1a1523] border-[#261E2E] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-400 ml-1">Target Audience & Region</label>
                                    <input
                                        type="text"
                                        value={data.target_audience}
                                        onChange={e => setData('target_audience', e.target.value)}
                                        placeholder="e.g. B2B, US only"
                                        className="w-full bg-[#1a1523] border-[#261E2E] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-semibold text-zinc-400">Project Idea & Requirements</label>
                                    <span className="text-[10px] font-bold text-zinc-600 flex items-center gap-1">
                                        <FileText className="w-2.5 h-2.5" />
                                        Required
                                    </span>
                                </div>
                                <textarea
                                    required
                                    value={data.brief}
                                    onChange={e => setData('brief', e.target.value)}
                                    placeholder="Describe your project idea. What problem does it solve? Who are the users? What are the key features?"
                                    rows={6}
                                    className="w-full bg-[#1a1523]/80 border-[#261E2E] rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 font-mono text-sm leading-relaxed min-h-[160px]"
                                ></textarea>
                                {errors.brief && <p className="text-rose-500 text-sm">{errors.brief}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-400 ml-1">Additional Notes</label>
                                <textarea
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    placeholder="Constraints, integrations, legacy code context, or anything that helps contextualize the build..."
                                    rows={3}
                                    className="w-full bg-[#1a1523]/80 border-[#261E2E] rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 font-mono text-sm leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    disabled={processing}
                                    className="btn-accent px-8 justify-center h-[52px]"
                                >
                                    {processing ? 'Analyzing Idea...' : (
                                        <>
                                            Start Planning
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
