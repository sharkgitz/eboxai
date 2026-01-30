import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inboxApi, agentApi } from '../api';
import type { Email } from '../api';
import {
    Mail, CheckCircle, AlertTriangle, Zap, ArrowRight,
    TrendingUp, BarChart3, Clock, Sparkles, Target,
    MessageSquare, Send, RefreshCw, Flame, Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        fetchEmails();
    }, []);

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

    const runAgent = async () => {
        setProcessing(true);
        try {
            await agentApi.processAll();
            await fetchEmails();
        } finally {
            setProcessing(false);
        }
    };

    const stats = {
        total: emails.length,
        unread: emails.filter(e => !e.is_read).length,
        actionItems: emails.reduce((acc, e) => acc + (e.action_items?.length || 0), 0),
        urgent: emails.filter(e => (e.urgency_score || 0) >= 7).length,
        important: emails.filter(e => e.category?.toLowerCase() === 'important').length,
        suspicious: emails.filter(e => e.has_dark_patterns).length
    };

    // Get urgent emails for highlight
    const urgentEmails = emails
        .filter(e => (e.urgency_score || 0) >= 7)
        .slice(0, 3);

    // Weekly email activity - Real aggregation
    const getWeeklyData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const counts = new Array(7).fill(0);

        emails.forEach(e => {
            if (e.timestamp) {
                const date = new Date(e.timestamp);
                // Check if email is from the last 7 days to be accurate, 
                // or just map all emails to days for demo purposes (usually better for sparse data)
                counts[date.getDay()]++;
            }
        });

        return days.map((day, index) => ({
            day,
            emails: counts[index],
            active: index === today
        }));
    };

    const weeklyData = getWeeklyData();

    // Action items from emails
    const actionItems = emails
        .flatMap(e => (e.action_items || []).map(a => ({ ...a, email: e })))
        .slice(0, 5);

    // Smart insights based on data
    const insights = [
        stats.urgent > 0 && { icon: Flame, text: `${stats.urgent} urgent email${stats.urgent > 1 ? 's' : ''} need${stats.urgent === 1 ? 's' : ''} your attention`, type: 'urgent' },
        stats.suspicious > 0 && { icon: Shield, text: `${stats.suspicious} suspicious email${stats.suspicious > 1 ? 's' : ''} detected`, type: 'warning' },
        stats.actionItems > 3 && { icon: Target, text: `You have ${stats.actionItems} pending tasks`, type: 'info' },
        stats.unread === 0 && stats.total > 0 && { icon: CheckCircle, text: 'Inbox zero achieved! Great job!', type: 'success' },
    ].filter(Boolean);

    const productivityScore = Math.min(100, stats.total > 0
        ? Math.round(((stats.total - stats.unread) / stats.total) * 60 + (stats.actionItems > 0 ? 20 : 0) + 20)
        : 0);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-slate-500">Loading your dashboard...</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{greeting}! 👋</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Here's what's happening with your inbox today
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={runAgent}
                        disabled={processing}
                        className={clsx(
                            "px-5 py-2.5 text-white text-sm font-medium rounded-xl flex items-center gap-2 shadow-lg transition-all",
                            processing
                                ? "bg-slate-400 cursor-wait"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200/50"
                        )}
                    >
                        {processing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Run AI Agent
                            </>
                        )}
                    </motion.button>
                    <button
                        onClick={fetchEmails}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </motion.header>

            {/* Smart Insights Banner */}
            <AnimatePresence>
                {insights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                    >
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {insights.map((insight: any, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shadow-sm",
                                        insight.type === 'urgent' && "bg-red-50 text-red-700 border border-red-200",
                                        insight.type === 'warning' && "bg-amber-50 text-amber-700 border border-amber-200",
                                        insight.type === 'success' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                                        insight.type === 'info' && "bg-blue-50 text-blue-700 border border-blue-200"
                                    )}
                                >
                                    <insight.icon size={16} />
                                    {insight.text}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
                <StatCard
                    title="Total Emails"
                    value={stats.total}
                    icon={Mail}
                    trend={`${stats.unread} unread`}
                    highlight={true}
                    onClick={() => navigate('/inbox')}
                />
                <StatCard
                    title="Processed"
                    value={stats.total - stats.unread}
                    icon={CheckCircle}
                    trend={stats.total > 0 ? `${Math.round(((stats.total - stats.unread) / stats.total) * 100)}% complete` : '0%'}
                />
                <StatCard
                    title="Action Items"
                    value={stats.actionItems}
                    icon={Target}
                    trend="Tasks pending"
                />
                <StatCard
                    title="Urgent"
                    value={stats.urgent}
                    icon={AlertTriangle}
                    trend={stats.urgent > 0 ? "Needs attention" : "All clear"}
                    urgent={stats.urgent > 0}
                />
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Email Analytics - 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <BarChart3 size={18} className="text-emerald-600" />
                                Email Activity
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Your weekly email flow
                            </p>
                        </div>
                        <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>

                    <div className="h-[180px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} barCategoryGap="25%">
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                                    }}
                                    formatter={(value: number) => [`${value} emails`, 'Count']}
                                />
                                <Bar dataKey="emails" radius={[8, 8, 8, 8]}>
                                    {weeklyData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.active ? '#059669' : '#D1FAE5'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-center gap-2">
                        {weeklyData.map((d, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                    d.active
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                        : "bg-slate-100 text-slate-500"
                                )}
                            >
                                {d.day.charAt(0)}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Action Items List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Target size={18} className="text-emerald-600" />
                            Tasks
                        </h2>
                        <button
                            onClick={() => navigate('/inbox')}
                            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 transition-colors"
                        >
                            View all <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {actionItems.length > 0 ? actionItems.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0",
                                    i % 4 === 0 ? "bg-emerald-500" :
                                        i % 4 === 1 ? "bg-orange-500" :
                                            i % 4 === 2 ? "bg-blue-500" : "bg-purple-500"
                                )}>
                                    {item.description?.charAt(0).toUpperCase() || 'T'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                                        {item.description || 'Task'}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock size={10} />
                                        {item.deadline || 'No deadline'}
                                    </p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500">No pending tasks</p>
                                <p className="text-xs text-slate-400 mt-1">Run the agent to extract tasks</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Urgent Emails */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Flame size={18} className="text-red-500" />
                            Urgent Emails
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {urgentEmails.length > 0 ? urgentEmails.map((email, i) => (
                            <motion.div
                                key={email.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 * i }}
                                onClick={() => navigate('/inbox')}
                                className="p-3 rounded-xl bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                            >
                                <p className="text-sm font-medium text-slate-800 truncate">{email.subject}</p>
                                <p className="text-xs text-red-600 mt-1">From: {email.sender}</p>
                            </motion.div>
                        )) : (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="text-emerald-500" />
                                </div>
                                <p className="text-sm text-slate-600 font-medium">No urgent emails!</p>
                                <p className="text-xs text-slate-400 mt-1">You're all caught up</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Inbox Health */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-600" />
                        Inbox Health
                    </h2>
                    <div className="flex items-center justify-center py-2">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="64" cy="64" r="56"
                                    fill="none"
                                    stroke="#E2E8F0"
                                    strokeWidth="10"
                                />
                                <motion.circle
                                    initial={{ strokeDasharray: '0 352' }}
                                    animate={{ strokeDasharray: `${((stats.total - stats.unread) / Math.max(stats.total, 1)) * 352} 352` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    cx="64" cy="64" r="56"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800">
                                    {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                                </span>
                                <span className="text-xs text-slate-500">Processed</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600">Read ({stats.total - stats.unread})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            <span className="text-slate-600">Unread ({stats.unread})</span>
                        </div>
                    </div>
                </motion.div>

                {/* Productivity Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200/50"
                >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap size={18} />
                        Productivity Score
                    </h2>
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                        className="text-5xl font-bold mb-2"
                    >
                        {productivityScore}
                    </motion.div>
                    <p className="text-emerald-100 text-sm mb-4">
                        {productivityScore >= 80 ? "Excellent! Keep up the great work!" :
                            productivityScore >= 50 ? "Good progress! Room for improvement." :
                                "Let's get those emails processed!"}
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${productivityScore}% ` }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="bg-white rounded-full h-2"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/agent')}
                            className="flex-1 py-2.5 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={14} />
                            Ask AI
                        </button>
                        <button
                            onClick={() => navigate('/inbox')}
                            className="flex-1 py-2.5 bg-white rounded-xl text-sm font-medium text-emerald-700 hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={14} />
                            View Inbox
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number;
    icon: any;
    trend: string;
    highlight?: boolean;
    urgent?: boolean;
    onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, trend, highlight, urgent, onClick }: StatCardProps) => (
    <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
        onClick={onClick}
        className={clsx(
            "rounded-2xl p-5 border transition-all duration-300 cursor-pointer",
            highlight
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-200/50"
                : urgent
                    ? "bg-white border-red-200 hover:border-red-300"
                    : "bg-white border-slate-200/60 hover:border-emerald-200"
        )}
    >
        <div className="flex justify-between items-start mb-4">
            <span className={clsx(
                "text-sm font-medium",
                highlight ? "text-emerald-100" : "text-slate-500"
            )}>
                {title}
            </span>
            <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                highlight ? "bg-white/20" : urgent ? "bg-red-50" : "bg-slate-50"
            )}>
                <Icon size={16} className={highlight ? "text-white" : urgent ? "text-red-500" : "text-slate-400"} />
            </div>
        </div>
        <div className={clsx(
            "text-3xl font-bold mb-1",
            highlight ? "text-white" : urgent ? "text-red-600" : "text-slate-800"
        )}>
            {value}
        </div>
        <div className={clsx(
            "text-xs flex items-center gap-1",
            highlight ? "text-emerald-100" : urgent ? "text-red-500" : "text-slate-500"
        )}>
            {!urgent && <TrendingUp size={12} />}
            {trend}
        </div>
    </motion.div>
);

export default Dashboard;
