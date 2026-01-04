'use client';
import { useState } from 'react';
import { auth } from '../../src/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-success-500/10 blur-[100px] rounded-full" />

            <div className="w-full max-w-md relative">
                <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-2xl p-10 relative z-10 transition-all">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-none shadow-lg shadow-brand-500/20 flex items-center justify-center mx-auto mb-6 active:scale-95 transition-transform cursor-default">
                            <div className="w-8 h-8 bg-white/20 rounded-none backdrop-blur-sm border border-white/30" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Sahakar PPO</h1>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Intelligent Procurement Infrastructure</p>
                    </div>

                    <div className="mb-8 p-6 bg-neutral-50/50 rounded-none border border-neutral-200/50">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Dev Identity Selector</label>
                        <select
                            className="w-full px-4 py-3 rounded-none border border-neutral-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-semibold text-neutral-700 appearance-none shadow-sm cursor-pointer"
                            onChange={(e) => {
                                const [selectedEmail, selectedPassword] = e.target.value.split('|');
                                if (selectedEmail && selectedPassword) {
                                    setEmail(selectedEmail);
                                    setPassword(selectedPassword);
                                }
                            }}
                            defaultValue=""
                        >
                            <option value="">Select a user role...</option>
                            <option value="drisya.purchase.sahakar@gmail.com|R8@dQ7!MZxP2#c">Drisya (Purchase Staff)</option>
                            <option value="jamsheera.purchase.sahakar@gmail.com|K!4sWQ9@b#2LrZ">Jamsheera (Purchase Staff)</option>
                            <option value="sujitha.purchase.sahakar@gmail.com|ZC#8@wM!5L2R9">Sujitha (Purchase Staff)</option>
                            <option value="abhi.billinghead.sahakar@gmail.com|@9KZr!5C7W2#b">Abhi (Billing Head)</option>
                            <option value="sujeev.billing.sahakar@gmail.com|B7!@MZC9#2rW5">Sujeev (Billing Staff)</option>
                            <option value="shafi.billing.sahakar@gmail.com|#C5Z!9W7@2MrB">Shafi (Billing Staff)</option>
                            <option value="shiji.billing.sahakar@gmail.com|9@#B7ZC!5WMr2">Shiji (Billing Staff)</option>
                            <option value="vivek.billing.sahakar@gmail.com|Z!C@9#7W2MBr5">Vivek (Billing Staff)</option>
                            <option value="jalvan.billing.sahakar@gmail.com|@WZ9#7!B2CMr5">Jalvan (Billing Staff)</option>
                            <option value="suhail.billing.sahakar@gmail.com|5Z@#C9!7WM2Br">Suhail (Billing Staff)</option>
                            <option value="fayis.billing.sahakar@gmail.com|7!Z@C#9WMB2r5">Fayis (Billing Staff)</option>
                            <option value="ashiqmohammedmannarppil@gmail.com|@9C7Z!W#2MB5r">Ashiq (Admin)</option>
                            <option value="sarath.purchase.sahakar@gmail.com|Z#@7C!9WMB2r5">Sarath (Admin)</option>
                            <option value="frpboy12@gmail.com|C9Z@#7!WMB2r5">Rahul (Super Admin)</option>
                            <option value="sahakarhoit@gmail.com|@ZC9#7!WMB2r5">Zabnix (Super Admin)</option>
                            <option value="zabnixprivatelimited@gmail.com|7Z@C9#!WMB2r5">Zabnix Co (Super Admin)</option>
                            <option value="vipeesh.purchase.sahakar@gmail.com|!ZC@9#7WMB2r5">Vipeesh (Procurement Head)</option>
                        </select>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Secure Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-5 py-4 rounded-none bg-neutral-50/50 border border-neutral-200 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium"
                                placeholder="name@sahakar.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Access Passphrase</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-4 rounded-none bg-neutral-50/50 border border-neutral-200 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-none bg-danger-50 text-danger-600 text-[11px] font-bold border border-danger-100 uppercase tracking-tight animate-in shake-in duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-brand-600 text-white rounded-none font-bold hover:bg-brand-700 shadow-xl shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all text-sm uppercase tracking-widest"
                        >
                            {loading ? 'Verifying Credentials...' : 'Access Command Center'}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-neutral-100/50">
                        <div className="flex justify-center items-center gap-6 text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] opacity-60">
                            <span>GCP Enterprise</span>
                            <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                            <span>Vercel Edge</span>
                            <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                            <span>AES-256</span>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-brand-500/5 rounded-full pointer-events-none -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-brand-500/5 rounded-full pointer-events-none -z-10" />
            </div>
        </div>
    );
}

