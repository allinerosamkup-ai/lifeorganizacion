import { useState, useEffect } from 'react';

interface ToastState {
    message: string;
    visible: boolean;
    type?: 'success' | 'error' | 'info';
}

let globalSetToast: ((t: ToastState) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 2000) {
    if (globalSetToast) {
        globalSetToast({ message, visible: true, type });
        setTimeout(() => {
            globalSetToast?.({ message: '', visible: false, type });
        }, durationMs);
    }
}

export function ToastProvider() {
    const [toast, setToast] = useState<ToastState>({ message: '', visible: false, type: 'success' });

    useEffect(() => {
        globalSetToast = setToast;
        return () => { globalSetToast = null; };
    }, []);

    if (!toast.visible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] animate-fade-in-up">
            <div className={`${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'} text-white px-5 py-2.5 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-md`}>
                <span>{toast.type === 'error' ? 'x' : toast.type === 'info' ? 'i' : '✓'}</span>
                <span>{toast.message}</span>
            </div>
        </div>
    );
}
