import { useState, useRef, useEffect } from 'react';
import { agentApi } from '../api';
import { Send, Bot, User, Sparkles, Zap, Brain } from 'lucide-react';
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

    const suggestions = [
        "What are my top priorities today?",
        "Do I have any meetings today?",
        "Draft a reply to the last email from John",
        "Summarize my unread emails"
    ];

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                        <Brain className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Agent Chat</h1>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs text-emerald-600 font-medium">Online & Ready</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex gap-4 max-w-3xl mx-auto",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1",
                                msg.role === 'user'
                                    ? "bg-emerald-500 text-white shadow-emerald-200"
                                    : "bg-white border border-slate-200 text-purple-600"
                            )}>
                                {msg.role === 'user'
                                    ? <User size={16} />
                                    : <Bot size={16} />
                                }
                            </div>

                            <div className={clsx(
                                "rounded-2xl p-4 md:p-6 shadow-sm max-w-[85%] text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-emerald-500 text-white rounded-tr-sm shadow-emerald-100"
                                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                            )}>
                                {msg.role === 'agent' ? (
                                    <div className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-800 prose-strong:text-slate-800 prose-code:text-indigo-600 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 max-w-3xl mx-auto"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Suggestions */}
                    {messages.length === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(s);
                                    }}
                                    className="text-left px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 transition-colors flex items-center gap-2 group shadow-sm hover:shadow"
                                >
                                    <Sparkles size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the agent to summarize emails, find tasks, or draft replies..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-14 py-4 shadow-sm focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className={clsx(
                                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                                input.trim() && !loading
                                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="text-center">
                        <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                            <Zap size={10} />
                            Powered by Ebox AI Graph-RAG & Agentic Engine
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Agent;
