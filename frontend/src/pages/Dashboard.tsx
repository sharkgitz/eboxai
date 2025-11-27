import { useEffect, useState } from 'react';
import { inboxApi } from '../api';
import type { Email } from '../api';
import {
    BarChart3, Activity, CheckCircle, Mail,
    ShieldAlert, Zap, TrendingUp, Brain, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const Dashboard = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [activityLog, setActivityLog] = useState<string[]>([]);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await inboxApi.getAll();
                setEmails(res.data);
                generateActivityLog(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    // Simulate live activity feed
    useEffect(() => {
        if (loading) return;
        const interval = setInterval(() => {
            const actions = [
                "Analyzing sentiment for incoming email...",
                "Detecting dark patterns...",
                "Extracting action items...",
                "Updating urgency scores...",
                "Syncing with knowledge base..."
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setActivityLog(prev => [randomAction, ...prev].slice(0, 5));
        }, 3000);
        return () => clearInterval(interval);
    }, [loading]);

    const generateActivityLog = (data: Email[]) => {
        const logs = data.slice(0, 5).map(e => `Processed email from ${e.sender}: ${e.subject.substring(0, 30)}...`);
        setActivityLog(logs);
    };

    const stats = {
        total: emails.length,
        unread: emails.filter(e => !e.is_read).length,
        actionItems: emails.reduce((acc, e) => acc + (e.action_items?.length || 0), 0),
        darkPatterns: emails.filter(e => e.has_dark_patterns).length,
        urgent: emails.filter(e => (e.urgency_score || 0) >= 7).length
    };

    // Mock data for charts (since we don't have historical data in the mock DB)
    const sentimentData = [
        { name: 'Mon', positive: 4, negative: 2, neutral: 5 },
        { name: 'Tue', positive: 3, negative: 4, neutral: 6 },
        { name: 'Wed', positive: 6, negative: 1, neutral: 4 },
        { name: 'Thu', positive: 8, negative: 2, neutral: 5 },
        { name: 'Fri', positive: 5, negative: 3, neutral: 7 },
        { name: 'Sat', positive: 2, negative: 1, neutral: 3 },
        { name: 'Sun', positive: 3, negative: 0, neutral: 2 },
    ];

    const darkPatternData = [
        { subject: 'Fake Urgency', A: 120, fullMark: 150 },
        { subject: 'Scarcity', A: 98, fullMark: 150 },
        { subject: 'Social Proof', A: 86, fullMark: 150 },
        { subject: 'Obstruction', A: 99, fullMark: 150 },
        { subject: 'Sneaking', A: 85, fullMark: 150 },
        { subject: 'Forced Action', A: 65, fullMark: 150 },
    ];

    const cleanCategory = (cat: string) => {
        // Remove markdown bolding
        let clean = cat.replace(/\*\*/g, '').replace(/\*/g, '');
        // If it's very long (likely a reasoning sentence), try to extract the first few words or just truncate
        if (clean.length > 30) {
            return clean.substring(0, 30) + "...";
        }
        return clean;
    };

    const categoryData = Object.entries(
        emails.reduce((acc, e) => {
            const cat = cleanCategory(e.category);
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const COLORS = ['#5E6AD2', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6'];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-text-tertiary">
                <Activity className="animate-spin mb-2 text-brand-500" size={24} />
                <span className="ml-2 text-sm font-medium">Initializing Mission Control...</span>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto bg-background">
            <header className="mb-6 flex justify-between items-end animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Activity className="text-brand-500" />
                        Mission Control
                    </h1>
                    <p className="text-text-secondary text-sm">Real-time email intelligence and threat monitoring</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary bg-surface border border-border px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Online
                </div>
            </header>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up">
                <StatCard
                    title="Total Processed"
                    value={stats.total}
                    icon={Mail}
                    trend="+12%"
                    color="text-brand-500"
                    bg="bg-brand-500/10"
                />
                <StatCard
                    title="Threats Blocked"
                    value={stats.darkPatterns}
                    icon={ShieldAlert}
                    trend="+5%"
                    color="text-red-500"
                    bg="bg-red-500/10"
                />
                <StatCard
                    title="Action Items"
                    value={stats.actionItems}
                    icon={CheckCircle}
                    trend="-2%"
                    color="text-green-500"
                    bg="bg-green-500/10"
                />
                <StatCard
                    title="Urgent Emails"
                    value={stats.urgent}
                    icon={Zap}
                    trend="+8%"
                    color="text-yellow-500"
                    bg="bg-yellow-500/10"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Sentiment Trend */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-500" />
                        Emotional Pulse (Last 7 Days)
                    </h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sentimentData}>
                                <defs>
                                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E0E0E0' }}
                                />
                                <Area type="monotone" dataKey="positive" stroke="#22C55E" fillOpacity={1} fill="url(#colorPos)" />
                                <Area type="monotone" dataKey="negative" stroke="#EF4444" fillOpacity={1} fill="url(#colorNeg)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dark Pattern Radar */}
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        Threat Analysis
                    </h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={darkPatternData}>
                                <PolarGrid stroke="#333" opacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Threats" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Activity Feed */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
                    <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Brain size={16} className="text-brand-500" />
                        Live Neural Activity
                    </h2>
                    <div className="flex-1 space-y-3 overflow-hidden">
                        {activityLog.map((log, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm animate-fade-in">
                                <span className="text-xs font-mono text-text-tertiary">{new Date().toLocaleTimeString()}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                <span className="text-text-secondary">{log}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-500" />
                        Classification
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E0E0E0' }}
                                />
                                <Legend verticalAlign="bottom" height={72} iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, color, bg }: any) => (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-brand-500/30 transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-2 rounded-lg", bg, color)}>
                <Icon size={20} />
            </div>
            <span className={clsx("text-xs font-medium px-2 py-1 rounded-full bg-surfaceHighlight text-text-secondary")}>
                {trend}
            </span>
        </div>
        <div>
            <div className="text-2xl font-bold text-text-primary">{value}</div>
            <div className="text-xs text-text-secondary mt-1">{title}</div>
        </div>
    </div>
);

export default Dashboard;
