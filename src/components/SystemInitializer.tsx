'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import InitializationPanel from '@/components/InitializationPanel';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import LoginPage from '@/components/LoginPage';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { useAuth } from '@/hooks/useAuth';

type SystemState =
    | 'loading'
    | 'needs-initialization'
    | 'needs-authentication'
    | 'needs-configuration'
    | 'ready'
    | 'error';

export default function SystemInitializer() {
    const [systemState, setSystemState] = useState<SystemState>('loading');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { notifyError } = useNotificationHelpers();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    useEffect(() => {
        // Attendre que l'authentification soit chargée avant de vérifier l'état
        if (!authLoading) {
            checkSystemState();
        }
    }, [authLoading, isAuthenticated]);

    const checkSystemState = async () => {
        try {
            setError(null);

            // Vérifier si le système est initialisé
            const isInitialized = await DatabaseInitializer.checkIfInitialized();

            if (!isInitialized) {
                setSystemState('needs-initialization');
                return;
            }

            // Si le système est initialisé mais l'utilisateur n'est pas connecté
            if (!isAuthenticated) {
                setSystemState('needs-authentication');
                return;
            }

            // Vérifier si la configuration de base est complète
            const orgSettings = await DatabaseInitializer.getOrgSettings();
            const isConfigured = orgSettings.Name && orgSettings.Contact.Email;

            if (!isConfigured) {
                setSystemState('needs-configuration');
                return;
            }

            // Système prêt
            setSystemState('ready');

        } catch (error) {
            console.error('Error checking system state:', error);
            setError('Erreur lors de la vérification du système');
            notifyError('Erreur système', 'Impossible de vérifier l\'état du système');
            setSystemState('error');
        }
    };

    const handleInitializationComplete = () => {
        // Après l'initialisation, on doit vérifier l'authentification
        setSystemState('needs-authentication');
    };

    const handleLoginSuccess = () => {
        // Après la connexion, vérifier si la configuration est nécessaire
        checkSystemState();
    };

    const handleConfigurationComplete = () => {
        setSystemState('ready');
        router.push('/dashboard');
    };

    // Loading global (authentification + système)
    if (authLoading || systemState === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Vérification du système...</p>
                </div>
            </div>
        );
    }

    // Gestion des erreurs
    if (systemState === 'error' && error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur Système</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={checkSystemState}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // États du système selon la logique mise à jour
    switch (systemState) {
        case 'needs-initialization':
            return <InitializationPanel onComplete={handleInitializationComplete} />;

        case 'needs-authentication':
            return (
                <LoginPage
                    onLoginSuccess={handleLoginSuccess}
                    redirectTo="/dashboard"
                />
            );

        case 'needs-configuration':
            return <ConfigurationPanel onComplete={handleConfigurationComplete} />;

        case 'ready':
            // Système prêt - rediriger vers le dashboard
            router.push('/dashboard');
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Redirection vers le tableau de bord...</p>
                    </div>
                </div>
            );

        default:
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Chargement...</p>
                    </div>
                </div>
            );
    }
}
