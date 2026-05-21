import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, CheckSquare, ArrowRight, Zap, Layout, LogOut, User, Sparkles, CheckCircle, Users } from 'lucide-react';

interface TeamMember {
    id: string;
    name: string;
    stack: string;
    availability_hours: number;
}

interface Task {
    id: string;
    title: string;
    description: string;
    stack: string;
    priority: string;
    status: string;
    estimated_hours: number;
    checklist_items: string[];
    completed_checklist: number[];
    parent_id?: string | null;
    children?: Task[];
    assignee?: { id: string; name: string } | null;
}

interface Milestone {
    id: string;
    title: string;
    tasks: Task[];
}

interface ProjectProps {
    project: {
        id: string;
        title: string;
        planning_phase: string;
        milestones: Milestone[];
    };
    team: TeamMember[];
}

const stackColors: Record<string, string> = {
    frontend: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    backend: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mobile: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    design: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    devops: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    qa: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const priorityColors: Record<string, string> = {
    critical: 'text-rose-500',
    high: 'text-amber-500',
    medium: 'text-[#F3B323]',
    low: 'text-zinc-500',
};

function AssigneeDropdown({ task, team }: { task: Task; team: TeamMember[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const suitableMembers = team.filter(m => m.stack === task.stack);

    const handleAssign = (memberId: string) => {
        router.put(route('tasks.assign', task.id), {
            team_member_id: memberId,
            reason: 'Manual assignment during task review',
        }, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0c13] rounded-lg border border-[#261E2E] hover:border-[#F93A8B]/30 transition-colors text-xs"
            >
                {task.assignee ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-[#F93A8B]/20 flex items-center justify-center text-[10px] font-bold text-[#F93A8B]">
                            {task.assignee.name.charAt(0)}
                        </div>
                        <span className="text-zinc-300">{task.assignee.name}</span>
                    </>
                ) : (
                    <>
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Unassigned</span>
                    </>
                )}
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-[#15121a] border border-[#261E2E] rounded-xl shadow-2xl z-50 py-2 max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider border-b border-[#261E2E]">
                            Assign to ({task.stack})
                        </div>
                        {suitableMembers.length === 0 && (
                            <div className="px-3 py-2 text-xs text-zinc-500">No {task.stack} team members</div>
                        )}
                        {suitableMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => handleAssign(member.id)}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#F93A8B]/10 transition-colors ${task.assignee?.id === member.id ? 'bg-[#F93A8B]/10' : ''}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-[#261E2E] flex items-center justify-center text-[10px] font-bold text-[#F93A8B]">
                                    {member.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-zinc-300 truncate">{member.name}</div>
                                    <div className="text-[10px] text-zinc-600">{member.availability_hours}h/wk</div>
                                </div>
                                {task.assignee?.id === member.id && (
                                    <CheckSquare className="w-3.5 h-3.5 text-[#F93A8B]" />
                                )}
                            </button>
                        ))}
                        <div className="border-t border-[#261E2E] mt-1 pt-1">
                            <button
                                onClick={() => handleAssign('')}
                                className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                                Unassign
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function TaskNode({ task, team, depth = 0 }: { task: Task; team: TeamMember[]; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const [checklist, setChecklist] = useState(task.checklist_items || []);
    const [completed, setCompleted] = useState(task.completed_checklist || []);
    const hasChildren = task.children && task.children.length > 0;
    const isParent = !task.parent_id || depth === 0;

    const toggleChecklist = (index: number) => {
        const newCompleted = completed.includes(index)
            ? completed.filter(i => i !== index)
            : [...completed, index];
        setCompleted(newCompleted);
        
        router.put(route('tasks.update-checklist', task.id), {
            completed_checklist: newCompleted,
        }, { preserveScroll: true });
    };

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-[#261E2E] pl-4' : ''}`}>
            <div className={`bg-[#15121a] rounded-xl border border-[#261E2E] p-4 mb-3 hover:border-[#F93A8B]/20 transition-colors ${isParent ? 'border-l-4 border-l-[#F93A8B]' : ''}`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {hasChildren && (
                                <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-white">
                                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            )}
                            <h4 className={`font-bold ${isParent ? 'text-lg text-white' : 'text-sm text-zinc-300'}`}>
                                {task.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${stackColors[task.stack] || stackColors.other}`}>
                                {task.stack}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || 'text-zinc-500'}`}>
                                {task.priority}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-600">
                            <span>{task.estimated_hours}h</span>
                            <AssigneeDropdown task={task} team={team} />
                        </div>

                        {/* Checklist */}
                        {checklist.length > 0 && (
                            <div className="mt-3 space-y-1">
                                {checklist.map((item, i) => (
                                    <label key={i} className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${completed.includes(i) ? 'bg-[#F93A8B] border-[#F93A8B]' : 'border-zinc-600 group-hover:border-[#F93A8B]'}`}>
                                            {completed.includes(i) && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={completed.includes(i)}
                                            onChange={() => toggleChecklist(i)}
                                            className="hidden"
                                        />
                                        <span className={`text-xs ${completed.includes(i) ? 'text-zinc-500 line-through' : 'text-zinc-400'}`}>
                                            {item}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {hasChildren && expanded && (
                <div className="mb-3">
                    {task.children!.map(child => (
                        <TaskNode key={child.id} task={child} team={team} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Tasks({ project, team }: ProjectProps) {
    const isGenerating = project.planning_phase === 'milestones_ready';

    // Poll if tasks are still generating
    React.useEffect(() => {
        if (isGenerating) {
            const interval = setInterval(() => {
                router.reload({ only: ['project'] });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isGenerating]);

    const handleApprove = () => {
        router.post(route('projects.wizard.approve-tasks', project.id));
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[#0f0c13] text-white flex items-center justify-center">
                <Head title="Generating Tasks..." />
                <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-[#F93A8B]/20 border-t-[#F93A8B] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#F93A8B] animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Breaking Down Tasks</h2>
                        <p className="text-zinc-400">Generating parent tasks, child tasks, and checklists...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0c13] text-white selection:bg-[#F93A8B]/30">
            <Head title="Review Tasks" />
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

            <main className="pl-20 min-h-screen p-12">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-12 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CheckSquare className="w-6 h-6 text-[#F93A8B]" />
                                <h1 className="text-3xl font-extrabold tracking-tight">Review Tasks</h1>
                            </div>
                            <p className="text-zinc-400">Review the task hierarchy, edit checklists, and approve for team assignment.</p>
                        </div>
                        <button
                            onClick={handleApprove}
                            className="bg-gradient-to-r from-[#F93A8B] to-[#c033d6] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Approve & Assign Team
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </header>

                    <div className="space-y-8">
                        {project.milestones.map((milestone) => (
                            <div key={milestone.id}>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#F93A8B]" />
                                    {milestone.title}
                                </h2>
                                <div className="space-y-3">
                                    {milestone.tasks?.map(task => (
                                        <TaskNode key={task.id} task={task} team={team} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {project.milestones.length === 0 && (
                            <div className="text-center py-20 text-zinc-500">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                                <p>No tasks generated yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
