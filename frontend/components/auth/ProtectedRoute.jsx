'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }

        if (!isLoading && user && roles.length > 0 && !roles.includes(user.role)) {
            router.push('/unauthorized');
        }
    }, [user, isLoading, router, roles]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;
    if (roles.length > 0 && !roles.includes(user.role)) return null;

    return children;
};
