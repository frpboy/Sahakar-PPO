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
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sahakar PPO</h1>
                    <p className="text-gray-500">Infrastructure v1.0 (Production Core)</p>
                </div>

                {/* Quick Fill Credentials */}
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <label className="block text-sm font-semibold text-blue-900 mb-2">Quick Fill Credentials</label>
                    <select
                        className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm bg-white"
                        onChange={(e) => {
                            const [selectedEmail, selectedPassword] = e.target.value.split('|');
                            if (selectedEmail && selectedPassword) {
                                setEmail(selectedEmail);
                                setPassword(selectedPassword);
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="">Select a user to prefill...</option>
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
                    <p className="text-xs text-blue-600 mt-2">Selecting a user will auto-fill email & password.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="name@sahakar.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#1E293B] text-white rounded-xl font-semibold hover:bg-[#0F172A] transform active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-50 text-center text-xs text-gray-400">
                    GCP Cloud Run • Vercel • Firebase Auth
                </div>
            </div>
        </div>
    );
}
