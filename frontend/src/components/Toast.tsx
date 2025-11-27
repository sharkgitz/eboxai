import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: (id: string) => void;
}

const Toast = ({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle size={18} className="text-green-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-brand-500" />
    };

    const colors = {
        success: 'border-green-500/30 bg-green-500/10',
        error: 'border-red-500/30 bg-red-500/10',
        info: 'border-brand-500/30 bg-brand-500/10'
    };

    return (
        <div className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} backdrop-blur-md shadow-lg min-w-[300px] max-w-[400px]`}>
            {icons[type]}
            <span className="flex-1 text-sm text-text-primary">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
