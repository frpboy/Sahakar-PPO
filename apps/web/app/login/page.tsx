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
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold text-primary-900 tracking-tight">Sahakar PPO</h1>
                    <p className="text-sm text-neutral-500 mt-2">Secure Procurement Platform</p>
                </div>

                <div className="mb-8 p-4 bg-neutral-50 rounded-md border border-neutral-200">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Dev Helper: Quick Fill</label>
                    <select
                        className="w-full px-3 py-2 rounded border border-neutral-200 text-sm bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium text-primary-900"
                        onChange={(e) => {
                            const [selectedEmail, selectedPassword] = e.target.value.split('|');
                            if (selectedEmail && selectedPassword) {
                                setEmail(selectedEmail);
                                setPassword(selectedPassword);
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="">Select a user...</option>
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

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2.5 rounded-md border border-neutral-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="name@sahakar.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2.5 rounded-md border border-neutral-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-error-100 text-error-600 text-xs font-medium border border-error-100 italic">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-primary-700 text-white rounded-md font-medium hover:bg-primary-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm"
                    >
                        {loading ? 'Authenticating...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-neutral-100">
                    <div className="flex justify-center items-center gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                        <span>GCP Cloud Run</span>
                        <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                        <span>Vercel</span>
                        <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                        <span>Firebase Auth</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
