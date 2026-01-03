'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../src/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PROCUREMENT_HEAD' | 'PURCHASE_STAFF' | 'BILLING_HEAD' | 'BILLING_STAFF';

interface UserRoleContextType {
    role: UserRole | null;
    currentUser: User | null;
    isLoading: boolean;
    can: (action: string) => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const PERMISSIONS: Record<UserRole, string[]> = {
    SUPER_ADMIN: ['*'],
    ADMIN: ['*'],
    PROCUREMENT_HEAD: [
        'view_ppo_input', 'upload_ppo', 'validate_ppo', 'process_orders',
        'view_pending', 'edit_pending', 'use_allocator', 'change_supplier', 'move_to_rep',
        'view_rep', 'edit_rep', 'return_to_pending',
        'generate_slips', 'regenerate_slips'
    ],
    PURCHASE_STAFF: [
        'view_pending', 'view_rep'
    ],
    BILLING_HEAD: [
        'view_slips', 'update_status', 'end_duty', 'override_status'
    ],
    BILLING_STAFF: [
        'view_slips', 'update_status', 'end_duty'
    ]
};

export function UserRoleProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // In production, fetch role from backend or ID token claims
                // For now, we'll try to get it from the backend if available
                try {
                    const idToken = await user.getIdToken();
                    const res = await fetch('http://localhost:8080/auth/me', {
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setRole(data.role as UserRole);
                    }
                } catch (e) {
                    console.error('Failed to fetch user role', e);
                }
            } else {
                setRole(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const can = (action: string) => {
        if (!role) return false;
        const perms = PERMISSIONS[role];
        if (perms.includes('*')) return true;
        return perms.includes(action);
    };

    return (
        <UserRoleContext.Provider value={{
            role,
            currentUser,
            isLoading,
            can
        }}>
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRole() {
    const context = useContext(UserRoleContext);
    if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
    return context;
}
