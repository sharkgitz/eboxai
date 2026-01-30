import { useState, useRef, useEffect } from 'react';
import { agentApi } from '../api';
import { Send, Bot, User, Sparkles, Zap, MessageSquare, Brain } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'agent';
    content: string;
    timestamp?: Date;
}

const Agent = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'agent', content: 'Hello! I am your Email Productivity Agent. How can I help you with your inbox today?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
        setLoading(true);

        try {
            const res = await agentApi.chat(userMsg);
            setMessages(prev => [...prev, { role: 'agent', content: res.data.response, timestamp: new Date() }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, I encountered an error processing your request.', timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    const cleanContent = (content: string) => {
        if (!content) return "";
        return content.replace(/\*\*/g, '').replace(/\*/g, '');
    };

    const quickActions = [
        { label: 'Summarize inbox', icon: MessageSquare },
        { label: 'Find urgent emails', icon: Zap },
        { label: 'Draft a reply', icon: Send },
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
            <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">
                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 transform hover:scale-105 transition-transform">
                                <Bot className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    AI Assistant
                                    <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">v2.0</span>
                                </h1>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Online & Ready to Help
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
                                <Brain size={14} className="text-slate-500" />
                                <span className="text-xs text-slate-600 font-medium">Context-Aware</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Chat Container */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={clsx(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={clsx(
                                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-br from-slate-600 to-slate-700"
                                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                                    )}>
                                        {msg.role === 'user' ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className={clsx(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-tr-md"
                                                : "bg-slate-100 text-slate-700 border border-slate-200/50 rounded-tl-md"
                                        )}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="my-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    strong: ({ node, ...props }) => <span className={clsx("font-semibold", msg.role === 'user' ? "text-emerald-300" : "text-emerald-600")} {...props} />,
                                                }}
                                            >
                                                {cleanContent(msg.content)}
                                            </ReactMarkdown>
                                        </div>
                                        {msg.timestamp && (
                                            <span className={clsx("text-[10px] text-slate-400 px-1", msg.role === 'user' ? "text-right" : "")}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 max-w-[85%]"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200/50 rounded-tl-md flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Quick Actions - show only when no messages yet */}
                    {messages.length <= 1 && (
                        <div className="px-6 pb-2">
                            <p className="text-xs text-slate-400 mb-2">Try asking:</p>
                            <div className="flex gap-2 flex-wrap">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(action.label)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-full text-xs font-medium transition-all hover:shadow-sm"
                                    >
                                        <action.icon size={12} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your emails, request summaries, or draft replies..."
                                className="w-full bg-white border border-slate-200 rounded-xl pl-5 pr-14 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200/50 hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Agent;
