import { useState, useRef, useEffect } from 'react';
import { agentApi } from '../api';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

const Agent = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'agent', content: 'Hello! I am your Email Productivity Agent. How can I help you with your inbox today?' }
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
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await agentApi.chat(userMsg);
            setMessages(prev => [...prev, { role: 'agent', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, I encountered an error processing your request.' }]);
        } finally {
            setLoading(false);
        }
    };

    const cleanContent = (content: string) => {
        if (!content) return "";
        // Aggressively remove all asterisks
        return content.replace(/\*\*/g, '').replace(/\*/g, '');
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
            <div className="flex-1 bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-900/80 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                        <Bot className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Agent Chat <span className="text-xs text-gray-500 ml-2">v2.0</span></h1>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Online & Ready
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex gap-4 max-w-[80%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-gray-700" : "bg-blue-600"
                            )}>
                                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                            </div>
                            <div className={clsx(
                                "p-4 rounded-2xl text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-gray-800 text-white rounded-tr-none"
                                    : "bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tl-none"
                            )}>
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
                                    {cleanContent(msg.content)}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-4 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 rounded-tl-none flex gap-1 items-center">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-gray-900/80 border-t border-gray-800">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the agent to summarize emails, find tasks, or draft replies..."
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-6 pr-14 py-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Agent;
