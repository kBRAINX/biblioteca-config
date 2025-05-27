// src/components/DevTools.tsx
'use client';

import React, { useState } from 'react';
import { SystemChecker, SystemCheckResult } from '@/lib/debug/systemchecker';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Bug,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<SystemCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Ne s'affiche qu'en développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results = await SystemChecker.runFullDiagnostic();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Bouton flottant en développement */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="sm"
          className="shadow-lg"
        >
          <Bug className="w-4 h-4 mr-2" />
          Dev Tools
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Outils de Développement"
        size="lg"
      >
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="flex space-x-3">
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              variant="primary"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Diagnostic...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 mr-2" />
                  Lancer le diagnostic
                </>
              )}
            </Button>
          </div>

          {/* Résultats du diagnostic */}
          {diagnosticResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Résultats du diagnostic</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {diagnosticResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'success' ? 'bg-green-50 border-green-200' :
                      result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="text-sm font-medium">{result.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variables d'environnement */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Variables d&apos;Environnement</h3>
            <div className="space-y-1 text-sm">
              <div>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Définie' : '❌ Manquante'}</div>
              <div>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Définie' : '❌ Manquante'}</div>
              <div>Cloudinary Cloud Name: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? '✅ Définie' : '❌ Manquante'}</div>
              <div>Cloudinary Upload Preset: {process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ? '✅ Définie' : '❌ Manquante'}</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}