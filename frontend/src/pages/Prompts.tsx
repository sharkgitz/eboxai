import { useEffect, useState } from 'react';
import { promptsApi } from '../api';
import { Save, Brain, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

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
    };

    const handleSave = async () => {
        if (!selectedPrompt) return;
        setSaving(true);
        try {
            await promptsApi.update(selectedPrompt.id, { ...selectedPrompt, template: editedTemplate });
            // Update local state
            setPrompts(prompts.map(p => p.id === selectedPrompt.id ? { ...p, template: editedTemplate } : p));
            setSelectedPrompt({ ...selectedPrompt, template: editedTemplate });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar List */}
            <div className="w-64 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl p-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Brain className="text-purple-500" />
                    Prompt Brain
                </h2>
                <div className="space-y-2">
                    {prompts.map((prompt) => (
                        <button
                            key={prompt.id}
                            onClick={() => selectPrompt(prompt)}
                            className={clsx(
                                "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3",
                                selectedPrompt?.id === prompt.id
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <Sparkles size={16} />
                            <span className="font-medium">{prompt.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-gray-950">
                {selectedPrompt ? (
                    <>
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{selectedPrompt.name}</h1>
                                <p className="text-gray-500 text-sm mt-1">Configure how the agent thinks for this task.</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>

                        <div className="flex-1 p-6">
                            <div className="h-full bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col">
                                <label className="text-sm font-medium text-gray-400 mb-2">Prompt Template</label>
                                <textarea
                                    value={editedTemplate}
                                    onChange={(e) => setEditedTemplate(e.target.value)}
                                    className="flex-1 bg-gray-950 text-gray-200 font-mono text-sm p-4 rounded-xl border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none leading-relaxed"
                                    spellCheck={false}
                                />
                                <div className="mt-4 text-xs text-gray-500 flex gap-4">
                                    <span>Variables: <code className="bg-gray-800 px-1 rounded text-purple-400">{'{subject}'}</code>, <code className="bg-gray-800 px-1 rounded text-purple-400">{'{body}'}</code></span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a prompt to edit
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prompts;
