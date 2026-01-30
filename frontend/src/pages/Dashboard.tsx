import { useEffect, useState } from 'react';
import { inboxApi } from '../api';
import type { Email } from '../api';
import {
    Mail, CheckCircle, AlertTriangle, Zap, ArrowUpRight,
    Calendar, Users, TrendingUp, BarChart3, Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

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
        urgent: emails.filter(e => (e.urgency_score || 0) >= 7).length
    };

    // Weekly email activity data
    const weeklyData = [
        { day: 'S', emails: 3, active: false },
        { day: 'M', emails: 8, active: false },
        { day: 'T', emails: 12, active: true },
        { day: 'W', emails: 6, active: false },
        { day: 'T', emails: 9, active: false },
        { day: 'F', emails: 4, active: false },
        { day: 'S', emails: 2, active: false },
    ];

    // Sample action items from emails
    const actionItems = emails
        .flatMap(e => (e.action_items || []).map(a => ({ ...a, email: e })))
        .slice(0, 5);

    // Recent senders
    const recentSenders = [...new Set(emails.map(e => e.sender))].slice(0, 4);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-background">
            {/* Header */}
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Plan, prioritize, and accomplish your tasks with ease.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2">
                        <Zap size={16} />
                        Run Agent
                    </button>
                    <button className="px-4 py-2 bg-white text-text-primary text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        Refresh
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Emails"
                    value={stats.total}
                    icon={Mail}
                    trend="+12%"
                    subtitle="Increased from last month"
                    highlight={true}
                />
                <StatCard
                    title="Processed"
                    value={stats.total - stats.unread}
                    icon={CheckCircle}
                    trend="+8%"
                    subtitle="Increased from last month"
                />
                <StatCard
                    title="Action Items"
                    value={stats.actionItems}
                    icon={Clock}
                    trend="+5%"
                    subtitle="Increased from last month"
                />
                <StatCard
                    title="Urgent"
                    value={stats.urgent}
                    icon={AlertTriangle}
                    trend=""
                    subtitle="Needs attention"
                    urgent={true}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Email Analytics - 2 cols */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <BarChart3 size={18} className="text-brand-600" />
                                Email Analytics
                            </h2>
                            <p className="text-sm text-text-tertiary mt-1">
                                Track email activity over time
                            </p>
                        </div>
                        <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-text-secondary">
                            <option>Week</option>
                            <option>Month</option>
                        </select>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} barCategoryGap="30%">
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}
                                />
                                <Bar dataKey="emails" radius={[6, 6, 6, 6]}>
                                    {weeklyData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.active ? '#166534' : '#DCFCE7'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Day selector */}
                    <div className="flex justify-center gap-2">
                        {weeklyData.map((d, i) => (
                            <button
                                key={i}
                                className={clsx(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                    d.active
                                        ? "bg-brand-800 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                            >
                                {d.day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Items List */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Action Items</h2>
                        <button className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                            + New
                        </button>
                    </div>
                    <div className="space-y-3">
                        {actionItems.length > 0 ? actionItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                                    i % 3 === 0 ? "bg-brand-500" : i % 3 === 1 ? "bg-accent-orange" : "bg-accent-blue"
                                )}>
                                    {item.description?.charAt(0) || 'T'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {item.description || 'Task'}
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        Due: {item.deadline || 'No deadline'}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-text-tertiary text-center py-4">
                                No action items yet. Run the agent!
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Senders */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Users size={18} className="text-brand-600" />
                            Recent Senders
                        </h2>
                        <button className="text-sm text-text-tertiary hover:text-brand-600">See all</button>
                    </div>
                    <div className="space-y-3">
                        {recentSenders.map((sender, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-semibold text-sm">
                                    {sender.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{sender}</p>
                                    <p className="text-xs text-text-tertiary">
                                        {emails.filter(e => e.sender === sender).length} emails
                                    </p>
                                </div>
                                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-tertiary hover:bg-gray-50">
                                    +
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inbox Health */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-brand-600" />
                        Inbox Health
                    </h2>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="64" cy="64" r="56"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="64" cy="64" r="56"
                                    fill="none"
                                    stroke="#22C55E"
                                    strokeWidth="12"
                                    strokeDasharray={`${((stats.total - stats.unread) / Math.max(stats.total, 1)) * 352} 352`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-text-primary">
                                    {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                                </span>
                                <span className="text-xs text-text-tertiary">Processed</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-brand-500" />
                            <span className="text-text-secondary">Completed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            <span className="text-text-secondary">Pending</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap size={18} />
                        Productivity Score
                    </h2>
                    <div className="text-5xl font-bold mb-2">
                        {Math.min(100, stats.total * 5 + stats.actionItems * 2)}
                    </div>
                    <p className="text-brand-100 text-sm mb-4">
                        Based on emails processed and actions completed
                    </p>
                    <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, subtitle, highlight, urgent }: any) => (
    <div className={clsx(
        "rounded-2xl p-5 border transition-all duration-300",
        highlight
            ? "bg-brand-600 text-white border-brand-600"
            : urgent
                ? "bg-white border-red-200"
                : "bg-white border-gray-200 hover:border-brand-200"
    )}>
        <div className="flex justify-between items-start mb-4">
            <span className={clsx(
                "text-sm font-medium",
                highlight ? "text-brand-100" : "text-text-secondary"
            )}>
                {title}
            </span>
            <ArrowUpRight size={16} className={highlight ? "text-white/70" : "text-text-tertiary"} />
        </div>
        <div className={clsx(
            "text-3xl font-bold mb-1",
            highlight ? "text-white" : urgent ? "text-red-600" : "text-text-primary"
        )}>
            {value}
        </div>
        {trend && (
            <div className={clsx(
                "text-xs flex items-center gap-1",
                highlight ? "text-brand-100" : "text-green-600"
            )}>
                <TrendingUp size={12} />
                {trend} {subtitle}
            </div>
        )}
        {!trend && subtitle && (
            <div className={clsx(
                "text-xs",
                urgent ? "text-red-500" : "text-text-tertiary"
            )}>
                {subtitle}
            </div>
        )}
    </div>
);

export default Dashboard;
