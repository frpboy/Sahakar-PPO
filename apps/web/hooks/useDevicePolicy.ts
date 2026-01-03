'use client';

import { useEffect, useState } from 'react';

export interface DevicePolicy {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    canEdit: boolean;
    canPerformActions: boolean;
    isReadOnly: boolean;
}

export function useDevicePolicy(): DevicePolicy {
    const [policy, setPolicy] = useState<DevicePolicy>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        canEdit: true,
        canPerformActions: true,
        isReadOnly: false,
    });

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const isMobile = width <= 767;
            const isTablet = width >= 768 && width <= 1279;
            const isDesktop = width >= 1280;

            setPolicy({
                isMobile,
                isTablet,
                isDesktop,
                canEdit: !isMobile, // Mobile is read-only
                canPerformActions: !isMobile && !isTablet, // Desktop only for actions
                isReadOnly: isMobile,
            });
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return policy;
}
