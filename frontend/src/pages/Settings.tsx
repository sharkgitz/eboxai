import { Settings as SettingsIcon, Moon, Bell, Shield, User } from 'lucide-react';
import { inboxApi } from '../api';
import { clsx } from 'clsx';

const Settings = () => {
    return (
        <div className="p-8 h-full overflow-y-auto bg-background text-text-primary">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <SettingsIcon className="text-brand-500" />
                    Settings
                </h1>
                <p className="text-text-secondary">Manage your preferences and account settings.</p>
            </header>

            <div className="max-w-2xl space-y-6">
                <Section title="Appearance" icon={Moon}>
                    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                        <div>
                            <div className="font-medium">Dark Mode</div>
                            <div className="text-sm text-text-secondary">Use dark theme for the application</div>
                        </div>
                        <div className="w-12 h-6 bg-brand-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>
                </Section>

                <Section title="Notifications" icon={Bell}>
                    <div className="space-y-3">
                        <Toggle label="Email Notifications" description="Get notified when new emails arrive" checked />
                        <Toggle label="Agent Alerts" description="Get notified when AI completes a task" checked />
                    </div>
                </Section>

                <Section title="Privacy & Security" icon={Shield}>
                    <div className="space-y-3">
                        <Toggle label="Data Collection" description="Allow anonymous usage data collection" />
                    </div>
                </Section>

                <Section title="Account" icon={User}>
                    <div className="p-4 bg-surface rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xl">
                                V
                            </div>
                            <div>
                                <div className="font-medium">Vaish</div>
                                <div className="text-sm text-text-secondary">vaish@example.com</div>
                            </div>
                            <button className="ml-auto px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                Sign Out
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-surface rounded-lg border border-border flex justify-between items-center">
                        <div>
                            <div className="font-medium">Demo Data</div>
                            <div className="text-sm text-text-secondary">Reset inbox to initial state</div>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    await inboxApi.load();
                                    alert('Data reset successfully! Please refresh.');
                                } catch (e) {
                                    alert('Failed to reset data.');
                                }
                            }}
                            className="px-4 py-2 text-sm font-medium text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                        >
                            Reset Data
                        </button>
                    </div>
                </Section>
            </div>
        </div>
    );
};

const Section = ({ title, icon: Icon, children }: any) => (
    <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-text-primary">
            <Icon size={20} className="text-text-secondary" />
            {title}
        </h2>
        {children}
    </div>
);

const Toggle = ({ label, description, checked }: any) => (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
        <div>
            <div className="font-medium">{label}</div>
            <div className="text-sm text-text-secondary">{description}</div>
        </div>
        <div className={clsx("w-12 h-6 rounded-full relative cursor-pointer transition-colors", checked ? "bg-brand-600" : "bg-surfaceHighlight")}>
            <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all", checked ? "right-1" : "left-1")} />
        </div>
    </div>
);

export default Settings;
