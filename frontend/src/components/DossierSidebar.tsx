import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { User, Building, TrendingUp, TrendingDown, Minus, X, Clock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface DossierProps {
    emailId: string | null;
    onClose: () => void;
}

interface DossierData {
    identity: {
        name: string;
        role: string;
        company: string;
        email: string;
    };
    sentiment: {
        current: string;
        trend: string;
    };
    history: Array<{
        date: string;
        subject: string;
        snippet: string;
        tone: string;
    }>;
}

const DossierSidebar: React.FC<DossierProps> = ({ emailId, onClose }) => {
    const [data, setData] = useState<DossierData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (emailId) {
            setLoading(true);
            api.get(`/dossier/${emailId}`)
                .then(res => setData(res.data))
                .catch(err => console.error("Failed to fetch dossier:", err))
                .finally(() => setLoading(false));
        }
    }, [emailId]);

    if (!emailId) return null;

    const getToneColor = (tone: string) => {
        switch (tone?.toLowerCase()) {
            case 'positive': return 'bg-emerald-100 text-emerald-700';
            case 'negative': return 'bg-red-100 text-red-700';
            case 'neutral': return 'bg-slate-100 text-slate-600';
            default: return 'bg-purple-100 text-purple-700';
        }
    };

    return (
        <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto"
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    Sender Dossier
                </h2>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Analyzing sender...</p>
                </div>
            ) : data ? (
                <div className="p-4 space-y-6">
                    {/* Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-slate-50 to-purple-50 p-5 rounded-2xl border border-purple-100"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-200">
                                {data.identity.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{data.identity.name || "Unknown"}</h3>
                                <p className="text-sm text-purple-600 font-medium">{data.identity.role || "Role Unknown"}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/80 px-3 py-2 rounded-lg">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{data.identity.company || "Company Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/80 px-3 py-2 rounded-lg">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{data.identity.email}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sentiment Meter */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Relationship Health</h4>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className={clsx(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                                data.sentiment.current === 'Positive' ? 'bg-emerald-100 text-emerald-600' :
                                    data.sentiment.current === 'Negative' ? 'bg-red-100 text-red-600' :
                                        'bg-slate-100 text-slate-600'
                            )}>
                                {data.sentiment.current === 'Positive' ? <TrendingUp className="w-7 h-7" /> :
                                    data.sentiment.current === 'Negative' ? <TrendingDown className="w-7 h-7" /> :
                                        <Minus className="w-7 h-7" />}
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-800">{data.sentiment.current || "Neutral"} Tone</p>
                                <p className="text-xs text-slate-500 mt-0.5">Based on conversation analysis</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* History Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock size={12} />
                            Conversation History
                        </h4>
                        <div className="space-y-3">
                            {data.history.length === 0 && (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No previous interactions found</p>
                                </div>
                            )}

                            {data.history.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className="relative pl-5 border-l-2 border-slate-200 hover:border-purple-300 transition-colors py-1"
                                >
                                    <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-white border-2 border-slate-300"></div>
                                    <p className="text-[10px] text-slate-400 mb-1 font-medium">
                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 line-clamp-1 mb-1">{item.subject}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">"{item.snippet}..."</p>
                                    <span className={clsx(
                                        "inline-block px-2 py-0.5 text-[10px] rounded-full font-medium",
                                        getToneColor(item.tone)
                                    )}>
                                        {item.tone}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white"
                    >
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">AI Insight</h4>
                        <p className="text-sm">
                            {data.sentiment.current === 'Positive'
                                ? "This sender has a positive relationship with you. Consider maintaining the friendly tone."
                                : data.sentiment.current === 'Negative'
                                    ? "Recent interactions show some tension. Be thoughtful in your response."
                                    : "This is a neutral business relationship. Keep communication professional."}
                        </p>
                    </motion.div>
                </div>
            ) : (
                <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                        <X size={24} className="text-red-400" />
                    </div>
                    <p className="text-red-500 font-medium">Failed to load dossier</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again later</p>
                </div>
            )}
        </motion.div>
    );
};

export default DossierSidebar;
