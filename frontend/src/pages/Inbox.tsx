import { ActionItemsPanel } from '../components/ActionItemsPanel';
import DossierSidebar from '../components/DossierSidebar';
import {
    RefreshCw,
    Play,
    Search,
    Mail,
    CheckCircle,
    Clock,
    Inbox as InboxIcon,
    Star,
    MoreHorizontal,
    Trash2,
    CheckSquare,
    Square,
    User
} from 'lucide-react';
import { clsx } from 'clsx';
import AIStatus from '../components/AIStatus';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Inbox = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDossier, setShowDossier] = useState<string | null>(null);
    const [draftTone, setDraftTone] = useState('professional');
    const [draftLength, setDraftLength] = useState('concise');
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
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await inboxApi.getAll();
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

        // Optimistic update
        const updatedItems = selectedEmail.action_items.map(i =>
            i.id === item.id ? { ...i, status: newStatus } : i
        );
        setSelectedEmail({ ...selectedEmail, action_items: updatedItems });

        try {
            await inboxApi.updateActionItem(item.id, newStatus);
        } catch (err) {
            console.error(err);
            // Revert on error
            selectEmail(selectedEmail.id);
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'important': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'newsletter': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'spam': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
            case 'to-do': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }
    };

    const cleanText = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*/g, '').replace(/\*/g, '');
    };

    return (
        <div className="flex h-full bg-background">
            {/* Email List */}
            <div className="w-[320px] lg:w-[400px] border-r border-border flex flex-col bg-surface">
                <div className="p-4 border-b border-border space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-text-primary">Inbox</h2>
                        <div className="flex gap-1">
                            <button onClick={loadInbox} className="p-1.5 hover:bg-surfaceHighlight rounded-md text-text-secondary hover:text-text-primary transition-colors">
                                <RefreshCw size={16} />
                            </button>
                            <button
                                onClick={processAll}
                                disabled={processing}
                                className={clsx(
                                    "p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium",
                                    processing
                                        ? "bg-brand-600/50 text-white cursor-wait"
                                        : "bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                                )}
                            >
                                <Play size={14} className={processing ? "animate-spin" : ""} />
                                {processing ? 'Processing...' : 'Run Agent'}
                            </button>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-surfaceHighlight border border-transparent focus:border-brand-500/50 rounded-md pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {emails.map((email) => (
                                <div
                                    key={email.id}
                                    onClick={() => selectEmail(email.id)}
                                    className={clsx(
                                        "p-3 cursor-pointer transition-all duration-200 hover:bg-surfaceHighlight group relative",
                                        selectedEmail?.id === email.id ? "bg-surfaceHighlight border-l-2 border-l-brand-500" : "border-l-2 border-l-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={clsx("font-medium text-sm truncate", !email.is_read ? "text-text-primary" : "text-text-secondary")}>
                                                {email.sender}
                                            </span>
                                            {!email.is_read && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                                        </div>
                                        <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                                            {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className={clsx("text-sm mb-1 truncate", !email.is_read ? "text-text-primary font-medium" : "text-text-secondary")}>
                                        {email.subject}
                                    </div>
                                    <div className="text-xs text-text-tertiary line-clamp-1 mb-2">{email.body}</div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider", getCategoryColor(email.category))}>
                                            {cleanText(email.category)}
                                        </span>

                                        {/* Sentiment Badge */}
                                        {email.emotion && email.emotion !== 'neutral' && (
                                            <span className={clsx(
                                                "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                                                email.emotion === 'happy' && "bg-green-500/10 border-green-500/30 text-green-400",
                                                email.emotion === 'frustrated' && "bg-orange-500/10 border-orange-500/30 text-orange-400",
                                                email.emotion === 'angry' && "bg-red-500/10 border-red-500/30 text-red-400",
                                                email.emotion === 'worried' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                            )}>
                                                {email.emotion === 'happy' && '😊'}
                                                {email.emotion === 'frustrated' && '😤'}
                                                {email.emotion === 'angry' && '😠'}
                                                {email.emotion === 'worried' && '😰'}
                                                {email.emotion === 'excited' && '🎉'}
                                                {' '}{email.emotion}
                                            </span>
                                        )}

                                        {/* Urgency Indicator */}
                                        {email.urgency_score && email.urgency_score >= 7 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-red-500/10 border-red-500/30 text-red-400 font-medium">
                                                🔥 URGENT
                                            </span>
                                        )}

                                        {/* Dark Pattern Warning */}
                                        {email.has_dark_patterns && (
                                            <span className={clsx(
                                                "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                                                email.dark_pattern_severity === 'high' && "bg-red-500/10 border-red-500/30 text-red-400",
                                                email.dark_pattern_severity === 'medium' && "bg-orange-500/10 border-orange-500/30 text-orange-400",
                                                email.dark_pattern_severity === 'low' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                            )}>
                                                ⚠️ SUSPICIOUS
                                            </span>
                                        )}

                                        {email.action_items && email.action_items.length > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                                                <CheckCircle size={10} />
                                                {email.action_items.length}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Email Detail */}
            <div className="flex-1 bg-background flex flex-col h-full overflow-hidden">
                {selectedEmail ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto p-8 space-y-8">
                            {/* Header */}
                            <div className="border-b border-border pb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h1 className="text-2xl font-bold text-text-primary leading-tight">{selectedEmail.subject}</h1>
                                    <div className="flex gap-2 relative" ref={menuRef}>
                                        <button className="p-2 hover:bg-surfaceHighlight rounded-md text-text-secondary hover:text-text-primary transition-colors">
                                            <Star size={18} />
                                        </button>
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="p-2 hover:bg-surfaceHighlight rounded-md text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        {showMenu && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={() => deleteEmail(selectedEmail.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surfaceHighlight flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete Email
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/20">
                                        {selectedEmail.sender[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-text-primary font-medium">{selectedEmail.sender}</div>
                                        <div className="text-xs text-text-tertiary">{new Date(selectedEmail.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDossier(selectedEmail.id);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors"
                                        >
                                            <User size={12} />
                                            View Dossier
                                        </button>
                                        <span className={clsx("px-2 py-1 rounded text-xs font-medium border uppercase tracking-wider", getCategoryColor(selectedEmail.category))}>
                                            {cleanText(selectedEmail.category)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed">
                                <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                            </div>

                            {/* AI Insights Panel */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-border">
                                {/* Action Items */}
                                <div className="bg-surface border border-border rounded-xl p-5 hover:border-brand-500/20 transition-colors">
                                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <CheckCircle size={16} className="text-green-500" />
                                        Action Items
                                    </h3>
                                    {selectedEmail.action_items.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedEmail.action_items.map((item, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => toggleActionItem(item)}
                                                    className={clsx(
                                                        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                                                        item.status === 'completed'
                                                            ? "bg-green-500/10 border-green-500/20"
                                                            : "bg-surfaceHighlight/50 border-transparent hover:border-border"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "mt-1 transition-colors",
                                                        item.status === 'completed' ? "text-green-500" : "text-text-tertiary group-hover:text-brand-500"
                                                    )}>
                                                        {item.status === 'completed' ? <CheckSquare size={16} /> : <Square size={16} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={clsx(
                                                            "text-sm transition-colors",
                                                            item.status === 'completed' ? "text-text-secondary line-through" : "text-text-primary"
                                                        )}>
                                                            {item.description}
                                                        </div>
                                                        {item.deadline && (
                                                            <div className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                                                                <Clock size={12} /> {item.deadline}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-text-tertiary italic">No action items detected.</div>
                                    )}
                                </div>

                                {/* Drafts */}
                                <div className="bg-surface border border-border rounded-xl p-5 hover:border-brand-500/20 transition-colors">
                                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <Mail size={16} className="text-brand-500" />
                                        Draft Reply
                                    </h3>
                                    {selectedEmail.drafts.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedEmail.drafts.map((draft, i) => (
                                                <div key={i} className="p-4 bg-surfaceHighlight/50 rounded-lg border border-transparent hover:border-border transition-colors">
                                                    <div className="text-xs text-brand-500 font-bold mb-2 uppercase tracking-wider">Subject: {draft.subject}</div>
                                                    <div className="text-sm text-text-secondary font-mono text-xs">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2" {...props} />,
                                                                li: ({ node, ...props }) => <li className="my-1" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                                strong: ({ node, ...props }) => <span className="font-medium text-blue-200" {...props} />,
                                                            }}
                                                        >
                                                            {cleanText(draft.body)}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="flex gap-4 justify-center mb-4">
                                                <select
                                                    value={draftTone}
                                                    onChange={(e) => setDraftTone(e.target.value)}
                                                    className="bg-surfaceHighlight border border-border rounded-md px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-brand-500"
                                                >
                                                    <option value="professional">Professional</option>
                                                    <option value="casual">Casual</option>
                                                    <option value="friendly">Friendly</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                                <select
                                                    value={draftLength}
                                                    onChange={(e) => setDraftLength(e.target.value)}
                                                    className="bg-surfaceHighlight border border-border rounded-md px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-brand-500"
                                                >
                                                    <option value="concise">Concise</option>
                                                    <option value="detailed">Detailed</option>
                                                    <option value="bulleted">Bulleted</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => agentApi.draft(selectedEmail.id, undefined, draftTone, draftLength).then(() => selectEmail(selectedEmail.id))}
                                                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
                                            >
                                                Generate Draft Reply
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary">
                        <div className="w-16 h-16 rounded-2xl bg-surfaceHighlight flex items-center justify-center mb-4">
                            <InboxIcon size={32} className="opacity-50" />
                        </div>
                        <p className="font-medium">Select an email to view details</p>
                    </div>
                )}
            </div>
            <AIStatus isProcessing={processing} />
            <DossierSidebar 
                emailId={showDossier}
                onClose={() => setShowDossier(null)}
            />
        </div >
    );
};

export default Inbox;
