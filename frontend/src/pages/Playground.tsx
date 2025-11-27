import { useState, useEffect } from 'react';
import { inboxApi, playgroundApi } from '../api';
import type { Email } from '../api';
import { Play, Terminal, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';

const Playground = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string>('');
    const [promptTemplate, setPromptTemplate] = useState<string>(
        "Analyze the following email and extract key dates:\n\nSubject: {subject}\nBody: {body}\n\nOutput:"
    );
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await inboxApi.getAll();
                setEmails(res.data);
                if (res.data.length > 0) {
                    setSelectedEmailId(res.data[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchEmails();
    }, []);

    const runPrompt = async () => {
        if (!selectedEmailId) return;
        setLoading(true);
        try {
            const res = await playgroundApi.test(selectedEmailId, promptTemplate);
            setResult(res.data.response);
        } catch (err) {
            console.error(err);
            setResult("Error running prompt. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 bg-background text-text-primary">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Terminal className="text-brand-500" />
                        Prompt Playground
                    </h1>
                    <p className="text-text-secondary text-sm">Test and iterate on your prompts in real-time.</p>
                </div>
                <button
                    onClick={runPrompt}
                    disabled={loading || !selectedEmailId}
                    className={clsx(
                        "px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all",
                        loading
                            ? "bg-brand-600/50 cursor-wait"
                            : "bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20"
                    )}
                >
                    <Play size={16} className={loading ? "animate-spin" : ""} />
                    {loading ? "Running..." : "Run Prompt"}
                </button>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left: Editor */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-secondary">Prompt Template</label>
                    <div className="flex-1 bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                        <div className="bg-surfaceHighlight px-4 py-2 border-b border-border text-xs text-text-tertiary flex gap-4">
                            <span>Available Variables:</span>
                            <span className="text-brand-500">{'{subject}'}</span>
                            <span className="text-brand-500">{'{body}'}</span>
                            <span className="text-brand-500">{'{sender}'}</span>
                        </div>
                        <textarea
                            value={promptTemplate}
                            onChange={(e) => setPromptTemplate(e.target.value)}
                            className="flex-1 bg-transparent p-4 font-mono text-sm resize-none focus:outline-none"
                            placeholder="Enter your prompt here..."
                        />
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-secondary">Test Email</label>
                        <select
                            value={selectedEmailId}
                            onChange={(e) => setSelectedEmailId(e.target.value)}
                            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        >
                            {emails.map(email => (
                                <option key={email.id} value={email.id}>
                                    {email.sender} - {email.subject.substring(0, 40)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <label className="text-sm font-medium text-text-secondary">Output Preview</label>
                        <div className="flex-1 bg-surface border border-border rounded-xl p-4 overflow-y-auto">
                            {result ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {result}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-text-tertiary opacity-50">
                                    <ChevronRight size={48} />
                                    <p>Run a prompt to see results</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Playground;
