'use client';

import { useEffect } from 'react';

export interface KeyboardShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[], enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrlKey !== undefined ? shortcut.ctrlKey === e.ctrlKey : true;
                const shiftMatch = shortcut.shiftKey !== undefined ? shortcut.shiftKey === e.shiftKey : true;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
}

// Common shortcuts for the application
export const COMMON_SHORTCUTS: KeyboardShortcutConfig[] = [
    {
        key: 'f',
        ctrlKey: true,
        action: () => {
            const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
            searchInput?.focus();
        },
        description: 'Focus search'
    },
    {
        key: 'Escape',
        action: () => {
            const activeElement = document.activeElement as HTMLElement;
            activeElement?.blur();
        },
        description: 'Cancel/Close'
    },
];
