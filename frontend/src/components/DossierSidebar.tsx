import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { User, Building, History, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Dossier
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Scanning history...</div>
            ) : data ? (
                <div className="p-4 space-y-6">
                    {/* Identity Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900">{data.identity.name || "Unknown"}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-2">{data.identity.role || "Role Unknown"}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Building className="w-3 h-3" />
                            <span>{data.identity.company || "Company Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ExternalLink className="w-3 h-3" />
                            <span>{data.identity.email}</span>
                        </div>
                    </div>

                    {/* Sentiment Meter */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Relationship Health</h4>
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.sentiment.current === 'Positive' ? 'bg-green-100 text-green-600' :
                                    data.sentiment.current === 'Negative' ? 'bg-red-100 text-red-600' :
                                        'bg-gray-100 text-gray-600'
                                }`}>
                                {data.sentiment.current === 'Positive' ? <TrendingUp className="w-6 h-6" /> :
                                    data.sentiment.current === 'Negative' ? <TrendingDown className="w-6 h-6" /> :
                                        <Minus className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{data.sentiment.current || "Neutral"} Tone</p>
                                <p className="text-xs text-gray-500">Based on this email</p>
                            </div>
                        </div>
                    </div>

                    {/* History Timeline */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Context Memory</h4>
                        <div className="space-y-4">
                            {data.history.length === 0 && <p className="text-sm text-gray-400 italic">No previous interactions found.</p>}

                            {data.history.map((item, idx) => (
                                <div key={idx} className="relative pl-4 border-l-2 border-gray-100 hover:border-gray-300 transition-colors">
                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300"></div>
                                    <p className="text-xs text-gray-400 mb-0.5">{new Date(item.date).toLocaleDateString()}</p>
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.subject}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">"{item.snippet}..."</p>
                                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                                        {item.tone}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-red-500">Failed to load dossier.</div>
            )}
        </div>
    );
};

export default DossierSidebar;
