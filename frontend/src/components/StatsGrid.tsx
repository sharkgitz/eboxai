import React from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Clock, ShieldCheck, Activity,
    ArrowUpRight, AlertTriangle
} from 'lucide-react';

interface StatsGridProps {
    data: {
        roi: {
            hours_saved: number;
            money_saved: number;
            hourly_rate: number;
        };
        trust: {
            average_confidence: number;
            hallucination_rate: number;
            rag_usage: string;
        };
        trends: {
            sentiment_velocity: string;
            top_intent: string;
        };
    };
}

const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">


            {/* TRUST SCORE */}
            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group"
                title="Average confidence level of the AI's understanding and generated responses."
            >
                <div className="absolute top-0 right-0 p-16 bg-blue-50 rounded-bl-full -z-0 transition-all group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-slate-500">Trust Score</span>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                        {data.trust.average_confidence}%
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${data.trust.average_confidence}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* INTERVENTION RATE */}
            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group"
                title="Percentage of AI drafts that required manual editing before sending."
            >
                <div className="absolute top-0 right-0 p-16 bg-amber-50 rounded-bl-full -z-0 transition-all group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-slate-500">Intervention Rate</span>
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                        {data.trust.hallucination_rate}%
                    </div>
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 w-fit px-2 py-0.5 rounded-full">
                        Requires attention
                    </span>
                </div>
            </motion.div>

            {/* Trends Card */}
            <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-lg shadow-slate-200/50 relative overflow-hidden"
            >
                <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-slate-300">Top Intent</span>
                    <Activity size={18} className="text-emerald-400" />
                </div>
                <div className="text-xl font-bold mb-2 truncate">
                    {data.trends.top_intent}
                </div>
                <div className="flex items-center gap-2 mt-auto">
                    <div className="px-2 py-0.5 rounded bg-white/10 text-xs font-medium border border-white/10">
                        {data.trends.sentiment_velocity}
                    </div>
                    <ArrowUpRight size={14} className="text-emerald-400" />
                </div>
            </motion.div>
        </div>
    );
};

export default StatsGrid;
