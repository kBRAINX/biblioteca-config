// src/components/InitializationPanel.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Database,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Book,
  Shield,
  Sparkles
} from 'lucide-react';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';

// Schema de validation pour l'administrateur
const adminSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  confirmEmail: z.string().email('Email invalide'),
}).refine(data => data.email === data.confirmEmail, {
  message: 'Les emails ne correspondent pas',
  path: ['confirmEmail'],
});

type AdminFormData = z.infer<typeof adminSchema>;

type InitializationStep = 'check' | 'admin-setup' | 'database-init' | 'configuration' | 'complete';

interface InitializationPanelProps {
  onComplete?: () => void;
}

export default function InitializationPanel({ onComplete }: InitializationPanelProps) {
  const [currentStep, setCurrentStep] = useState<InitializationStep>('check');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminFormData | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema)
  });

  // Vérifier si le système est déjà initialisé
  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    setIsLoading(true);
    try {
      const isInitialized = await DatabaseInitializer.checkIfInitialized();
      if (isInitialized) {
        setCurrentStep('configuration');
        onComplete?.();
      } else {
        setCurrentStep('admin-setup');
      }
    } catch (error) {
      setError('Erreur lors de la vérification du statut d\'initialisation');
      setCurrentStep('admin-setup');
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSetup = async (data: AdminFormData) => {
    setError(null);
    setAdminData(data);
    setCurrentStep('database-init');

    // Lancer l'initialisation automatiquement
    await initializeDatabase(data);
  };

  const initializeDatabase = async (data: AdminFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await DatabaseInitializer.initializeDatabase({
        name: data.name,
        email: data.email
      });

      notifySuccess('Initialisation réussie', 'La base de données a été configurée avec succès');

      setTimeout(() => {
        setCurrentStep('configuration');
        setIsLoading(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      notifyError('Erreur d\'initialisation', 'Impossible d\'initialiser la base de données');
      setError('Erreur lors de l\'initialisation de la base de données');
      setIsLoading(false);
      setCurrentStep('admin-setup');
      console.log(error);
    }
  };

  const handleConfigurationComplete = () => {
    setCurrentStep('complete');
    onComplete?.();
  };

  // Composant d'étape avec indicateur de progression
  const StepIndicator = ({ step, isActive, isCompleted }: {
    step: string;
    isActive: boolean;
    isCompleted: boolean;
  }) => (
    <div className={`flex items-center space-x-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
      {isCompleted ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-blue-600 bg-blue-100' : 'border-gray-300'} flex items-center justify-center`}>
          {isActive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
        </div>
      )}
      <span className="text-sm font-medium">{step}</span>
    </div>
  );

  if (currentStep === 'check') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification du système...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuration du Système de Bibliothèque</h1>
              <p className="text-gray-600">Initialisation et configuration de votre plateforme</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Indicateurs de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <StepIndicator
              step="Administrateur"
              isActive={currentStep === 'admin-setup'}
              isCompleted={['database-init', 'configuration', 'complete'].includes(currentStep)}
            />
            <div className="flex-1 h-px bg-gray-300 mx-4" />
            <StepIndicator
              step="Base de données"
              isActive={currentStep === 'database-init'}
              isCompleted={['configuration', 'complete'].includes(currentStep)}
            />
            <div className="flex-1 h-px bg-gray-300 mx-4" />
            <StepIndicator
              step="Configuration"
              isActive={currentStep === 'configuration'}
              isCompleted={currentStep === 'complete'}
            />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Étape 1: Configuration Administrateur */}
          {currentStep === 'admin-setup' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration de l&apos;Administrateur</h2>
                <p className="text-gray-600">Créez le compte administrateur principal du système</p>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Votre nom complet"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="admin@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer l&apos;email
                  </label>
                  <input
                    {...register('confirmEmail')}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Confirmez votre email"
                  />
                  {errors.confirmEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmEmail.message}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit(handleAdminSetup)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Configuration...</span>
                    </div>
                  ) : (
                    'Créer l\'administrateur'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Initialisation Base de données */}
          {currentStep === 'database-init' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialisation de la Base de Données</h2>
              <p className="text-gray-600 mb-8">Configuration des collections et documents...</p>

              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">Création des collections</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">Configuration des paramètres</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">Finalisation...</span>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Configuration */}
          {currentStep === 'configuration' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration du Système</h2>
                <p className="text-gray-600">Configurez les paramètres de votre organisation</p>
              </div>

              <div className="text-center">
                <button
                  onClick={handleConfigurationComplete}
                  className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Accéder à la Configuration
                </button>
              </div>
            </div>
          )}

          {/* Étape 4: Terminé */}
          {currentStep === 'complete' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Terminée !</h2>
              <p className="text-gray-600 mb-8">Votre système de bibliothèque est prêt à être utilisé</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-green-800 mb-2">Système initialisé avec succès</h3>
                <p className="text-sm text-green-700">
                  Toutes les collections ont été créées et les paramètres de base configurés.
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-6 bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Accéder au Tableau de Bord
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}