import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Auth() {
    const { login, signup, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [method, setMethod] = useState('email'); // 'email' or 'phone'
    const [formData, setFormData] = useState({ value: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            await login(method, formData.value, formData.password);
        } else {
            await signup(method, formData.value, formData.password);
        }
    };

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        {isLogin ? 'Welcome Back' : 'Get Started'}
                    </h1>
                    <p className="text-slate-400">
                        {isLogin ? 'Sign in to continue chatting' : 'Create a new account for free'}
                    </p>
                </div>

                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-6">
                    <button
                        onClick={() => setMethod('email')}
                        type="button"
                        className={clsx(
                            "flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200",
                            method === 'email' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        )}
                    >
                        <Mail size={18} /> Email
                    </button>
                    <button
                        onClick={() => setMethod('phone')}
                        type="button"
                        className={clsx(
                            "flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200",
                            method === 'phone' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        )}
                    >
                        <Phone size={18} /> Phone
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{method}</label>
                        <input
                            name="value"
                            type={method === 'email' ? 'email' : 'tel'}
                            placeholder={method === 'email' ? 'name@example.com' : '+1 (555) 000-0000'}
                            value={formData.value}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 text-white"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 text-white"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="text-center mt-8">
                    <span className="text-slate-500 text-sm">
                        {isLogin ? "New here? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={() => { setIsLogin(!isLogin); setFormData({ value: '', password: '' }); }}
                        className="text-cyan-400 font-medium hover:text-cyan-300 hover:underline transition-colors"
                    >
                        {isLogin ? 'Create an account' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
