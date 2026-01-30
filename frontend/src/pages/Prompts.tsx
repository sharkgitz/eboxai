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
        switch (type.toLowerCase()) {
            case 'categorize': return '📂';
            case 'summarize': return '📝';
            case 'draft': return '✉️';
            case 'action_items': return '✅';
            default: return '⚡';
        }
    };

    return (
        <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            {/* Sidebar List */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-72 border-r border-slate-200/60 bg-white/80 backdrop-blur-sm p-5"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200/50">
                        <Brain className="text-white" size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Prompt Brain</h2>
                        <p className="text-xs text-slate-500">Configure AI behavior</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {prompts.map((prompt) => (
                        <motion.button
                            key={prompt.id}
                            onClick={() => selectPrompt(prompt)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={clsx(
                                "w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 group",
                                selectedPrompt?.id === prompt.id
                                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200/50"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                            )}
                        >
                            <span className="text-lg">{getPromptIcon(prompt.prompt_type)}</span>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium block truncate">{prompt.name}</span>
                                <span className={clsx(
                                    "text-xs",
                                    selectedPrompt?.id === prompt.id ? "text-purple-200" : "text-slate-400"
                                )}>{prompt.prompt_type}</span>
                            </div>
                            <Sparkles size={14} className={clsx(
                                "transition-opacity",
                                selectedPrompt?.id === prompt.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                            )} />
                        </motion.button>
                    ))}
                </div>

                {/* Info Card */}
                <div className="mt-8 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <Wand2 size={14} />
                        <span className="text-xs font-medium">Pro Tip</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Use variables like <code className="bg-white px-1 py-0.5 rounded text-purple-600 font-mono text-[10px]">{'{subject}'}</code> and <code className="bg-white px-1 py-0.5 rounded text-purple-600 font-mono text-[10px]">{'{body}'}</code> in your templates.
                    </p>
                </div>
            </motion.div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-white/50">
                <AnimatePresence mode="wait">
                    {selectedPrompt ? (
                        <motion.div
                            key={selectedPrompt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200/60 flex justify-between items-center bg-white/80 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{getPromptIcon(selectedPrompt.prompt_type)}</span>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800">{selectedPrompt.name}</h1>
                                        <p className="text-slate-500 text-sm mt-0.5">Configure how the AI processes this task</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || editedTemplate === selectedPrompt.template}
                                    className={clsx(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-md",
                                        saved
                                            ? "bg-emerald-500 text-white shadow-emerald-200/50"
                                            : saving || editedTemplate === selectedPrompt.template
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                                : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-200/50 hover:shadow-lg hover:scale-105 active:scale-95"
                                    )}
                                >
                                    {saved ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Saved!
                                        </>
                                    ) : saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 p-6">
                                <div className="h-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Code size={14} className="text-purple-500" />
                                            Prompt Template
                                        </label>
                                        <span className="text-xs text-slate-400">
                                            {editedTemplate.length} characters
                                        </span>
                                    </div>
                                    <textarea
                                        value={editedTemplate}
                                        onChange={(e) => setEditedTemplate(e.target.value)}
                                        className="flex-1 bg-slate-50 text-slate-700 font-mono text-sm p-5 rounded-xl border border-slate-200/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none resize-none leading-relaxed transition-all"
                                        spellCheck={false}
                                        placeholder="Enter your prompt template here..."
                                    />
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-xs text-slate-500 flex gap-3">
                                            <span className="flex items-center gap-1">
                                                <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-600 font-mono">{'{subject}'}</code>
                                                Email subject
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-600 font-mono">{'{body}'}</code>
                                                Email body
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-600 font-mono">{'{sender}'}</code>
                                                Sender name
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Brain size={32} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Select a prompt to edit</p>
                                <p className="text-slate-400 text-sm mt-1">Choose from the sidebar to get started</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Prompts;
