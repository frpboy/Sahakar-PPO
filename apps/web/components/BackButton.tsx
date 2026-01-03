'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
    label?: string;
    href?: string;
    className?: string;
}

export function BackButton({ label = 'Back', href, className = '' }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        >
            <ArrowLeft className="w-4 h-4" />
            {label}
        </button>
    );
}
