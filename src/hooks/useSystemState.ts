
'use client';

import { useState, useEffect } from 'react';
import { DatabaseInitializer } from '@/lib/database/initialization';

export type SystemState = 'loading' | 'needs-initialization' | 'needs-configuration' | 'ready' | 'error';

export function useSystemState() {
  const [state, setState] = useState<SystemState>('loading');
  const [error, setError] = useState<string | null>(null);

  const checkSystemState = async () => {
    try {
      setState('loading');
      setError(null);

      const isInitialized = await DatabaseInitializer.checkIfInitialized();

      if (!isInitialized) {
        setState('needs-initialization');
        return;
      }

      const orgSettings = await DatabaseInitializer.getOrgSettings();
      const isConfigured = orgSettings.Name && orgSettings.Contact.Email;

      if (!isConfigured) {
        setState('needs-configuration');
        return;
      }

      setState('ready');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setState('error');
    }
  };

  useEffect(() => {
    checkSystemState();
  }, []);

  return {
    state,
    error,
    refetch: checkSystemState
  };
}