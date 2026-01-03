'use client';

import { useState, useEffect } from 'react';

export function useDevicePolicy() {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkPolicy = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            const mobileCheck = window.innerWidth < 768;

            setOrientation(isPortrait ? 'portrait' : 'landscape');
            setIsMobile(mobileCheck);
        };

        checkPolicy();
        window.addEventListener('resize', checkPolicy);
        return () => window.removeEventListener('resize', checkPolicy);
    }, []);

    return {
        orientation,
        isMobile,
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        canEdit: orientation === 'landscape' || !isMobile,
        showReadOnlyOverlay: orientation === 'portrait' && isMobile
    };
}
