import { useState, useEffect } from 'react';

interface ToastState {
    message: string;
    visible: boolean;
    type?: 'success' | 'error' | 'info';
}

let globalSetToast: ((t: ToastState) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 2500) {
    if (globalSetToast) {
        globalSetToast({ message, visible: true, type });
        setTimeout(() => {
            globalSetToast?.({ message: '', visible: false, type });
        }, durationMs);
    }
}

const ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
} as const;

const BG_CLASSES = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
} as const;

export function ToastProvider() {
    const [toast, setToast] = useState<ToastState>({ message: '', visible: false, type: 'success' });

    useEffect(() => {
        globalSetToast = setToast;
        return () => { globalSetToast = null; };
    }, []);

    if (!toast.visible) return null;

    const type = toast.type ?? 'success';

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] animate-fade-in">
            <div className={`${BG_CLASSES[type]} text-white px-5 py-2.5 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-md`}>
                <span aria-hidden="true">{ICONS[type]}</span>
                <span>{toast.message}</span>
            </div>
        </div>
    );
}
