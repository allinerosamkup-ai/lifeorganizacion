import { useState, useEffect } from 'react';

interface ToastState {
    message: string;
    visible: boolean;
}

let globalSetToast: ((t: ToastState) => void) | null = null;

export function showToast(message: string, durationMs = 2000) {
    if (globalSetToast) {
        globalSetToast({ message, visible: true });
        setTimeout(() => {
            globalSetToast?.({ message: '', visible: false });
        }, durationMs);
    }
}

export function ToastProvider() {
    const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

    useEffect(() => {
        globalSetToast = setToast;
        return () => { globalSetToast = null; };
    }, []);

    if (!toast.visible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] animate-fade-in-up">
            <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2 backdrop-blur-md">
                <span>✓</span>
                <span>{toast.message}</span>
            </div>
        </div>
    );
}
