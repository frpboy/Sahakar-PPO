'use client';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);

        // Auto dismiss
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300
                            ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-200 text-blue-800' : ''}
                            ${toast.type === 'warning' ? 'bg-white border-yellow-200 text-yellow-800' : ''}
                        `}
                    >
                        <div className="mt-0.5 shrink-0">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
