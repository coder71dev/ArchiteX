import React from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm } from '@inertiajs/react';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-[#0f0c13] flex flex-col justify-center items-center p-6 selection:bg-[#F93A8B]/30">
            <Head title="Architect Login" />
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                h1, h2, h3, h4, h5, h6, .font-outfit { font-family: 'Outfit', sans-serif !important; }
                body { font-family: 'Space Grotesk', sans-serif; }
            ` }} />

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F93A8B]/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#c033d6]/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            <div className="w-full max-w-md relative animate-fade-in">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F93A8B] to-[#c033d6] flex items-center justify-center mb-6 shadow-2xl shadow-[#F93A8B]/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Zap className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                        Archite<span className="text-[#F93A8B]">X</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm border-b border-[#261E2E] pb-2">INTELLIGENT ARCHITECTURAL ENGINE</p>
                </div>

                {/* Login Card */}
                <div className="glass p-8 rounded-3xl border border-[#261E2E] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F93A8B]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Mail className="w-3 h-3 text-[#F93A8B]" />
                                Terminal Identity
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="architect@coder71.com"
                                    className="w-full bg-[#1a1523] border-[#261E2E] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                    required
                                />
                                {errors.email && <p className="text-rose-500 text-[10px] mt-1 ml-2 font-bold uppercase">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="w-3 h-3 text-[#F93A8B]" />
                                    Access Key
                                </label>
                                <a href="#" className="text-[10px] font-bold text-[#c033d6] hover:text-[#F93A8B] uppercase tracking-tighter">Lost Key?</a>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#1a1523] border-[#261E2E] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-[#F93A8B]/40 focus:border-[#F93A8B]/50 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-1">
                            <div className="relative flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    id="remember"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    className="peer sr-only" 
                                />
                                <div className="w-5 h-5 bg-[#1a1523] border border-[#261E2E] rounded-md peer-checked:bg-[#F93A8B] peer-checked:border-[#F93A8B] transition-all shadow-inner"></div>
                                <Zap className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform left-1" />
                                <label htmlFor="remember" className="ml-3 text-xs font-semibold text-zinc-400 cursor-pointer hover:text-zinc-200">Maintain Session</label>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={processing}
                            className="w-full btn-accent py-4 rounded-2xl justify-center text-md font-bold group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {processing ? 'Verifying Integrity...' : 'Establish Connection'}
                                {!processing && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F93A8B] to-[#c033d6] opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        </button>
                    </form>
                </div>

                {/* Footer Badges */}
                <div className="mt-12 flex justify-between items-center px-4 opacity-50">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">RSA 4096 Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#F93A8B]" />
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Neural Link v4.2</span>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black">
                        Authorized Personnel Only
                    </p>
                </div>
            </div>
        </div>
    );
}
