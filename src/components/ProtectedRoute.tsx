'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    requireRole?: 'super_admin' | 'admin';
}

export default function ProtectedRoute({
                                   children,
                                   redirectTo = '/login',
                                   requireRole
                               }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    // Affichage de chargement pendant la vérification
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    // Redirection si non authentifié
    if (!isAuthenticated || !user) {
        router.push(redirectTo);
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Redirection...</p>
                </div>
            </div>
        );
    }

    // Vérification du rôle si requis
    if (requireRole && user.role !== requireRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
                    <p className="text-gray-600 mb-4">
                        Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
                    </p>
                    <p className="text-sm text-gray-500">
                        Rôle requis : {requireRole} | Votre rôle : {user.role}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    // Afficher le contenu protégé
    return <>{children}</>;
}
