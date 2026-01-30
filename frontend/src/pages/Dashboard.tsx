import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inboxApi, agentApi } from '../api';
import type { Email } from '../api';
import {
    Mail, CheckCircle, AlertTriangle, Zap,
    TrendingUp, BarChart3, Clock, Sparkles, Target,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, Tooltip, ResponsiveContainer, Cell
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
    };

    // Weekly email activity (Mock or Real)
    const getWeeklyData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const counts = new Array(7).fill(0);
        emails.forEach(e => {
            if (e.timestamp) counts[new Date(e.timestamp).getDay()]++;
        });
        return days.map((day, index) => ({
            day,
            emails: counts[index],
            active: index === today
        }));
    };
    const weeklyData = getWeeklyData();

    // Action items
    const actionItems = emails
        .flatMap(e => (e.action_items || []).map(a => ({ ...a, email: e })))
        .slice(0, 5);

    const authScore = Math.min(100, stats.total > 0
        ? Math.round(((stats.total - stats.unread) / stats.total) * 60 + (stats.actionItems > 0 ? 20 : 0) + 20)
        : 0);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-slate-500">Loading Command Center...</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            {/* Header with Greeting */}
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{greeting}!</h1>
                    <p className="text-slate-500 font-medium">Your command center is ready.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">System Status</p>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-bold">Online & Active</span>
                    </div>
                </div>
            </header>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-8">

                {/* 1. HERO / COMMAND CENTER (Top Left - Spans 2x2) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-1 md:col-span-2 row-span-2 card p-8 flex flex-col justify-between relative overflow-hidden group"
                >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 p-32 bg-emerald-400/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-400/20 transition-colors duration-500" />

                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Sparkles size={18} className="text-emerald-500" />
                            <span className="text-sm font-semibold uppercase tracking-wider">AI Control</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Inbox Intelligence</h2>
                        <p className="text-slate-500 max-w-sm">
                            {stats.unread} unread emails. {stats.urgent} urgent items requiring attention.
                            <br />System is operating at peak efficiency.
                        </p>
                    </div>

                    <div className="mt-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={runAgent}
                            disabled={processing}
                            className={clsx(
                                "w-full md:w-auto px-8 py-4 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all",
                                processing
                                    ? "bg-slate-400 cursor-wait"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-200/50"
                            )}
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing Inbox...
                                </>
                            ) : (
                                <>
                                    <Zap size={20} fill="currentColor" />
                                    Run Smart Agent
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                {/* 2. STAT CARDS */}
                <div className="card p-5 flex flex-col justify-center gap-1 hover:border-emerald-200 cursor-pointer" onClick={() => navigate('/inbox')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-medium text-sm">Total Emails</span>
                        <Mail size={18} className="text-slate-400" />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                        {stats.unread} unread
                    </span>
                </div>

                <div className="card p-5 flex flex-col justify-center gap-1 hover:border-red-200 cursor-pointer" onClick={() => navigate('/inbox?filter=urgent')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-medium text-sm">Urgent</span>
                        <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">{stats.urgent}</span>
                    <span className="text-xs text-red-600 font-medium bg-red-50 w-fit px-2 py-0.5 rounded-full">
                        Needs Action
                    </span>
                </div>

                {/* 3. PRODUCTIVITY */}
                <div className="card p-5 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-medium text-sm">Productivity</span>
                        <TrendingUp size={18} className="text-blue-500" />
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-4xl font-bold text-slate-800">{authScore}%</span>
                        <span className="text-xs text-slate-400 mb-1.5">Efficiency Score</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${authScore}%` }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                        />
                    </div>
                </div>

                <div className="card p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-medium text-sm">Action Items</span>
                        <Target size={18} className="text-purple-500" />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">{stats.actionItems}</span>
                    <span className="text-xs text-slate-500">
                        Pending tasks in inbox
                    </span>
                </div>

                {/* 4. ACTIVITY CHART */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-1 md:col-span-2 card p-6 min-h-[240px]"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-emerald-500" />
                            Weekly Flow
                        </h3>
                    </div>
                    <div className="h-[160px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="emails" radius={[6, 6, 6, 6]}>
                                    {weeklyData.map((entry, index) => (
                                        <Cell key={index} fill={entry.active ? '#10B981' : '#E2E8F0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 5. TASKS LIST */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="col-span-1 md:col-span-2 card p-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle size={18} className="text-indigo-500" />
                            Priority Tasks
                        </h3>
                        <button onClick={() => navigate('/kanban')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {actionItems.length > 0 ? actionItems.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${i === 0 ? 'bg-red-500' : 'bg-slate-300'}`} />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.description}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        <Clock size={10} /> {item.deadline || 'No deadline'}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 py-8 text-sm">No pending tasks</div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default Dashboard;
