import { useState, useEffect } from 'react';
import { inboxApi } from '../api';
import type { ActionItem } from '../api';
import { CheckCircle, Circle, Clock, ArrowRight, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface KanbanItem extends ActionItem {
    emailSubject: string;
    emailSender: string;
}

const Kanban = () => {
    const [items, setItems] = useState<KanbanItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await inboxApi.getAll();
            const allItems: KanbanItem[] = [];
            res.data.forEach(email => {
                if (email.action_items) {
                    email.action_items.forEach(item => {
                        allItems.push({
                            ...item,
                            emailSubject: email.subject,
                            emailSender: email.sender
                        });
                    });
                }
            });
            setItems(allItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));

        try {
            await inboxApi.updateActionItem(id, newStatus);
        } catch (err) {
            console.error(err);
            fetchItems(); // Revert
        }
    };

    const pendingItems = items.filter(i => i.status === 'pending');
    const completedItems = items.filter(i => i.status === 'completed');

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-text-tertiary">
                <Loader className="animate-spin mb-2 text-brand-500" size={24} />
                <span className="ml-2 text-sm font-medium">Loading tasks...</span>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-background text-text-primary">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Task Board</h1>
                <p className="text-text-secondary">Manage your action items extracted from emails.</p>
            </header>

            <div className="flex gap-6 h-[calc(100%-100px)] overflow-x-auto pb-4">
                {/* To Do Column */}
                <div className="flex-1 min-w-[300px] flex flex-col bg-surface/50 rounded-xl border border-border">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-surface rounded-t-xl">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Circle size={18} className="text-brand-500" />
                            To Do
                        </h2>
                        <span className="bg-surfaceHighlight px-2 py-0.5 rounded-full text-xs font-medium text-text-secondary">
                            {pendingItems.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {pendingItems.map(item => (
                            <motion.div
                                layoutId={`item-${item.id}`}
                                key={item.id}
                                className="bg-surface border border-border p-4 rounded-lg shadow-sm hover:border-brand-500/50 transition-colors group"
                            >
                                <div className="text-sm font-medium mb-2">{item.description}</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-text-tertiary">
                                        <div className="font-medium text-text-secondary mb-0.5">{item.emailSender}</div>
                                        <div className="truncate max-w-[150px]">{item.emailSubject}</div>
                                    </div>
                                    {item.deadline && (
                                        <div className="text-xs text-red-400 flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded">
                                            <Clock size={10} /> {item.deadline}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => updateStatus(item.id, item.status)}
                                    className="w-full mt-3 py-1.5 text-xs font-medium bg-surfaceHighlight hover:bg-brand-600 hover:text-white rounded transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                                >
                                    Mark Done <ArrowRight size={12} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Done Column */}
                <div className="flex-1 min-w-[300px] flex flex-col bg-surface/50 rounded-xl border border-border">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-surface rounded-t-xl">
                        <h2 className="font-semibold flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            Completed
                        </h2>
                        <span className="bg-surfaceHighlight px-2 py-0.5 rounded-full text-xs font-medium text-text-secondary">
                            {completedItems.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {completedItems.map(item => (
                            <motion.div
                                layoutId={`item-${item.id}`}
                                key={item.id}
                                className="bg-surface border border-border p-4 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <div className="text-sm font-medium mb-2 line-through text-text-secondary">{item.description}</div>
                                <div className="text-xs text-text-tertiary">
                                    From: {item.emailSender}
                                </div>
                                <button
                                    onClick={() => updateStatus(item.id, item.status)}
                                    className="text-xs text-brand-500 hover:underline mt-2"
                                >
                                    Move back to To Do
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Kanban;
