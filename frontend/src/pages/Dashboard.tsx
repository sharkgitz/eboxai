import { useEffect, useState } from 'react';
import { inboxApi } from '../api';
import type { Email } from '../api';
import { BarChart, Activity, CheckCircle, Mail, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const Dashboard = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await inboxApi.getAll();
                setEmails(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    const stats = {
        total: emails.length,
        unread: emails.filter(e => !e.is_read).length,
        actionItems: emails.reduce((acc, e) => acc + (e.action_items?.length || 0), 0),
        categories: emails.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-text-tertiary">
                <Activity className="animate-spin mb-2 text-brand-500" size={24} />
                <span className="ml-2 text-sm font-medium">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto">
            <header className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Overview</h1>
                <p className="text-text-secondary">Welcome back. Here's what's happening in your inbox.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 animate-slide-up">
                <BentoCard
                    className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-surface to-surfaceHighlight"
                    title="Total Emails"
                    value={stats.total}
                    icon={Mail}
                    trend="+12% from last week"
                />
                <BentoCard
                    title="Action Items"
                    value={stats.actionItems}
                    icon={CheckCircle}
                    highlight
                />
                <BentoCard
                    title="Unread"
                    value={stats.unread}
                    icon={Clock}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 hover:border-brand-500/30 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <BarChart size={18} className="text-text-secondary" />
                            Category Distribution
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(stats.categories).map(([cat, count]) => (
                            <div key={cat} className="group">
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-text-secondary capitalize group-hover:text-text-primary transition-colors">{cat}</span>
                                    <span className="text-text-primary font-medium">{count}</span>
                                </div>
                                <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out group-hover:bg-brand-400"
                                        style={{ width: `${(count / stats.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6 hover:border-brand-500/30 transition-colors duration-300 flex flex-col">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-brand-500" />
                        AI Insights
                    </h2>
                    <div className="flex-1 space-y-3">
                        {emails.slice(0, 4).map(email => (
                            <div key={email.id} className="p-3 rounded-lg bg-surfaceHighlight/50 hover:bg-surfaceHighlight transition-colors cursor-pointer group border border-transparent hover:border-border">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-medium text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded capitalize">
                                        {email.category}
                                    </span>
                                    <ArrowUpRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-sm font-medium text-text-primary truncate">{email.subject}</div>
                                <div className="text-xs text-text-secondary truncate mt-0.5">{email.sender}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BentoCard = ({ title, value, icon: Icon, className, highlight, trend }: any) => (
    <div className={clsx(
        "p-6 rounded-xl border border-border flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-brand-500/20 group",
        highlight ? "bg-brand-500/10 border-brand-500/20" : "bg-surface",
        className
    )}>
        <div className="flex justify-between items-start">
            <div className={clsx(
                "p-2 rounded-lg transition-colors",
                highlight ? "bg-brand-500/20 text-brand-500" : "bg-surfaceHighlight text-text-secondary group-hover:text-text-primary"
            )}>
                <Icon size={20} />
            </div>
            {trend && <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <div className="mt-4">
            <div className="text-3xl font-bold text-text-primary tracking-tight">{value}</div>
            <div className="text-sm text-text-secondary font-medium mt-1">{title}</div>
        </div>
    </div>
);

export default Dashboard;
