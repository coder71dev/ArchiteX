import React from 'react';
import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { Plus, Layout, Clock, User, ArrowRight, Zap, Target, Shield, LogOut, FileText } from 'lucide-react';

import { PageProps } from '@inertiajs/core';

interface Project {
    id: string;
    title: string;
    brief: string;
    status: string;
    client_name: string;
    created_at: string;
    latest_blueprint?: {
        overview: string;
        reliability_score: number;
    };
    latest_estimate?: {
        total_hours: number;
        duration_weeks: number;
    };
}

interface Props extends PageProps {
    projects: Project[];
    auth: {
        user: {
            id: string;
            name: string;
            email: string;
        };
    };
}


export default function Dashboard({ projects }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        brief: '',
        client_name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="min-h-screen bg-cyber-950 text-slate-200 selection:bg-cyan-500/30">
            <Head title="Architect Dashboard" />

            {/* Sidebar / Navigation */}
            <div className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 border-r border-cyber-700 bg-cyber-900/50 backdrop-blur-xl z-50">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mb-12 shadow-lg shadow-cyan-500/20">
                    <Zap className="text-white w-6 h-6" />
                </div>
                <div className="space-y-8 flex-1">
                    <button className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner shadow-cyan-500/10">
                        <Layout className="w-6 h-6" />
                    </button>
                    <button className="p-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors">
                        <User className="w-6 h-6" />
                    </button>
                </div>
                
                <button 
                    onClick={() => router.post(route('logout'))}
                    className="p-3 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all mb-4"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            <main className="pl-20 min-h-screen flex">
                {/* Left Content Column */}
                <div className="flex-1 p-12 max-w-5xl mx-auto">
                    <header className="mb-12 animate-fade-in">
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                            Hello, <span className="gradient-text">{usePage<Props>().props.auth.user.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-slate-400 text-lg">Welcome to ArchiteX. Start a new project or manage your existing blueprints.</p>
                    </header>

                    {/* New Project Form */}
                    <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="glass p-8 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-cyan-500/10 transition-colors duration-700"></div>
                            
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Plus className="text-cyan-400 w-6 h-6" />
                                Initiate New Project
                            </h2>

                            <form onSubmit={submit} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-400 ml-1">Client Name</label>
                                        <input
                                            type="text"
                                            value={data.client_name}
                                            onChange={e => setData('client_name', e.target.value)}
                                            placeholder="e.g. Acme Corp"
                                            className="w-full bg-cyber-800 border-cyber-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            disabled={processing}
                                            className="btn-accent w-full justify-center h-[52px]"
                                        >
                                            {processing ? 'Processing Requirements...' : (
                                                <>
                                                    Generate Blueprint
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-semibold text-slate-400">Project Brief & Requirements</label>
                                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                            <FileText className="w-2.5 h-2.5" />
                                            Markdown Supported
                                        </span>
                                    </div>
                                    <textarea
                                        required
                                        value={data.brief}
                                        onChange={e => setData('brief', e.target.value)}
                                        placeholder="Describe goals, tech stack, and features. Markdown is supported and detailed briefs improve blueprint accuracy by 40%."
                                        rows={6}
                                        className="w-full bg-cyber-800/80 border-cyber-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600 font-mono text-sm leading-relaxed min-h-[160px]"
                                    ></textarea>
                                    {errors.brief && <p className="text-rose-500 text-sm">{errors.brief}</p>}
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {projects.length === 0 ? (
                            <div className="col-span-full py-20 text-center glass rounded-2xl border-dashed border-2 border-cyber-700">
                                <p className="text-slate-500 italic">No project blueprints found. initiate your first planning session above.</p>
                            </div>
                        ) : (
                            projects.map((project, idx) => (
                                <Link 
                                    key={project.id} 
                                    href={route('projects.show', project.id)}
                                    className="card p-6 flex flex-col group relative animate-fade-in-up hover:scale-[1.02]"
                                    style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-lg bg-cyber-700 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                                            project.status === 'planning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                        }`}>
                                            {project.status}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">
                                        {project.brief}
                                    </p>

                                    <div className="flex items-center gap-4 pt-6 border-t border-cyber-700/50 mt-auto">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {project.latest_estimate?.duration_weeks || 0}w
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Shield className="w-3.5 h-3.5" />
                                            {project.latest_blueprint?.reliability_score || 0}% Match
                                        </div>
                                        <div className="ml-auto flex items-center gap-1 text-cyan-400 font-bold text-sm">
                                            Design
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Infographic / Quick Stats */}
                <div className="hidden xl:block w-96 border-l border-cyber-700 bg-cyber-900/30 p-12 overflow-y-auto">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">Architectural Intelligence</h4>
                    
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-400 text-sm">Active Estimations</span>
                                <span className="text-3xl font-bold text-white tracking-tight">{projects.length}</span>
                            </div>
                            <div className="h-1.5 bg-cyber-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 rounded-full w-2/3 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl relative">
                            <Zap className="absolute top-4 right-4 text-amber-500/20 w-12 h-12" />
                            <h5 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Quick Tip
                            </h5>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Detailed project briefs yield 40% more accurate blueprints. include specific libraries or infrastructure needs for best results.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Reliability Index</h5>
                            <div className="space-y-6">
                                {[
                                    { label: 'Cloud Strategy', val: 92, color: 'bg-cyan-500' },
                                    { label: 'Security Posture', val: 88, color: 'bg-indigo-500' },
                                    { label: 'Cost Efficiency', val: 74, color: 'bg-amber-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="space-y-2">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                                            <span>{stat.label}</span>
                                            <span>{stat.val}%</span>
                                        </div>
                                        <div className="h-1 bg-cyber-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
