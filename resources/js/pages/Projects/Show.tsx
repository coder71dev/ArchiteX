import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { 
    ChevronRight, MessageSquare, Send, Zap, Clock, 
    Layers, FileText, CheckSquare, Users, 
    Maximize2, Download, RefreshCcw, Sparkles,
    ZoomIn, X, AlertCircle, Lightbulb, Shield,
    Calendar, Flag, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Initialize Mermaid once globally
mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    securityLevel: 'loose',
    themeVariables: {
        primaryColor: '#4f46e5',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#e2e8f0',
        lineColor: '#6366f1',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#ffffff',
        fontFamily: 'Inter',
        fontSize: '12px',
    },
});

// Mermaid rendering component
const Mermaid = ({ chart, title = 'Blueprint' }: { chart: string, title?: string }) => {
    const [svg, setSvg] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showRaw, setShowRaw] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Create a stable, unique ID for this instance
    const [id] = useState(() => `mermaid-${Math.random().toString(36).substring(2, 11)}`);

    useEffect(() => {
        
        const renderChart = async () => {
            if (!chart) return;
            try {
                setError(null);
                
                // Safe Parser: Fix common AI Mermaid syntax mistakes
                let processedChart = chart.trim();
                
                // Fix: any diagram type followed immediately by something else
                const diagramTypes = ['graph TD', 'graph LR', 'erDiagram', 'sequenceDiagram', 'gantt', 'pie', 'classDiagram', 'stateDiagram'];
                diagramTypes.forEach(type => {
                    const regex = new RegExp(`^(${type})(?!\\s|\\n)`, 'i');
                    processedChart = processedChart.replace(regex, `$1\n`);
                });

                const { svg } = await mermaid.render(id, processedChart);
                setSvg(svg);
            } catch (err: any) {
                console.error('Mermaid error:', err);
                setError('Neural visualization syntax error. Could not render architectural diagram.');
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-rose-500/60" />
                    <p className="text-xs text-rose-500/80 font-bold uppercase tracking-widest leading-relaxed">
                        {error}
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                    {showRaw ? 'Hide Raw Logic' : 'View Raw Logic'}
                </button>

                {showRaw && (
                    <pre className="w-full p-4 bg-cyber-900 border border-cyber-700 rounded-lg text-left text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-pre custom-scrollbar">
                        {chart}
                    </pre>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative group">
                <button 
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-6 right-6 p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-600 hover:border-indigo-100 shadow-2xl z-10 active:scale-95"
                    title="Immersive Architectural View"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <div className="overflow-x-auto flex justify-center w-full mermaid-container min-h-[200px]" dangerouslySetInnerHTML={{ __html: isFullscreen ? '' : svg }} />
            </div>

            {/* Fullscreen Neural Modal */}
            {isFullscreen && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-12 bg-white/95 backdrop-blur-2xl transition-all animate-fade-in select-none">
                    {/* Control Bar */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent flex items-center justify-between px-12 z-[100000]">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic mb-1">Architecture Immersive Engine</span>
                            <span className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{title}</span>
                        </div>
                        <button 
                            onClick={() => setIsFullscreen(false)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center gap-4 group shadow-xl"
                        >
                            <X className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="absolute inset-0 pt-32 pb-12 px-4 md:px-12 overflow-auto custom-scrollbar">
                        <style dangerouslySetInnerHTML={{ __html: `
                            .zoomable-blueprint svg { 
                                max-width: none !important; 
                                width: max(85vw, 900px) !important; 
                                height: auto !important; 
                                mix-blend-mode: multiply;
                            }
                        ` }} />
                        <div className="w-fit mx-auto bg-white p-6 md:p-12 rounded-[3rem] border border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
                            <div 
                                className="zoomable-blueprint"
                                dangerouslySetInnerHTML={{ __html: svg.split(id).join(`${id}-fs`) }} 
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-12 p-6 bg-white border border-slate-200 rounded-[2rem] shadow-2xl flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-50" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Deep Sync Neural Stream Active</span>
                        </div>
                    </div>
                </div>,
                document.body
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

    const [expandedMilestones, setExpandedMilestones] = useState<number[]>(
        project.blueprints.length > 0 ? project.blueprints[0].milestones.map((_: any, i: number) => i) : []
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
        <div className="min-h-screen bg-slate-50 text-slate-600 font-studio">
            <Head title={`${project.title} - ArchiteX`} />

            {/* Header / Breadcrumb */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
                <div className="px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={route('dashboard')} className="text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-[10px] transition-colors">
                            Infrastructure
                        </Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="font-black text-slate-900 uppercase italic tracking-tight">{project.title}</span>
                        <div className="relative group ml-6">
                            <button className="flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm italic uppercase tracking-widest outline-none">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Version {blueprint.version || 1}.0</span>
                            </button>
                            
                            <div className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 origin-top-left p-3">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Neural Versioning History</span>
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar space-y-2">
                                    {project.blueprints.map((b: any) => (
                                        <button
                                            key={b.id}
                                            onClick={() => setSelectedVersion(b.version)}
                                            className={`w-full text-left p-4 rounded-2xl text-xs flex flex-col gap-2 transition-all group/item ${
                                                selectedVersion === b.version 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                : 'text-slate-400 hover:bg-slate-50 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between font-black uppercase tracking-tight italic">
                                                <span className="flex items-center gap-2">
                                                    v{b.version}.0
                                                    {b.version === project.blueprints[0].version && (
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded leading-none ${selectedVersion === b.version ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>CURRENT</span>
                                                    )}
                                                </span>
                                                <span className={`text-[9px] font-bold ${selectedVersion === b.version ? 'text-white/60' : 'text-slate-400'}`}>{new Date(b.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <span className={`text-[10px] line-clamp-1 italic font-medium ${selectedVersion === b.version ? 'text-white/80' : 'text-slate-500 italic'}`}>"{b.change_summary || 'Synchronizing with Neural Core...'}"</span>
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
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">Client Specification</span>
                                        <span className="text-xs font-black text-slate-900 uppercase italic">{project.client_name}</span>
                                    </div>
                                )}
                                {project.target_deadline && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">Timeline Target</span>
                                        <span className="text-xs font-black text-slate-900 uppercase italic">{new Date(project.target_deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="btn-secondary py-1.5 px-3">
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border-2 border-white shadow-xl shadow-slate-200 overflow-hidden">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                    </div>
                </div>
            </div>

                <div className="flex h-[calc(100vh-4rem)]">
                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-3 mb-12 p-1.5 bg-white rounded-[2rem] border border-slate-200 w-fit shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-50/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {[
                            { id: 'blueprint', label: 'Architecture', icon: Layers },
                            { id: 'estimate', label: 'Estimations', icon: Clock },
                            { id: 'proposal', label: 'Proposal', icon: FileText },
                            { id: 'roadmap', label: 'Evolution', icon: Calendar },
                            { id: 'tasks', label: 'Sync Board', icon: CheckSquare },
                            { id: 'team', label: 'Neural Team', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] text-[10px] uppercase font-black tracking-[0.1em] transition-all relative z-10 italic ${
                                    activeTab === tab.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 -translate-y-0.5' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="animate-fade-in text-slate-600">
                        {project.status === 'planning' && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 py-20">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-md">
                                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent capitalize">
                                        Architecting: {project.current_phase || 'Project'}
                                    </h2>
                                    <p className="text-slate-500 leading-relaxed">
                                        The Neural Vault is orchestrating multi-agent simulations to generate your technical blueprint, resource estimates, and task breakdown.
                                    </p>
                                    
                                    {project.latest_status_message && (
                                        <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 text-xs font-bold animate-pulse">
                                            <Zap className="w-3.5 h-3.5" />
                                            {project.latest_status_message}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'blueprint' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>Blueprint</div>
                                        <div className="w-4 h-[1px] bg-slate-200" />
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'estimation' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>Estimation</div>
                                        <div className="w-4 h-[1px] bg-slate-200" />
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${project.current_phase === 'proposal' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>Proposal</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {project.error_message && project.status !== 'planning' && (
                            <div className="card border-rose-200 bg-rose-50 p-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                                    <Zap className="w-8 h-8 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-bold text-rose-600">Neural Sync Interrupted</h3>
                                <p className="text-slate-500 max-w-lg mx-auto">{project.error_message}</p>
                                <button 
                                    onClick={() => router.post(route('projects.chat', project.id), { message: 'Neural Sync Retry: Recovering from the last interrupted architectural phase.', retry: true })}
                                    className="btn-primary bg-rose-500 hover:bg-rose-600 mt-4 h-12 px-10 flex items-center gap-2 group"
                                >
                                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    Force Phase Recovery
                                </button>
                            </div>
                        )}

                        {project.status !== 'planning' && !project.error_message && (
                            <>
                        {/* Blueprint Tab */}
                        {activeTab === 'blueprint' && (
                            <div className="space-y-12">
                                <header className="max-w-4xl">
                                    <div className="mb-10 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-100 rounded-full blur-3xl group-hover:bg-indigo-200 transition-all duration-700" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" />
                                            PRD: ORIGINAL MISSION BRIEF
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-4 border-l-2 border-indigo-200 pl-4 py-1">
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-slate-500 prose-p:italic">
                                                <ReactMarkdown>
                                                    {project.brief}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900">Strategic Framework</h2>
                                    <p className="text-slate-500 leading-relaxed text-lg max-w-2xl">
                                        {blueprint.overview}
                                    </p>
                                </header>

                                {blueprint.businessContext && (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        <div className="card p-8 border-l-4 border-l-rose-500 bg-white">
                                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-rose-600">
                                                <AlertCircle className="w-5 h-5" />
                                                Business Challenges
                                            </h3>
                                            <ul className="space-y-3">
                                                {blueprint.businessContext.challenges?.map((c: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-500 leading-relaxed">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-200 mt-2 shrink-0" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="card p-8 border-l-4 border-l-amber-500 bg-white">
                                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-amber-600">
                                                <Lightbulb className="w-5 h-5" />
                                                Strategic Suggestions
                                            </h3>
                                            <ul className="space-y-3">
                                                {blueprint.businessContext.suggestions?.map((s: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-500 leading-relaxed">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-200 mt-2 shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="card p-8 bg-white">
                                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                            <Zap className="text-amber-500 w-5 h-5" />
                                            Architectural Strategy
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Decision</span>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-indigo-600">
                                                    {blueprint.strategy?.decision}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Critical Tradeoffs</span>
                                                <ul className="space-y-2">
                                                    {blueprint.strategy?.tradeoffs?.map((t: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                            {t}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card p-8 bg-white">
                                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                            <Sparkles className="text-indigo-500 w-5 h-5" />
                                            Phased Feature Scope
                                        </h3>
                                        <div className="space-y-4">
                                            {['mvp', 'v1', 'future'].map(stage => (
                                                <div key={stage} className="flex gap-4 items-start">
                                                    <div className={`mt-1 font-black text-xs uppercase tracking-tighter ${
                                                        stage === 'mvp' ? 'text-rose-500' : stage === 'v1' ? 'text-indigo-500' : 'text-slate-400'
                                                    } w-12 pt-1`}>{stage}</div>
                                                    <div className="flex-1 flex flex-wrap gap-2">
                                                        {blueprint.scope?.[stage]?.map((item: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-slate-50 rounded-lg text-xs border border-slate-100 text-slate-600">
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
                                <div className="space-y-12">
                                    <h3 className="font-black text-3xl text-slate-900 uppercase italic tracking-tight">Architectural Prototypes</h3>
                                    <div className="space-y-16">
                                        <section className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-600">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">System Context & Integration Flow</label>
                                            </div>
                                            <Mermaid chart={blueprint.architecture?.hldMermaid} title={`${project.title} - High Level Design`} />
                                        </section>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                                            <section className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-500">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Data Model Architecture</label>
                                                </div>
                                                <Mermaid chart={blueprint.architecture?.dbMermaid} title={`${project.title} - Database Schema`} />
                                            </section>
                                            <section className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-500">
                                                        <Sparkles className="w-5 h-5" />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Client Application Flow</label>
                                                </div>
                                                <Mermaid chart={blueprint.architecture?.frontendMermaid} title={`${project.title} - Frontend Logic`} />
                                            </section>
                                        </div>
                                    </div>
                                </div>

                                {blueprint.techStack && (
                                    <section className="space-y-10 pt-16 border-t border-slate-200">
                                        <h3 className="text-4xl font-black flex items-center gap-4 text-slate-900 uppercase italic tracking-tight">
                                            <Layers className="text-indigo-600 w-8 h-8" />
                                            Tech Stack Specification
                                        </h3>
                                        <div className="grid grid-cols-1 gap-8">
                                            {blueprint.techStack.map((stack: any, i: number) => (
                                                <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex flex-col lg:flex-row lg:items-start gap-12 relative z-10">
                                                        <div className="lg:w-1/3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 block italic">Core Selection</span>
                                                            <span className="text-xl font-black text-slate-900 uppercase italic mb-6 block">{stack.category}</span>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {stack.items.map((item: string, j: number) => (
                                                                    <span key={j} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black border border-indigo-100 uppercase tracking-widest italic shadow-sm hover:bg-white transition-all">
                                                                        {item}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-8">
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block italic">Architecture Rationale</span>
                                                                <p className="text-sm text-slate-600 leading-relaxed font-bold italic border-l-4 border-indigo-600 pl-6 bg-slate-50 py-5 rounded-r-3xl">
                                                                    "{stack.rationale}"
                                                                </p>
                                                            </div>
                                                            {stack.alternatives && stack.alternatives.length > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block italic">Discarded Benchmarks</span>
                                                                    <div className="flex flex-wrap gap-2.5">
                                                                        {stack.alternatives.map((alt: string, j: number) => (
                                                                            <span key={j} className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-widest italic strike-through opacity-60">
                                                                                {alt}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {blueprint.architecture?.considerations && (
                                    <section className="space-y-10 pt-16 border-t border-slate-200">
                                        <h3 className="text-4xl font-black flex items-center gap-4 text-slate-900 uppercase italic tracking-tight">
                                            <Shield className="text-rose-600 w-8 h-8" />
                                            Architectural Safeguards
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {blueprint.architecture.considerations.map((consideration: string, i: number) => (
                                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse border-4 border-rose-50 group-hover:bg-indigo-600 transition-colors" />
                                                    <span className="text-sm text-slate-600 font-bold italic leading-relaxed">{consideration}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {/* Estimate Tab */}
                        {activeTab === 'estimate' && (
                            <div className="space-y-10">
                                <header className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-4 block italic">Resource Commitment</span>
                                        <div className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-end gap-2">
                                            {estimate.total_hours}
                                            <span className="text-sm text-slate-400 mb-1">Hours</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-4 block italic">Evolution Cycle</span>
                                        <div className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-end gap-2">
                                            {estimate.duration_weeks}
                                            <span className="text-sm text-slate-400 mb-1">Weeks</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-4 block italic">Neural Flux Buffer</span>
                                        <div className="text-4xl font-black text-emerald-600 uppercase italic tracking-tighter flex items-end gap-2">
                                            +{estimate.risk_buffer_percent}%
                                        </div>
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

                                    <div className="space-y-8">
                                        <h3 className="font-black text-xl text-slate-900 uppercase italic tracking-tight">Phase Breakdown</h3>
                                        <div className="space-y-4">
                                            {estimate.phase_breakdown?.map((p: any, i: number) => (
                                                <div key={i} className="flex items-center gap-6">
                                                    <div className="w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest italic truncate">{p.phase}</div>
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                                                        <div 
                                                            className="h-full bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all duration-1000" 
                                                            style={{ width: `${(p.hours / estimate.total_hours) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-16 text-xs font-black text-slate-900 italic text-right">{p.hours}H</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proposal Tab */}
                        {activeTab === 'proposal' && (
                            <div className="max-w-4xl mx-auto bg-white p-16 lg:p-24 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden active:scale-[0.99] transition-transform">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50"></div>
                                <div className="prose prose-slate prose-architex max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:uppercase prose-headings:italic prose-headings:font-black prose-strong:text-indigo-600">
                                    <ReactMarkdown>{proposal.content}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Roadmap Tab */}
                        {activeTab === 'roadmap' && (
                            <div className="space-y-16 animate-fade-in mb-24">
                                <header className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div>
                                        <h2 className="text-4xl font-black mb-4 tracking-tighter text-slate-900 uppercase italic">Execution Framework</h2>
                                        <p className="text-slate-500 font-bold italic tracking-tight border-l-4 border-indigo-600 pl-6">Synchronizing v{blueprint.version}.0 architectural milestones with validated developer units</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="bg-white px-8 py-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1">
                                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.3em] italic">Strategic Milestones</span>
                                            <div className="text-3xl font-black text-slate-900 italic">{blueprint.milestones?.length || 0}</div>
                                        </div>
                                        <div className="bg-white px-8 py-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1">
                                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.3em] italic">Validated Units</span>
                                            <div className="text-3xl font-black text-indigo-600 italic">{tasks.length}</div>
                                        </div>
                                    </div>
                                </header>

                                {/* Visual Roadmap Chart */}
                                <section className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-600">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-black text-2xl text-slate-900 uppercase italic tracking-tight">Neural Timeline Alpha</h3>
                                    </div>
                                    
                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar relative group">
                                        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Mermaid 
                                            title={`${project.title} - Execution Roadmap`}
                                            chart={`gantt
    title ${project.title} Timeline
    dateFormat  YYYY-MM-DD
    axisFormat %W
    section Strategic Milestones
    ${blueprint.milestones?.map((m: any, i: number) => {
        const name = (m.name || `Phase ${i+1}`).replace(/"/g, "'");
        return `"${name}" :milestone, m${i}, 2024-01-01, 1d`;
    }).join('\n    ')}
    section Execution Phases
    ${blueprint.milestones?.map((m: any, i: number) => {
        const name = (m.name || `Phase ${i+1}`).replace(/"/g, "'");
        // Clean duration to be mermaid compatible (e.g. 2w, 4d)
        let duration = m.duration || "1w";
        if (duration.toLowerCase().includes('week')) duration = parseInt(duration) + 'w';
        else if (duration.toLowerCase().includes('day')) duration = parseInt(duration) + 'd';
        return `"${name} Phase" :active, p${i}, 2024-01-01, ${duration}`;
    }).join('\n    ')}`} 
                                        />
                                    </div>
                                </section>

                                {/* Milestonewise Tasks Tables */}
                                <section className="space-y-12">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-600">
                                            <Flag className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-black text-2xl text-slate-900 uppercase italic tracking-tight">Granular Phase Units</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-12 relative before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-1 before:bg-slate-100 before:rounded-full">
                                        {blueprint.milestones?.map((milestone: any, mIndex: number) => {
                                            const milestoneTasks = tasks.filter((t: any) => t.milestone_index === mIndex);
                                            const isExpanded = expandedMilestones.includes(mIndex);
                                            
                                            return (
                                                <div key={mIndex} className="relative pl-16">
                                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-2xl bg-white border-4 border-indigo-600 shadow-xl shadow-indigo-100 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer" onClick={() => {
                                                        if (isExpanded) setExpandedMilestones(expandedMilestones.filter(i => i !== mIndex));
                                                        else setExpandedMilestones([...expandedMilestones, mIndex]);
                                                    }}>
                                                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                                    </div>
                                                    
                                                    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 hover:shadow-2xl transition-all group active:scale-[0.99]">
                                                        <button 
                                                            onClick={() => {
                                                                if (isExpanded) setExpandedMilestones(expandedMilestones.filter(i => i !== mIndex));
                                                                else setExpandedMilestones([...expandedMilestones, mIndex]);
                                                            }}
                                                            className="w-full bg-white px-10 py-8 flex items-center justify-between group-hover:bg-slate-50/50 transition-all text-left"
                                                        >
                                                            <div className="flex items-center gap-10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-2 italic">Phase {(mIndex + 1).toString().padStart(2, '0')} Pulse</span>
                                                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{milestone.name}</h4>
                                                                </div>
                                                                <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-slate-50 text-[10px] font-black text-slate-400 rounded-2xl border border-slate-200 uppercase tracking-[0.1em] italic">
                                                                    <Clock className="w-4 h-4 text-indigo-600" />
                                                                    {milestone.duration || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div className={`w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all ${isExpanded ? 'rotate-180 bg-indigo-600 text-white' : ''}`}>
                                                                <ChevronDown className="w-5 h-5" />
                                                            </div>
                                                        </button>
                                                        
                                                        <div className={`transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                            <div className="p-10 space-y-12 bg-slate-50/30">
                                                                <div className="flex flex-col lg:flex-row gap-12">
                                                                    <div className="flex-1">
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4 italic">Execution Directive</span>
                                                                        <p className="text-sm text-slate-600 leading-relaxed font-bold italic border-l-4 border-indigo-600 pl-8 bg-white py-6 rounded-r-[2rem] shadow-sm">
                                                                            "{milestone.description}"
                                                                        </p>
                                                                    </div>
                                                                    <div className="lg:w-1/3">
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4 italic">Neural Deliverables</span>
                                                                        <div className="flex flex-wrap gap-3">
                                                                            {milestone.deliverables?.map((d: string, di: number) => (
                                                                                <span key={di} className="px-4 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase rounded-xl tracking-widest italic shadow-sm hover:border-indigo-600 transition-all">
                                                                                    {d}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                
                                                                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-x-auto">
                                                                    <table className="w-full text-left">
                                                                        <thead>
                                                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                                                <th className="px-8 py-5 font-black uppercase tracking-[0.2em] text-slate-400 text-[9px] italic">Priority Pulse</th>
                                                                                <th className="px-8 py-5 font-black uppercase tracking-[0.2em] text-slate-400 text-[9px] italic">Developer Unit Specification</th>
                                                                                <th className="px-8 py-5 font-black uppercase tracking-[0.2em] text-slate-400 text-[9px] italic text-right">Commit Effort</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {milestoneTasks.length > 0 ? (
                                                                                milestoneTasks.map((task: any, tIndex: number) => (
                                                                                    <tr key={tIndex} className="hover:bg-indigo-50/30 transition-all group/row cursor-default">
                                                                                        <td className="px-8 py-6">
                                                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest italic ${
                                                                                                task.priority === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                                                task.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                                                'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                                            }`}>
                                                                                                {task.priority}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-8 py-6">
                                                                                            <div className="font-black text-slate-900 uppercase italic group-hover/row:text-indigo-600 transition-colors tracking-tight">{task.title}</div>
                                                                                            <div className="text-[11px] text-slate-400 font-bold italic mt-1.5 line-clamp-1">{task.description}</div>
                                                                                        </td>
                                                                                        <td className="px-8 py-6 text-right font-black text-slate-900 italic tracking-tighter text-lg">
                                                                                            {task.estimated_hours}H
                                                                                        </td>
                                                                                    </tr>
                                                                                ))
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic text-[10px] tracking-[0.3em] uppercase font-black">
                                                                                        Neural Synchrony Pending for Phase {(mIndex + 1).toString().padStart(2, '0')}
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Tasks Tab */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-12 animate-fade-in mb-24">
                                <header className="flex items-center justify-between bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none" />
                                    <div>
                                        <h2 className="text-4xl font-black mb-3 tracking-tighter text-slate-900 uppercase italic">Sync Board Alpha</h2>
                                        <p className="text-slate-500 font-bold italic tracking-tight border-l-4 border-indigo-600 pl-6">Granular developer units pending synchronization with the Neural Core</p>
                                    </div>
                                    <div className="flex gap-4 relative z-10">
                                        {['todo', 'in_progress', 'review', 'done'].map(s => (
                                            <div key={s} className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] uppercase font-black text-slate-400 border border-slate-200 italic tracking-widest flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${s === 'done' ? 'bg-emerald-500' : s === 'in_progress' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                                                {s.replace('_', ' ')}: {tasks.filter((t:any) => t.status === s).length}
                                            </div>
                                        ))}
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 gap-6">
                                    {tasks.map((task: any, i: number) => (
                                        <div key={task.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group flex items-start gap-10 active:scale-[0.99] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className={`mt-2 h-4 w-4 rounded-full shrink-0 border-4 border-white shadow-xl ${
                                                task.priority === 'critical' ? 'bg-rose-500 shadow-rose-200 animate-pulse' :
                                                task.priority === 'high' ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'
                                            }`} />
                                            
                                            <div className="flex-1 relative z-10">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                                                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] italic border border-slate-200">{task.phase}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold italic leading-relaxed line-clamp-1">{task.description}</p>
                                            </div>

                                            <div className="flex items-center gap-12 relative z-10">
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900 italic tracking-tighter">{task.estimated_hours}H</div>
                                                    <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest italic">Est. Committed</div>
                                                </div>
                                                <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-white shadow-xl shadow-slate-200 flex items-center justify-center overflow-hidden group-hover:shadow-indigo-100 transition-all" title={task.assignee?.name}>
                                                    {task.assignee ? (
                                                        <span className="text-sm font-black text-indigo-600 italic uppercase">{task.assignee.name.split(' ').map((n:any) => n[0]).join('')}</span>
                                                    ) : <Users className="w-6 h-6 text-slate-300" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Tab */}
                        {activeTab === 'team' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {team.map(member => (
                                    <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden active:scale-95">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-6 mb-8 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center border-4 border-white shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                                                <span className="text-2xl font-black text-white italic">{member.name.charAt(0)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{member.name}</h4>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 relative z-10">
                                            {member.skills.map(s => (
                                                <span key={s} className="px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest italic group-hover:bg-white group-hover:border-indigo-100 transition-colors">
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
            <aside className="w-[30rem] border-l border-slate-200 bg-white/50 backdrop-blur-xl flex flex-col pt-6 shadow-2xl relative z-50">
                    <div className="px-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="flex items-center gap-3 font-black text-slate-900 uppercase italic tracking-tight">
                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                Neural Assistant
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Sync</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black italic">Architecture Evolution Session v{blueprint.version}.0</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
                        <div className="bg-white p-6 rounded-3xl rounded-tl-none border border-slate-200 text-sm text-slate-600 leading-relaxed shadow-sm relative group">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 italic">ArchiteX Core Protocol</span>
                            </div>
                            <p className="font-bold italic">Greetings Architect. Architectural integrity for <span className="text-indigo-600">v{blueprint.version}.0</span> is currently verified. How shall we expand the scope?</p>
                        </div>

                        {/* Render Initial Brief as first message */}
                        <div className="flex flex-col items-end">
                            <div className="max-w-[95%] p-6 bg-slate-900 text-white rounded-[2.5rem] rounded-tr-none shadow-2xl relative group transition-all">
                                <div className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-[9px] font-black uppercase tracking-[0.3em] rounded-full text-white shadow-xl italic">Mission Blueprint</div>
                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed text-slate-200 font-bold italic prose-headings:text-white prose-strong:text-indigo-400">
                                    <ReactMarkdown>{project.brief}</ReactMarkdown>
                                </div>
                            </div>
                            <span className="text-[9px] mt-3 px-3 uppercase tracking-[0.2em] font-black text-slate-400 italic">
                                Original Genesis • {new Date(project.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {messages.map((msg: any, index: number) => {
                            let content = msg.content;
                            let isJson = false;
                            let parsedContent: any = null;

                            const isSystemAction = msg.role === 'user' && (
                                content.includes('Based on the updated blueprint') || 
                                content.includes('Generate a technical proposal') ||
                                content.includes('Generate granular, assignable developer tasks') ||
                                content.includes('Neural Sync Retry')
                            );

                            try {
                                if (content.trim().startsWith('{')) {
                                    parsedContent = JSON.parse(content);
                                    isJson = true;
                                }
                            } catch (e) {}

                            if (isSystemAction) {
                                return (
                                    <div key={msg.id || index} className="flex flex-col items-center py-6 px-4">
                                        <div className="flex items-center gap-4 w-full opacity-30">
                                            <div className="flex-1 h-px bg-slate-300"></div>
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <div className="flex-1 h-px bg-slate-300"></div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 italic">Autonomous Workflow Pulse</span>
                                    </div>
                                );
                            }

                            return (
                                <div 
                                    key={msg.id || index} 
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[95%] p-6 rounded-[2.5rem] text-sm shadow-sm transition-all duration-300 ${
                                        msg.role === 'user' 
                                        ? 'bg-white border border-slate-200 text-slate-900 rounded-tr-none shadow-indigo-100 hover:shadow-xl' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none hover:shadow-xl'
                                    }`}>
                                        {isJson ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center border-4 border-white shadow-lg shadow-indigo-100">
                                                        <Sparkles className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Sync Established</span>
                                                </div>
                                                <p className="text-slate-600 leading-relaxed font-bold italic">
                                                    "{parsedContent.overview || 'Architecture synchronized successfully.'}"
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-[10px]">
                                                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-black uppercase tracking-widest italic">Reliability: {parsedContent.reliabilityScore}%</span>
                                                    <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 font-black uppercase tracking-widest italic">v{blueprint.version}.0</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-2xl prose-pre:p-6 prose-p:font-bold prose-p:italic ${msg.role === 'user' ? 'prose-p:text-slate-900' : 'text-slate-600'}`}>
                                                <ReactMarkdown>
                                                    {content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[9px] mt-2.5 px-3 uppercase tracking-[0.3em] font-black italic ${msg.role === 'user' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {msg.role === 'user' ? 'Architect' : 'ArchiteX Neural'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                        
                        {isThinking && (
                            <div className="flex items-center gap-4 p-8 bg-white rounded-[2rem] border border-slate-200 animate-pulse shadow-sm">
                                <div className="flex gap-2">
                                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic">Neural Processing Protocol...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-slate-200">
                        <form onSubmit={handleChat} className="relative group">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                        Evolution Directive
                                    </span>
                                    <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-200 flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">MD Engine</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={chatData.message}
                                        onChange={e => setChatData('message', e.target.value)}
                                        placeholder="DIRECTIVE: e.g. 'Integrate Redis Cache' or 'Scale Frontend Clusters'"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-6 pr-16 py-5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none placeholder:text-slate-300 min-h-[140px] font-bold italic leading-relaxed custom-scrollbar shadow-inner"
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
                                        className="absolute right-4 bottom-4 w-12 h-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center active:scale-90"
                                    >
                                        <Send className="w-5 h-5" />
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
