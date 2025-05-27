
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import InitializationPanel from '@/components/InitializationPanel';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';

type SystemState = 'loading' | 'needs-initialization' | 'needs-configuration' | 'ready';

export default function SystemInitializer() {
  const [systemState, setSystemState] = useState<SystemState>('loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { notifyError } = useNotificationHelpers();

  useEffect(() => {
    checkSystemState();
  }, []);

  const checkSystemState = async () => {
    try {
      setError(null);

      // Vérifier si le système est initialisé
      const isInitialized = await DatabaseInitializer.checkIfInitialized();

      if (!isInitialized) {
        setSystemState('needs-initialization');
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
      setSystemState('needs-initialization');
    }
  };

  const handleInitializationComplete = () => {
    setSystemState('needs-configuration');
  };

  const handleConfigurationComplete = () => {
    setSystemState('ready');
    router.push('/dashboard');
  };

  if (systemState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification du système...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  if (systemState === 'needs-initialization') {
    return <InitializationPanel onComplete={handleInitializationComplete} />;
  }

  if (systemState === 'needs-configuration') {
    return <ConfigurationPanel onComplete={handleConfigurationComplete} />;
  }

  // Système prêt - rediriger vers le dashboard
  router.push('/dashboard');
  return null;
}