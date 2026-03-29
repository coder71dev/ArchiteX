import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { 
    ChevronRight, MessageSquare, Send, Zap, Clock, 
    Layers, FileText, CheckSquare, Users, 
    Maximize2, Download, RefreshCcw, Sparkles 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Mermaid rendering component
const Mermaid = ({ chart }: { chart: string }) => {
    const [svg, setSvg] = useState('');
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#6366f1',
                primaryTextColor: '#fff',
                primaryBorderColor: '#6366f1',
                lineColor: '#06b6d4',
                secondaryColor: '#1e1b4b',
                tertiaryColor: '#111827',
                fontFamily: 'Inter',
            },
        });
        
        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (err) {
                console.error('Mermaid error:', err);
            }
        };

        if (chart) renderChart();
    }, [chart]);

    return (
        <div className="bg-cyber-900/50 p-6 rounded-xl border border-cyber-700/50 overflow-x-auto flex justify-center">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
    );
};

interface TeamMember {
    id: string;
    name: string;
    role: string;
    skills: string[];
}

interface ProjectProps {
    project: any;
    team: TeamMember[];
}

export default function Show({ project, team }: ProjectProps) {
    const [activeTab, setActiveTab] = useState('blueprint');
    const [isThinking, setIsThinking] = useState(false);

    const { data: chatData, setData: setChatData, post: postChat, processing: chatProcessing, reset: resetChat } = useForm({
        message: '',
    });

    const handleChat = (e: React.FormEvent) => {
        e.preventDefault();
        postChat(route('projects.chat', project.id), {
            onStart: () => setIsThinking(true),
            onFinish: () => {
                setIsThinking(false);
                resetChat();
            },
        });
    };

    const blueprint = project.blueprints[0] || {};
    const estimate = project.estimates[0] || {};
    const proposal = project.proposals[0] || {};
    const tasks = project.tasks || [];

    // Poll for updates if the AI is actively planning
    useEffect(() => {
        if (project.status === 'planning') {
            const interval = setInterval(() => {
                router.reload({ only: ['project'] });
            }, 7000);
            return () => clearInterval(interval);
        }
    }, [project.status]);
    // ...

    return (
        <div className="min-h-screen bg-cyber-950 text-slate-200">
            <Head title={`${project.title} - ArchiteX`} />

            {/* Header / Breadcrumb */}
            <div className="border-b border-cyber-700 bg-cyber-900/50 backdrop-blur-md sticky top-0 z-40">
                <div className="px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('dashboard')} className="text-slate-500 hover:text-cyan-400 transition-colors">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        <span className="font-bold text-slate-200">{project.title}</span>
                        <span className="ml-4 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                            v{blueprint.version || 1}.0
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="btn-secondary py-1.5 px-3">
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                        <div className="w-10 h-10 rounded-full bg-cyber-800 flex items-center justify-center border border-cyber-700">
                            <Users className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-2 mb-10 p-1 bg-cyber-900 rounded-xl border border-cyber-700 w-fit">
                        {[
                            { id: 'blueprint', label: 'Engineering Blueprint', icon: Layers },
                            { id: 'estimate', label: 'Estimations', icon: Clock },
                            { id: 'proposal', label: 'Client Proposal', icon: FileText },
                            { id: 'tasks', label: 'Kanban Board', icon: CheckSquare },
                            { id: 'team', label: 'Team Context', icon: Users },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-cyber-800 text-cyan-400 shadow-lg shadow-black/20' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="animate-fade-in text-slate-200">
                        {project.status === 'planning' && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 py-20">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-md">
                                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent capitalize">
                                        Architecting: {project.current_phase || 'Project'}
                                    </h2>
                                    <p className="text-slate-400 leading-relaxed">
                                        The Neural Vault is orchestrating multi-agent simulations to generate your technical blueprint, resource estimates, and task breakdown.
                                    </p>
                                    
                                    {project.latest_status_message && (
                                        <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold animate-pulse">
                                            <Zap className="w-3.5 h-3.5" />
                                            {project.latest_status_message}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'blueprint' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-cyber-800 border-cyber-700 text-slate-600'}`}>Blueprint</div>
                                        <div className="w-4 h-[1px] bg-cyber-700" />
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'estimation' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-cyber-800 border-cyber-700 text-slate-600'}`}>Estimation</div>
                                        <div className="w-4 h-[1px] bg-cyber-700" />
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'proposal' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-cyber-800 border-cyber-700 text-slate-600'}`}>Proposal</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {project.error_message && project.status !== 'planning' && (
                            <div className="card border-rose-500/50 bg-rose-500/5 p-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                                    <Zap className="w-8 h-8 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-bold text-rose-500">Neural Sync Interrupted</h3>
                                <p className="text-slate-400 max-w-lg mx-auto">{project.error_message}</p>
                                <button 
                                    onClick={() => router.post(route('projects.chat', project.id), { message: 'Retry the previous plan generation.' })}
                                    className="btn-primary bg-rose-500 hover:bg-rose-600 mt-4"
                                >
                                    Force Retry Generation
                                </button>
                            </div>
                        )}

                        {project.status !== 'planning' && !project.error_message && (
                            <>
                        {/* Blueprint Tab */}
                        {activeTab === 'blueprint' && (
                            <div className="space-y-12">
                                <header className="max-w-3xl">
                                    <h2 className="text-3xl font-bold mb-4">Strategic Framework</h2>
                                    <p className="text-slate-400 leading-relaxed text-lg">
                                        {blueprint.overview}
                                    </p>
                                </header>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="card p-8">
                                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                            <Zap className="text-amber-500 w-5 h-5" />
                                            Architectural Strategy
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Primary Decision</span>
                                                <div className="p-4 bg-cyber-800 rounded-xl border border-cyber-700 font-mono text-cyan-400">
                                                    {blueprint.strategy?.decision}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Critical Tradeoffs</span>
                                                <ul className="space-y-2">
                                                    {blueprint.strategy?.tradeoffs?.map((t: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                                            {t}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card p-8">
                                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                            <Sparkles className="text-cyan-400 w-5 h-5" />
                                            Phased Feature Scope
                                        </h3>
                                        <div className="space-y-4">
                                            {['mvp', 'v1', 'future'].map(stage => (
                                                <div key={stage} className="flex gap-4 items-start">
                                                    <div className={`mt-1 font-black text-xs uppercase tracking-tighter ${
                                                        stage === 'mvp' ? 'text-rose-500' : stage === 'v1' ? 'text-indigo-500' : 'text-slate-600'
                                                    } w-12 pt-1`}>{stage}</div>
                                                    <div className="flex-1 flex flex-wrap gap-2">
                                                        {blueprint.scope?.[stage]?.map((item: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-cyber-800 rounded-lg text-xs border border-cyber-700/50 text-slate-300">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Diagrams */}
                                <div className="space-y-8">
                                    <h3 className="font-bold text-xl">Technical Visualizations</h3>
                                    <div className="space-y-12">
                                        <section>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">System Context & Integration Flow</label>
                                            <Mermaid chart={blueprint.architecture?.hldMermaid} />
                                        </section>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                            <section>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Data Model Architecture</label>
                                                <Mermaid chart={blueprint.architecture?.dbMermaid} />
                                            </section>
                                            <section>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Client Application Flow</label>
                                                <Mermaid chart={blueprint.architecture?.frontendMermaid} />
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estimate Tab */}
                        {activeTab === 'estimate' && (
                            <div className="space-y-10">
                                <header className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="card p-6 border-l-4 border-l-cyan-500">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Effort</span>
                                        <div className="text-3xl font-black mt-1">{estimate.total_hours}h</div>
                                    </div>
                                    <div className="card p-6 border-l-4 border-l-indigo-500">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Time-to-Market</span>
                                        <div className="text-3xl font-black mt-1">{estimate.duration_weeks} Weeks</div>
                                    </div>
                                    <div className="card p-6 border-l-4 border-l-emerald-500">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Risk Buffer</span>
                                        <div className="text-3xl font-black mt-1">+{estimate.risk_buffer_percent}%</div>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg">Resource Allocation</h3>
                                        <div className="space-y-4">
                                            {estimate.team_composition?.map((t: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-cyber-900 rounded-xl border border-cyber-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                                                            {t.count}
                                                        </div>
                                                        <span className="font-semibold">{t.role}</span>
                                                    </div>
                                                    <span className="text-slate-500 text-sm">{t.hours_per_day}h/day</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg">Phase Breakdown</h3>
                                        <div className="space-y-2">
                                            {estimate.phase_breakdown?.map((p: any, i: number) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="w-24 text-sm text-slate-500 truncate">{p.phase}</div>
                                                    <div className="flex-1 h-2 bg-cyber-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-cyan-500 rounded-full" 
                                                            style={{ width: `${(p.hours / estimate.total_hours) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-12 text-sm font-bold text-right">{p.hours}h</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proposal Tab */}
                        {activeTab === 'proposal' && (
                            <div className="max-w-4xl mx-auto card p-12 lg:p-16 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rotate-45 -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="prose prose-invert prose-architex max-w-none">
                                    <ReactMarkdown>{proposal.content}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Tasks Tab */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Development Tasks</h2>
                                    <div className="flex gap-2">
                                        {['todo', 'in_progress', 'review', 'done'].map(s => (
                                            <span key={s} className="px-3 py-1 bg-cyber-900 rounded-md text-[10px] uppercase font-bold text-slate-500 border border-cyber-700">
                                                {s} ({tasks.filter((t:any) => t.status === s).length})
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tasks.map((task: any, i: number) => (
                                        <div key={task.id} className="card p-5 group flex items-start gap-4 hover:border-cyan-500/30 transition-all">
                                            <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
                                                task.priority === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                task.priority === 'high' ? 'bg-amber-500' : 'bg-cyan-500'
                                            }`} title={`Priority: ${task.priority}`} />
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-200">{task.title}</h4>
                                                    <span className="text-[10px] uppercase font-black text-slate-600 tracking-tighter">{task.phase}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-slate-300">{task.estimated_hours}h</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Est.</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-cyber-800 border border-cyber-700 flex items-center justify-center overflow-hidden" title={task.assignee?.name}>
                                                    {task.assignee ? (
                                                        <span className="text-[10px] font-bold text-cyan-400">{task.assignee.name.split(' ').map((n:any) => n[0]).join('')}</span>
                                                    ) : <Users className="w-4 h-4 text-slate-600" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Tab */}
                        {activeTab === 'team' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {team.map(member => (
                                    <div key={member.id} className="card p-6 active:scale-[0.98] transition-transform">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-700 to-cyber-800 flex items-center justify-center border border-cyber-600">
                                                <span className="text-lg font-bold text-cyan-400">{member.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-200">{member.name}</h4>
                                                <p className="text-xs text-slate-500">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {member.skills.map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-cyber-800 rounded text-[10px] font-medium text-slate-400 border border-cyber-700/50">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar Chat Interface */}
                <aside className="w-[26rem] border-l border-cyber-700 bg-cyber-900/50 flex flex-col pt-4">
                    <div className="px-6 pb-4 border-b border-cyber-800">
                        <h3 className="flex items-center gap-2 font-bold text-slate-300">
                            <MessageSquare className="w-4 h-4 text-cyan-400" />
                            Context Aware Assistant
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Persistent Learning Session</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="bg-cyber-800/80 p-4 rounded-2xl rounded-tl-none border border-cyber-700 text-sm text-slate-300 leading-relaxed shadow-lg">
                                Hello Architect! I have finalized the blueprint v{blueprint.version} based on our discussion. You can browse the technical details, or tell me if you'd like to adjust specific components or team allocations.
                            </div>
                            
                            {isThinking && (
                                <div className="flex items-center gap-3 p-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recalibrating Planning Models...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-cyber-900/80 border-t border-cyber-700">
                        <form onSubmit={handleChat} className="relative group">
                            <textarea
                                value={chatData.message}
                                onChange={e => setChatData('message', e.target.value)}
                                placeholder="Refine requirements... e.g. 'Use AWS Lambda instead of EC2' or 'Add a mobile app phase'"
                                className="w-full bg-cyber-800 border-cyber-700 rounded-2xl pl-10 pr-12 py-3 text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all resize-none placeholder:text-slate-600 min-h-[100px]"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleChat(e);
                                    }
                                }}
                            />
                            <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
                            <button 
                                type="submit"
                                disabled={chatProcessing || !chatData.message}
                                className="absolute right-3 bottom-3 p-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 disabled:bg-cyber-700 disabled:text-slate-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <div className="mt-4 flex items-center justify-between px-1">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <RefreshCcw className="w-3 h-3" />
                                Context Memory Active
                            </span>
                            <span className="text-[10px] text-slate-500">
                                Press Enter to refine
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
