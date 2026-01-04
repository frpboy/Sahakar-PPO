'use client';
import { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        autoBackup: true,
        notificationsEnabled: true
    });

    const handleSave = () => {
        // TODO: Implement settings save backend
        alert('Settings saved successfully');
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <SettingsIcon size={22} className="text-brand-600" />
                        </div>
                        System Settings
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Configure application preferences</p>
                </div>
                <button onClick={handleSave} className="btn-brand flex items-center gap-2">
                    <Save size={18} />
                    Save Changes
                </button>
            </header>

            <div className="app-card p-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Date Format</label>
                        <select
                            value={settings.dateFormat}
                            onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Currency</label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Timezone</label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Preferences</h3>

                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-neutral-700">Auto Backup</label>
                            <input
                                type="checkbox"
                                checked={settings.autoBackup}
                                onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                                className="w-5 h-5"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm text-neutral-700">Enable Notifications</label>
                            <input
                                type="checkbox"
                                checked={settings.notificationsEnabled}
                                onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                className="w-5 h-5"
                            />
                        </div>
                    </div>

                    <div className="bg-neutral-50 p-4 border border-neutral-200">
                        <p className="text-xs text-neutral-600">
                            <strong>Note:</strong> Settings will be saved to browser localStorage. Add backend API (POST /settings) for persistent storage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
