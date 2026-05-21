import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Calendar, CheckCircle, Edit3, ArrowRight, Zap, Layout, LogOut, User, Sparkles, Target, Clock } from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    description: string;
    goal: string;
    deadline: string | null;
    deliverables: string[];
    status: string;
}

interface ProjectProps {
    project: {
        id: string;
        title: string;
        planning_phase: string;
        current_phase: string;
        milestones: Milestone[];
    };
}

export default function Milestones({ project }: ProjectProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Milestone>>({});
    const [newDeliverable, setNewDeliverable] = useState('');

    const isGenerating = project.planning_phase === 'plan_generating';
    const isPlanReady = project.planning_phase === 'plan_ready' || project.planning_phase === 'milestones_ready';

    const { post, processing } = useForm({});

    // Poll if plan is still generating
    useEffect(() => {
        if (isGenerating) {
            const interval = setInterval(() => {
                router.reload({ only: ['project'] });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isGenerating]);

    const startEdit = (milestone: Milestone) => {
        setEditingId(milestone.id);
        setEditForm({ ...milestone });
    };

    const saveEdit = (milestoneId: string) => {
        router.put(route('milestones.update', milestoneId), {
            title: editForm.title,
            description: editForm.description,
            goal: editForm.goal,
            deadline: editForm.deadline,
            deliverables: editForm.deliverables,
        }, {
            onSuccess: () => setEditingId(null),
        });
    };

    const addDeliverable = () => {
        if (!newDeliverable.trim()) return;
        setEditForm({
            ...editForm,
            deliverables: [...(editForm.deliverables || []), newDeliverable.trim()],
        });
        setNewDeliverable('');
    };

    const removeDeliverable = (index: number) => {
        setEditForm({
            ...editForm,
            deliverables: (editForm.deliverables || []).filter((_, i) => i !== index),
        });
    };

    const handleApprove = () => {
        router.post(route('projects.wizard.approve-milestones', project.id), {
            milestones: project.milestones.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description,
                goal: m.goal,
                deadline: m.deadline,
                deliverables: m.deliverables,
            })),
        });
    };

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
                        <h2 className="text-2xl font-bold mb-2">Building Your Blueprint</h2>
                        <p className="text-zinc-400">Generating architecture, estimates, and milestones...</p>
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
            <Head title="Review Milestones" />
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
                                <Target className="w-6 h-6 text-[#F93A8B]" />
                                <h1 className="text-3xl font-extrabold tracking-tight">Review Milestones</h1>
                            </div>
                            <p className="text-zinc-400">Edit titles, deadlines, and deliverables. Approve when ready to break down tasks.</p>
                        </div>
                        <button
                            onClick={handleApprove}
                            disabled={processing || !isPlanReady}
                            className="bg-gradient-to-r from-[#F93A8B] to-[#c033d6] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {processing ? 'Generating Tasks...' : 'Approve & Generate Tasks'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </header>

                    <div className="space-y-6">
                        {project.milestones.map((milestone, index) => (
                            <div key={milestone.id} className="bg-[#15121a] rounded-2xl border border-[#261E2E] p-6 hover:border-[#F93A8B]/30 transition-colors">
                                {editingId === milestone.id ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[#F93A8B] font-bold text-sm">Phase {index + 1}</span>
                                            <input
                                                type="text"
                                                value={editForm.title || ''}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                className="flex-1 bg-[#0f0c13] border-[#261E2E] rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-[#F93A8B]/40 outline-none"
                                            />
                                        </div>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            placeholder="Description"
                                            rows={2}
                                            className="w-full bg-[#0f0c13] border-[#261E2E] rounded-lg px-3 py-2 text-sm text-zinc-400 focus:ring-2 focus:ring-[#F93A8B]/40 outline-none resize-none"
                                        />
                                        <textarea
                                            value={editForm.goal || ''}
                                            onChange={e => setEditForm({ ...editForm, goal: e.target.value })}
                                            placeholder="Goal"
                                            rows={2}
                                            className="w-full bg-[#0f0c13] border-[#261E2E] rounded-lg px-3 py-2 text-sm text-zinc-400 focus:ring-2 focus:ring-[#F93A8B]/40 outline-none resize-none"
                                        />
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-zinc-500" />
                                                <input
                                                    type="date"
                                                    value={editForm.deadline || ''}
                                                    onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                                                    className="bg-[#0f0c13] border-[#261E2E] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#F93A8B]/40 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Deliverables</span>
                                            <div className="flex flex-wrap gap-2">
                                                {(editForm.deliverables || []).map((d, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#F93A8B]/10 text-[#F93A8B] rounded-lg text-xs border border-[#F93A8B]/20">
                                                        {d}
                                                        <button onClick={() => removeDeliverable(i)} className="hover:text-white">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newDeliverable}
                                                    onChange={e => setNewDeliverable(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addDeliverable()}
                                                    placeholder="Add deliverable..."
                                                    className="flex-1 bg-[#0f0c13] border-[#261E2E] rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#F93A8B]/40 outline-none"
                                                />
                                                <button onClick={addDeliverable} className="px-3 py-2 bg-[#261E2E] rounded-lg text-sm hover:bg-[#F93A8B]/20 transition-colors">Add</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-zinc-500 hover:text-white">Cancel</button>
                                            <button onClick={() => saveEdit(milestone.id)} className="px-4 py-2 bg-[#F93A8B] rounded-lg text-sm font-bold hover:bg-[#e73681] transition-colors">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[#F93A8B] font-bold text-sm">Phase {index + 1}</span>
                                                {milestone.deadline && (
                                                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(milestone.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                                            <p className="text-sm text-zinc-400 mb-3">{milestone.description}</p>
                                            {milestone.goal && (
                                                <p className="text-sm text-zinc-500 mb-3 italic">Goal: {milestone.goal}</p>
                                            )}
                                            {milestone.deliverables && milestone.deliverables.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {milestone.deliverables.map((d, i) => (
                                                        <span key={i} className="px-2 py-1 bg-[#0f0c13] rounded-lg text-xs text-zinc-400 border border-[#261E2E]">
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => startEdit(milestone)}
                                            className="p-2 text-zinc-500 hover:text-[#F93A8B] hover:bg-[#F93A8B]/10 rounded-lg transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {project.milestones.length === 0 && (
                            <div className="text-center py-20 text-zinc-500">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                                <p>No milestones generated yet. The AI is still working on your plan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
