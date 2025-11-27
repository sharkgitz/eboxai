import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface FollowUp {
    id: number;
    email_id: string;
    commitment: string;
    committed_by: string;
    due_date: string | null;
    status: string;
    created_at: string;
}

const FollowUps = () => {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const fetchFollowUps = async () => {
        try {
            const res = await fetch('http://localhost:8000/followups/');
            const data = await res.json();
            setFollowUps(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await fetch(`http://localhost:8000/followups/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchFollowUps();
        } catch (err) {
            console.error(err);
        }
    };

    const myCommitments = followUps.filter(f => f.committed_by === 'me');
    const othersCommitments = followUps.filter(f => f.committed_by !== 'me');

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Follow-Up Reminders</h1>
                <p className="text-text-secondary">Track commitments from your emails</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Commitments */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-brand-500" />
                        My Commitments ({myCommitments.length})
                    </h2>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : myCommitments.length === 0 ? (
                        <p className="text-text-tertiary text-sm">No commitments found</p>
                    ) : (
                        <div className="space-y-3">
                            {myCommitments.map((item) => (
                                <div
                                    key={item.id}
                                    className={clsx(
                                        "p-4 rounded-lg border transition-all",
                                        item.status === 'completed'
                                            ? "bg-green-500/5 border-green-500/20"
                                            : "bg-surface border-border hover:border-brand-500/30"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleStatus(item.id, item.status)}
                                            className="mt-0.5"
                                        >
                                            {item.status === 'completed' ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <div className="w-[18px] h-[18px] rounded-full border-2 border-text-tertiary hover:border-brand-500 transition-colors" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <p className={clsx(
                                                "text-sm",
                                                item.status === 'completed' ? "text-text-tertiary line-through" : "text-text-primary"
                                            )}>
                                                {item.commitment}
                                            </p>
                                            {item.due_date && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-text-tertiary">
                                                    <Clock size={12} />
                                                    Due: {item.due_date}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Others' Commitments */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-blue-500" />
                        Waiting On Others ({othersCommitments.length})
                    </h2>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : othersCommitments.length === 0 ? (
                        <p className="text-text-tertiary text-sm">No pending items</p>
                    ) : (
                        <div className="space-y-3">
                            {othersCommitments.map((item) => (
                                <div
                                    key={item.id}
                                    className={clsx(
                                        "p-4 rounded-lg border transition-all",
                                        item.status === 'completed'
                                            ? "bg-green-500/5 border-green-500/20"
                                            : "bg-surface border-border"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleStatus(item.id, item.status)}
                                            className="mt-0.5"
                                        >
                                            {item.status === 'completed' ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <div className="w-[18px] h-[18px] rounded-full border-2 border-text-tertiary hover:border-blue-500 transition-colors" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <p className={clsx(
                                                "text-sm",
                                                item.status === 'completed' ? "text-text-tertiary line-through" : "text-text-primary"
                                            )}>
                                                {item.commitment}
                                            </p>
                                            <p className="text-xs text-text-tertiary mt-1">
                                                By: {item.committed_by}
                                            </p>
                                            {item.due_date && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-text-tertiary">
                                                    <Clock size={12} />
                                                    Due: {item.due_date}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowUps;
