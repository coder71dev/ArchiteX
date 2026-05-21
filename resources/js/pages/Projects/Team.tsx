import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowRight, Zap, Layout, LogOut, User, Users, Sparkles, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    stack: string;
    availability_hours: number;
    skills: string[];
}

interface Task {
    id: string;
    title: string;
    stack: string;
    estimated_hours: number;
    assignee?: { id: string; name: string } | null;
}

interface ProjectProps {
    project: {
        id: string;
        title: string;
        milestones: Array<{
            tasks: Array<{
                id: string;
                title: string;
                stack: string;
                estimated_hours: number;
                children: Task[];
            }>;
        }>;
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

function AssigneeDropdown({ task, team }: { task: Task; team: TeamMember[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const suitableMembers = team.filter(m => m.stack === task.stack);

    const handleAssign = (memberId: string) => {
        router.put(route('tasks.assign', task.id), {
            team_member_id: memberId,
            reason: 'Manual reassignment during team review',
        }, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1 bg-[#0f0c13] rounded-lg border border-[#261E2E] hover:border-[#F93A8B]/30 transition-colors text-xs"
            >
                {task.assignee ? (
                    <span className="text-zinc-300">{task.assignee.name}</span>
                ) : (
                    <span className="text-zinc-500">Unassigned</span>
                )}
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-[#15121a] border border-[#261E2E] rounded-xl shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                        {suitableMembers.map(member => (
                            <button
                                key={member.id}
                                onClick={() => handleAssign(member.id)}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F93A8B]/10 transition-colors ${task.assignee?.id === member.id ? 'bg-[#F93A8B]/10 text-[#F93A8B]' : 'text-zinc-300'}`}
                            >
                                {member.name}
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

export default function Team({ project, team }: ProjectProps) {
    const handleAutoAssign = () => {
        router.post(route('projects.wizard.assign-team', project.id));
    };

    // Collect all tasks from all milestones (flat list)
    const allTasks = React.useMemo(() => {
        const tasks: Task[] = [];
        project.milestones.forEach(m => {
            m.tasks?.forEach((t: any) => {
                tasks.push(t);
                t.children?.forEach((child: any) => tasks.push(child));
            });
        });
        return tasks;
    }, [project]);

    // Calculate workload for each team member
    const workloadData = React.useMemo(() => {
        return team.map(member => {
            const assignedTasks = allTasks.filter(t => t.assignee?.id === member.id);
            const totalHours = assignedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
            const percentage = member.availability_hours > 0 ? (totalHours / member.availability_hours) * 100 : 0;
            const isOverallocated = totalHours > member.availability_hours;
            
            return {
                member,
                assignedTasks,
                totalHours,
                percentage,
                isOverallocated,
            };
        });
    }, [team, allTasks]);

    // Group tasks by stack
    const tasksByStack = React.useMemo(() => {
        const groups: Record<string, Task[]> = {};
        allTasks.forEach(task => {
            if (!groups[task.stack]) groups[task.stack] = [];
            groups[task.stack].push(task);
        });
        return groups;
    }, [allTasks]);

    return (
        <div className="min-h-screen bg-[#0f0c13] text-white selection:bg-[#F93A8B]/30">
            <Head title="Assign Team" />
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
                <div className="max-w-6xl mx-auto">
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-6 h-6 text-[#F93A8B]" />
                            <h1 className="text-3xl font-extrabold tracking-tight">Assign Team</h1>
                        </div>
                        <p className="text-zinc-400 mb-6">Review workload, reassign individual tasks, then activate the project.</p>
                        
                        {workloadData.some(w => w.isOverallocated) && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 mb-6">
                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                <p className="text-sm text-rose-400">
                                    Some team members are overallocated. Consider reassigning tasks.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleAutoAssign}
                            className="bg-gradient-to-r from-[#F93A8B] to-[#c033d6] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Sparkles className="w-5 h-5" />
                            Auto-Assign & Activate Project
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Team Members Column */}
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#F93A8B]" />
                                Team Workload
                            </h2>
                            <div className="space-y-4">
                                {workloadData.map(({ member, assignedTasks, totalHours, percentage, isOverallocated }) => (
                                    <div key={member.id} className={`bg-[#15121a] rounded-xl border p-5 ${isOverallocated ? 'border-rose-500/30' : 'border-[#261E2E]'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-white">{member.name}</h3>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mt-1 ${stackColors[member.stack] || stackColors.other}`}>
                                                    {member.stack}
                                                </span>
                                            </div>
                                            {isOverallocated && (
                                                <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-500/20">
                                                    Overallocated
                                                </span>
                                            )}
                                        </div>

                                        {/* Workload Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-zinc-400">{totalHours}h / {member.availability_hours}h</span>
                                                <span className={isOverallocated ? 'text-rose-500' : percentage > 80 ? 'text-amber-500' : 'text-emerald-500'}>
                                                    {Math.round(percentage)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[#0f0c13] rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        isOverallocated ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Assigned Tasks with reassignment */}
                                        {assignedTasks.length > 0 && (
                                            <div className="space-y-2 mt-3">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                                                    {assignedTasks.length} Tasks
                                                </span>
                                                {assignedTasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between bg-[#0f0c13] rounded-lg p-2">
                                                        <span className="text-xs text-zinc-400 truncate flex-1 mr-2">{task.title}</span>
                                                        <AssigneeDropdown task={task} team={team} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tasks by Stack Column */}
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-[#F93A8B]" />
                                Tasks by Stack
                            </h2>
                            <div className="space-y-6">
                                {Object.entries(tasksByStack).map(([stack, tasks]) => (
                                    <div key={stack} className="bg-[#15121a] rounded-xl border border-[#261E2E] p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${stackColors[stack] || stackColors.other}`}>
                                                {stack}
                                            </span>
                                            <span className="text-xs text-zinc-500">{tasks.length} tasks</span>
                                        </div>
                                        <div className="space-y-2">
                                            {tasks.map((task: any) => (
                                                <div key={task.id} className="flex items-center justify-between bg-[#0f0c13] rounded-lg p-2">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <div className="text-xs text-zinc-400 truncate">{task.title}</div>
                                                        <div className="text-[10px] text-zinc-600">{task.estimated_hours}h</div>
                                                    </div>
                                                    <AssigneeDropdown task={task} team={team} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {Object.keys(tasksByStack).length === 0 && (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Sparkles className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                                        <p>No tasks to assign yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
