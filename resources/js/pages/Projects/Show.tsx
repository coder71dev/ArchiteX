import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { 
    ChevronRight, MessageSquare, Send, Zap, Clock, 
    Layers, FileText, CheckSquare, Users, 
    Maximize2, Download, RefreshCcw, Sparkles,
    ZoomIn, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Mermaid rendering component
const Mermaid = ({ chart }: { chart: string }) => {
    const [svg, setSvg] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
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
        <>
            <div className="bg-cyber-900/50 p-6 rounded-xl border border-cyber-700/50 overflow-hidden relative group">
                <button 
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-cyber-800 border border-cyber-700 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-cyan-400 hover:border-cyan-500/30 shadow-xl z-10"
                    title="Fullscreen View"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <div className="overflow-x-auto flex justify-center w-full mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-cyber-950/90 backdrop-blur-xl transition-all animate-fade-in">
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-cyber-900 border border-cyber-700 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-12 custom-scrollbar">
                        <div 
                            className="min-w-full min-h-full zoomable-content"
                            dangerouslySetInnerHTML={{ __html: svg }} 
                        />
                    </div>
                </div>
            )}
        </>
    );
};

interface Message {
    id: string;
    role: string;
    content: string;
    created_at: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    skills: string[];
}

interface ProjectProps {
    project: any;
    team: TeamMember[];
    messages: Message[];
}

export default function Show({ project, team, messages }: ProjectProps) {
    const [activeTab, setActiveTab] = useState('blueprint');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<number>(
        project.blueprints.length > 0 ? project.blueprints[0].version : 1
    );

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

    const blueprint = project.blueprints.find((b:any) => b.version === selectedVersion) || project.blueprints[0] || {};
    const estimate = project.estimates[0] || {};
    const proposal = project.proposals[0] || {};
    const tasks = project.tasks || [];

    // Automatically switch to latest version when a new one is generated
    useEffect(() => {
        if (project.blueprints.length > 0) {
            setSelectedVersion(project.blueprints[0].version);
        }
    }, [project.blueprints.length]);

    // Poll for updates if the AI is actively planning
    useEffect(() => {
        if (project.status === 'planning') {
            const interval = setInterval(() => {
                router.reload({ only: ['project', 'messages'] });
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
                        <div className="relative group ml-4">
                            <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-all focus:outline-none">
                                <Clock className="w-3.5 h-3.5" />
                                <span>v{blueprint.version || 1}.0</span>
                            </button>
                            
                            <div className="absolute top-full left-0 mt-2 w-56 bg-cyber-900 border border-cyber-700 rounded-xl shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 origin-top-left">
                                <div className="p-3 border-b border-cyber-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Version History</span>
                                    <Layers className="w-3 h-3 text-slate-600" />
                                </div>
                                <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar">
                                    {project.blueprints.map((b: any) => (
                                        <button
                                            key={b.id}
                                            onClick={() => setSelectedVersion(b.version)}
                                            className={`w-full text-left p-3 rounded-lg text-xs flex flex-col gap-1 transition-all mb-1 ${
                                                selectedVersion === b.version 
                                                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' 
                                                : 'text-slate-400 hover:bg-cyber-800 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5">
                                                    v{b.version}.0
                                                    {b.version === project.blueprints[0].version && (
                                                        <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded leading-none">LATEST</span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-normal">{new Date(b.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 line-clamp-1 italic font-normal">"{b.change_summary || 'No summary available'}"</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center border-x border-cyber-800 mx-8 whitespace-nowrap">
                            <div className="flex items-center gap-6">
                                {project.client_name && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Client</span>
                                        <span className="text-xs font-bold text-slate-200">{project.client_name}</span>
                                    </div>
                                )}
                                {project.target_deadline && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Deadline</span>
                                        <span className="text-xs font-bold text-slate-200">{new Date(project.target_deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
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
                                <header className="max-w-4xl">
                                    <div className="mb-10 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" />
                                            PRD: ORIGINAL MISSION BRIEF
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-4 border-l-2 border-indigo-500/30 pl-4 py-1">
                                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-slate-400 prose-p:italic">
                                                <ReactMarkdown>
                                                    {project.brief}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-black mb-4 tracking-tight">Strategic Framework</h2>
                                    <p className="text-slate-400 leading-relaxed text-lg max-w-2xl">
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

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div className="bg-gradient-to-br from-cyber-800 to-cyber-900/50 p-4 rounded-2xl rounded-tl-none border border-cyber-700/50 text-sm text-slate-300 leading-relaxed shadow-lg mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80">ArchiteX Core</span>
                            </div>
                            Hello Architect! I've been tracking our project evolution. We're currently looking at <strong>v{blueprint.version}.0</strong>. How can I assist with further refinements?
                        </div>

                        {messages.map((msg, index) => {
                            let content = msg.content;
                            let isJson = false;
                            let parsedContent: any = null;

                            try {
                                if (content.trim().startsWith('{')) {
                                    parsedContent = JSON.parse(content);
                                    isJson = true;
                                }
                            } catch (e) {
                                // Not JSON
                            }

                            return (
                                <div 
                                    key={msg.id || index} 
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[92%] p-4 rounded-2xl text-sm shadow-xl transition-all duration-300 ${
                                        msg.role === 'user' 
                                        ? 'bg-cyan-600/10 border border-cyan-400/20 text-cyan-100 rounded-tr-none' 
                                        : 'bg-cyber-800/80 border border-cyber-700/50 text-slate-300 rounded-tl-none'
                                    }`}>
                                        {isJson ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b border-cyber-700/50">
                                                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blueprint Generated</span>
                                                </div>
                                                <p className="text-slate-300 leading-relaxed italic">
                                                    "{parsedContent.overview || 'Architecture updated.'}"
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">RELIABILITY: {parsedContent.reliabilityScore}%</span>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-slate-500 uppercase font-bold tracking-tighter">v{blueprint.version}.0</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-cyber-900 prose-pre:border prose-pre:border-cyber-700 ${msg.role === 'user' ? 'prose-p:text-cyan-50' : 'text-slate-300'}`}>
                                                <ReactMarkdown>
                                                    {content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[9px] mt-1.5 px-2 uppercase tracking-tighter font-black ${msg.role === 'user' ? 'text-cyan-600/80' : 'text-slate-600'}`}>
                                        {msg.role === 'user' ? 'You' : 'ArchiteX'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                        
                        {isThinking && (
                            <div className="flex items-center gap-3 p-4 bg-cyber-900/30 rounded-xl border border-cyber-800/50 animate-pulse">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black text-cyan-500/70 uppercase tracking-[0.2em]">Neural Processing...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-cyber-900/80 border-t border-cyber-700">
                        <form onSubmit={handleChat} className="relative group">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5 grayscale group-focus-within:grayscale-0 transition-all">
                                        <Sparkles className="w-2.5 h-2.5 text-cyan-500" />
                                        Refinement Engine
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                                        <FileText className="w-2.5 h-2.5" />
                                        Markdown Supported
                                    </span>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={chatData.message}
                                        onChange={e => setChatData('message', e.target.value)}
                                        placeholder="e.g. 'Add a Redis cache layer' or 'Change UI to Dark Mode'"
                                        className="w-full bg-cyber-800/50 border-cyber-700 rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all resize-none placeholder:text-slate-600 min-h-[120px] font-mono leading-relaxed custom-scrollbar"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleChat(e);
                                            }
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={chatProcessing || !chatData.message}
                                        className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-cyber-700 disabled:text-slate-600 transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
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
