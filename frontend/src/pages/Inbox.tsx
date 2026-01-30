import { useEffect, useState, useRef } from 'react';
import { inboxApi, agentApi, agenticApi } from '../api';
import type { Email, EmailDetail, ActionItem } from '../api';
import {
    RefreshCw, Search, Mail, CheckCircle, Clock, Inbox as InboxIcon,
    Star, MoreHorizontal, Trash2, CheckSquare, Square, User, Sparkles,
    ArrowUpDown, Flame, Zap, MessageSquare
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AIStatus from '../components/AIStatus';
import DossierSidebar from '../components/DossierSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Inbox = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [draftTone, setDraftTone] = useState('professional');
    const [draftLength, setDraftLength] = useState('concise');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
    const [showDossier, setShowDossier] = useState(false);
    const [quickActions, setQuickActions] = useState<any[]>([]);
    const [smartReplyLoading, setSmartReplyLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchEmails();
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sortBy]);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await inboxApi.getAll(sortBy);
            setEmails(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadInbox = async () => {
        await inboxApi.load();
        fetchEmails();
    };

    const processAll = async () => {
        setProcessing(true);
        await agentApi.processAll();
        setTimeout(() => {
            setProcessing(false);
            fetchEmails();
        }, 2000);
    };

    const selectEmail = async (id: string) => {
        try {
            const res = await inboxApi.getOne(id);
            setSelectedEmail(res.data);
            setShowMenu(false);
            fetchQuickActions(id);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteEmail = async (id: string) => {
        if (!confirm('Are you sure you want to delete this email?')) return;
        try {
            await inboxApi.delete(id);
            setEmails(emails.filter(e => e.id !== id));
            if (selectedEmail?.id === id) {
                setSelectedEmail(null);
            }
            setShowMenu(false);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleActionItem = async (item: ActionItem) => {
        if (!selectedEmail) return;
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';

        const updatedItems = selectedEmail.action_items.map(i =>
            i.id === item.id ? { ...i, status: newStatus } : i
        );
        setSelectedEmail({ ...selectedEmail, action_items: updatedItems });

        try {
            await inboxApi.updateActionItem(item.id, newStatus);
        } catch (err) {
            console.error(err);
            selectEmail(selectedEmail.id);
        }
    };

    const fetchQuickActions = async (emailId: string) => {
        try {
            const res = await agenticApi.getActions(emailId);
            setQuickActions(res.data.actions || []);
        } catch (err) {
            console.error("Failed to fetch quick actions:", err);
            setQuickActions([]);
        }
    };

    const executeQuickAction = async (action: any) => {
        if (!selectedEmail) return;

        // Optimistic UI updates
        if (action.type === 'flag_urgent') {
            setSelectedEmail({ ...selectedEmail, urgency_score: 10 });
        }

        try {
            const res = await agenticApi.executeAction(action.type, action.params);

            if (res.data.success) {
                // Refresh email to get latest state (new draft, etc)
                const updated = await inboxApi.getOne(selectedEmail.id);
                setSelectedEmail(updated.data);

                // Show success toast (conceptual)
                console.log(res.data.message);
            }
        } catch (err) {
            console.error("Action execution failed:", err);
        }
    };

    const useSmartReply = async (intent: string) => {
        if (!selectedEmail) return;
        setSmartReplyLoading(true);
        try {
            const res = await agenticApi.smartReply(selectedEmail.id, intent);
            if (res.data.reply) {
                // Create draft with this content
                await agentApi.draft(selectedEmail.id, res.data.reply);
                // Refresh to show draft
                const updated = await inboxApi.getOne(selectedEmail.id);
                setSelectedEmail(updated.data);
            }
        } catch (err) {
            console.error("Smart reply failed:", err);
        } finally {
            setSmartReplyLoading(false);
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat?.toLowerCase()) {
            case 'important': return 'text-red-600 bg-red-50 border-red-200';
            case 'newsletter': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'spam': return 'text-slate-500 bg-slate-100 border-slate-200';
            case 'to-do': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-purple-600 bg-purple-50 border-purple-200';
        }
    };

    const cleanText = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*/g, '').replace(/\*/g, '');
    };

    // Filter and sort emails
    const filteredEmails = emails
        .filter(e =>
            e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.body?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'priority') {
                return (b.urgency_score || 0) - (a.urgency_score || 0);
            }
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

    return (
        <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Email List */}
            <div className="w-[340px] lg:w-[400px] border-r border-slate-200/60 flex flex-col bg-white/80 backdrop-blur-sm">
                <div className="p-4 border-b border-slate-200/60 space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Mail size={14} className="text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Inbox</h2>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {emails.length} emails
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={loadInbox}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={processAll}
                                disabled={processing}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-xs font-medium shadow-sm",
                                    processing
                                        ? "bg-slate-300 text-slate-500 cursor-wait"
                                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200/50"
                                )}
                            >
                                {processing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        Run Agent
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Search and Sort */}
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
                            className={clsx(
                                "px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all",
                                sortBy === 'priority'
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"
                            )}
                        >
                            <ArrowUpDown size={12} />
                            {sortBy === 'priority' ? 'Priority' : 'Date'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <InboxIcon size={28} className="text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">No emails found</p>
                            <p className="text-xs text-slate-400 mt-1">Try a different search or sync your inbox</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {filteredEmails.map((email, index) => (
                                    <motion.div
                                        key={email.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => selectEmail(email.id)}
                                        className={clsx(
                                            "p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 group relative",
                                            selectedEmail?.id === email.id
                                                ? "bg-emerald-50/50 border-l-3 border-l-emerald-500"
                                                : "border-l-3 border-l-transparent"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                                                    {email.sender?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={clsx(
                                                        "font-medium text-sm truncate block",
                                                        !email.is_read ? "text-slate-800" : "text-slate-500"
                                                    )}>
                                                        {email.sender}
                                                    </span>
                                                    {!email.is_read && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-4 right-4" />
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className={clsx(
                                            "text-sm mb-1.5 truncate pl-10",
                                            !email.is_read ? "text-slate-800 font-medium" : "text-slate-600"
                                        )}>
                                            {email.subject}
                                        </div>

                                        <div className="text-xs text-slate-400 line-clamp-1 mb-2 pl-10">
                                            {email.body}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap pl-10">
                                            <span className={clsx(
                                                "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                                getCategoryColor(email.category)
                                            )}>
                                                {cleanText(email.category)}
                                            </span>

                                            {email.urgency_score && email.urgency_score >= 7 && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-medium flex items-center gap-1">
                                                    <Flame size={10} />
                                                    URGENT
                                                </span>
                                            )}

                                            {email.deadline_text && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-medium flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {email.deadline_text}
                                                </span>
                                            )}

                                            {email.has_dark_patterns && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-medium">
                                                    ⚠️ Suspicious
                                                </span>
                                            )}

                                            {email.action_items && email.action_items.length > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <CheckCircle size={10} />
                                                    {email.action_items.length} task{email.action_items.length > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Detail */}
            <div className="flex-1 bg-white/50 flex flex-col h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    {selectedEmail ? (
                        <motion.div
                            key={selectedEmail.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 overflow-y-auto"
                        >
                            <div className="max-w-4xl mx-auto p-8 space-y-6">
                                {/* Header */}
                                <div className="border-b border-slate-200/60 pb-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h1 className="text-2xl font-bold text-slate-800 leading-tight pr-4">
                                            {selectedEmail.subject}
                                        </h1>
                                        <div className="flex gap-2 relative shrink-0" ref={menuRef}>
                                            <button
                                                onClick={() => setShowDossier(true)}
                                                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                                            >
                                                <User size={12} />
                                                Dossier
                                            </button>
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-500 transition-colors">
                                                <Star size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowMenu(!showMenu)}
                                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {showMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
                                                >
                                                    <button
                                                        onClick={() => deleteEmail(selectedEmail.id)}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete Email
                                                    </button>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-100">
                                            {selectedEmail.sender?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-slate-800 font-medium">{selectedEmail.sender}</div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(selectedEmail.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "ml-auto px-2.5 py-1 rounded-full text-xs font-medium border",
                                            getCategoryColor(selectedEmail.category)
                                        )}>
                                            {cleanText(selectedEmail.category)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                        {quickActions.map((action, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 * i }}
                                                onClick={() => executeQuickAction(action)}
                                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-indigo-200"
                                            >
                                                <Zap size={12} className="fill-indigo-700/20" />
                                                {action.description}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="prose max-w-none text-slate-600 leading-relaxed">
                                    <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                                </div>

                                {/* AI Insights Panel */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
                                    {/* Action Items */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle size={14} className="text-emerald-600" />
                                            </div>
                                            Action Items
                                        </h3>
                                        {selectedEmail.action_items.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedEmail.action_items.map((item, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 * i }}
                                                        onClick={() => toggleActionItem(item)}
                                                        className={clsx(
                                                            "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                                            item.status === 'completed'
                                                                ? "bg-emerald-50 border-emerald-100"
                                                                : "bg-slate-50 border-transparent hover:border-slate-200"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "mt-0.5 transition-colors",
                                                            item.status === 'completed' ? "text-emerald-500" : "text-slate-400 group-hover:text-emerald-500"
                                                        )}>
                                                            {item.status === 'completed' ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={clsx(
                                                                "text-sm transition-colors",
                                                                item.status === 'completed' ? "text-slate-500 line-through" : "text-slate-700"
                                                            )}>
                                                                {item.description}
                                                            </div>
                                                            {item.deadline && (
                                                                <div className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                                                                    <Clock size={10} /> {item.deadline}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-400 text-center py-4">
                                                No action items detected
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Drafts */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Mail size={14} className="text-blue-600" />
                                            </div>
                                            Draft Reply
                                        </h3>
                                        {selectedEmail.drafts.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedEmail.drafts.map((draft, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="text-xs text-blue-600 font-semibold mb-2">
                                                            Re: {draft.subject}
                                                        </div>
                                                        <div className="text-sm text-slate-600 font-mono text-xs leading-relaxed">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="my-1" {...props} />,
                                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                                    strong: ({ node, ...props }) => <span className="font-medium text-emerald-600" {...props} />,
                                                                }}
                                                            >
                                                                {cleanText(draft.body)}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <div className="flex flex-wrap gap-2 justify-center mb-4">
                                                    {["Acknowledge", "Accept", "Decline", "Clarify"].map((intent) => (
                                                        <button
                                                            key={intent}
                                                            disabled={smartReplyLoading}
                                                            onClick={() => useSmartReply(intent.toLowerCase())}
                                                            className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            <MessageSquare size={12} />
                                                            {intent}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex gap-3 justify-center mb-4">
                                                    <select
                                                        value={draftTone}
                                                        onChange={(e) => setDraftTone(e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                                    >
                                                        <option value="professional">Professional</option>
                                                        <option value="casual">Casual</option>
                                                        <option value="friendly">Friendly</option>
                                                        <option value="urgent">Urgent</option>
                                                    </select>
                                                    <select
                                                        value={draftLength}
                                                        onChange={(e) => setDraftLength(e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                                    >
                                                        <option value="concise">Concise</option>
                                                        <option value="detailed">Detailed</option>
                                                        <option value="bulleted">Bulleted</option>
                                                    </select>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => agentApi.draft(selectedEmail.id, undefined, draftTone, draftLength).then(() => selectEmail(selectedEmail.id))}
                                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-200/50"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Sparkles size={14} />
                                                        Generate Draft
                                                    </span>
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-slate-400"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <InboxIcon size={36} className="text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">Select an email to view details</p>
                            <p className="text-sm text-slate-400 mt-1">Your AI-powered inbox awaits</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Dossier Sidebar */}
            <AnimatePresence>
                {showDossier && selectedEmail && (
                    <DossierSidebar
                        emailId={selectedEmail.id}
                        onClose={() => setShowDossier(false)}
                    />
                )}
            </AnimatePresence>

            <AIStatus isProcessing={processing} />
        </div>
    );
};

export default Inbox;
