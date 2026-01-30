import { useEffect, useState } from 'react';
import { promptsApi } from '../api';
import { Save, Brain, Sparkles, Code, Wand2, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Prompt {
    id: number;
    name: string;
    template: string;
    prompt_type: string;
}

const Prompts = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [editedTemplate, setEditedTemplate] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            const res = await promptsApi.getAll();
            setPrompts(res.data);
            if (res.data.length > 0 && !selectedPrompt) {
                selectPrompt(res.data[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const selectPrompt = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setEditedTemplate(prompt.template);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!selectedPrompt) return;
        setSaving(true);
        try {
            await promptsApi.update(selectedPrompt.id, { ...selectedPrompt, template: editedTemplate });
            setPrompts(prompts.map(p => p.id === selectedPrompt.id ? { ...p, template: editedTemplate } : p));
            setSelectedPrompt({ ...selectedPrompt, template: editedTemplate });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getPromptIcon = (type: string) => {
        switch (type) {
            case 'categorization': return '🏷️';
            case 'action_extraction': return '⚡'; // Zap
            case 'auto_reply': return '🤖';
            default: return '📝';
        }
    };

    return (
        <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-80 border-r border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 flex flex-col"
            >
                <div className="flex items-center gap-2 mb-8 text-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                        <Brain size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Prompt Brain</span>
                </div>

                <div className="space-y-2">
                    {prompts.map((prompt) => (
                        <motion.button
                            key={prompt.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectPrompt(prompt)}
                            className={clsx(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm group text-left border relative overflow-hidden",
                                selectedPrompt?.id === prompt.id
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-md shadow-purple-200"
                                    : "hover:bg-slate-50 text-slate-600 border-transparent hover:border-slate-200"
                            )}
                        >
                            <span className="text-lg relative z-10">{getPromptIcon(prompt.prompt_type)}</span>
                            <div className="flex-1 min-w-0 relative z-10">
                                <span className={clsx("font-medium block truncate", selectedPrompt?.id === prompt.id ? "text-white" : "text-slate-700")}>
                                    {prompt.name}
                                </span>
                                <span className={clsx(
                                    "text-xs block truncate mt-0.5",
                                    selectedPrompt?.id === prompt.id ? "text-purple-200" : "text-slate-400"
                                )}>{prompt.prompt_type}</span>
                            </div>
                            {selectedPrompt?.id === prompt.id && (
                                <Sparkles size={14} className="text-purple-300 relative z-10" />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Info Card */}
                <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                        <Wand2 size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Use variables like <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-600 font-mono text-[10px] shadow-sm">{'{subject}'}</code> and <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-600 font-mono text-[10px] shadow-sm">{'{body}'}</code> to insert email content dynamically.
                    </p>
                </div>
            </motion.div>

            {/* Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    {selectedPrompt ? (
                        <motion.div
                            key={selectedPrompt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 flex flex-col p-8 overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                                        {selectedPrompt.name}
                                        <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium border border-purple-100 uppercase tracking-widest">
                                            {selectedPrompt.prompt_type}
                                        </span>
                                    </h1>
                                    <p className="text-slate-500">Configure how the AI processes this task using the template below.</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || editedTemplate === selectedPrompt.template}
                                    className={clsx(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm",
                                        saved
                                            ? "bg-emerald-500 text-white shadow-emerald-200/50"
                                            : saving || editedTemplate === selectedPrompt.template
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-200/50 hover:shadow-lg hover:-translate-y-0.5"
                                    )}
                                >
                                    {saved ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Saved!
                                        </>
                                    ) : saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Configuration
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                                <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Code size={12} className="text-purple-500" />
                                        </div>
                                        Prompt Template
                                    </label>
                                    <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                                        {editedTemplate.length} chars
                                    </span>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={editedTemplate}
                                        onChange={(e) => setEditedTemplate(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-white text-slate-600 font-mono text-sm p-6 focus:outline-none resize-none leading-relaxed selection:bg-purple-100 selection:text-purple-900"
                                        spellCheck={false}
                                        placeholder="Enter your prompt template here..."
                                    />
                                </div>
                                <div className="bg-slate-50 border-t border-slate-200/60 px-6 py-3 flex gap-4 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Sparkles size={12} className="text-purple-400" />
                                        <span>Variables:</span>
                                    </div>
                                    {['{subject}', '{body}', '{sender}'].map(v => (
                                        <code key={v} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-purple-600 font-mono font-medium shadow-sm">{v}</code>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-md"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Brain size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Prompt</h3>
                                <p className="text-slate-500">
                                    Choose a task from the sidebar to configure how the AI handles different aspects of your email workflow.
                                </p>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Prompts;
