import { Brain, Zap, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

interface AIStatusProps {
    isProcessing: boolean;
}

const AIStatus = ({ isProcessing }: AIStatusProps) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!isProcessing) {
            setStep(0);
            return;
        }

        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 800);

        return () => clearInterval(interval);
    }, [isProcessing]);

    if (!isProcessing) return null;

    const steps = [
        { icon: Brain, label: "Analyzing Context", color: "text-purple-400", bg: "bg-purple-500/20" },
        { icon: Zap, label: "Extracting Actions", color: "text-yellow-400", bg: "bg-yellow-500/20" },
        { icon: MessageSquare, label: "Drafting Replies", color: "text-blue-400", bg: "bg-blue-500/20" },
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-surface/90 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                <div className="relative">
                    <div className={clsx("p-3 rounded-xl transition-colors duration-300", currentStep.bg)}>
                        <currentStep.icon className={clsx("w-6 h-6 transition-colors duration-300", currentStep.color)} />
                    </div>
                    <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                            <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", currentStep.bg.replace('/20', ''))}></span>
                            <span className={clsx("relative inline-flex rounded-full h-3 w-3", currentStep.bg.replace('/20', ''))}></span>
                        </span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">AI Agent Active</div>
                    <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                        {currentStep.label}
                        <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    </div>
                </div>

                <div className="h-8 w-8 rounded-full border-2 border-border border-t-brand-500 animate-spin" />
            </div>
        </div>
    );
};

export default AIStatus;
