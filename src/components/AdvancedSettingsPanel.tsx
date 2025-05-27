
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  Database,
  Users,
  BookOpen,
  BarChart3,
  Wrench,
  Download
} from 'lucide-react';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { Button } from '@/components/ui/Button';

// Schema pour les paramètres d'application
const appSettingsSchema = z.object({
  AppVersion: z.number().min(1),
  DefaultLoanDuration: z.number().min(1).max(365),
  GlobalLimits: z.number().min(1).max(50),
  MaintenanceMode: z.boolean(),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

interface SystemStats {
  totalUsers: number;
  totalBooks: number;
  activeLoans: number;
  overdueBooks: number;
  systemUptime: string;
  lastBackup: string;
}

export default function AdvancedSettingsPanel() {
  const [activeTab, setActiveTab] = useState<'app' | 'system' | 'maintenance'>('app');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [systemStats] = useState<SystemStats>({
    totalUsers: 156,
    totalBooks: 2847,
    activeLoans: 89,
    overdueBooks: 12,
    systemUptime: '15 jours',
    lastBackup: 'Il y a 2 heures'
  });

  const { notifySuccess, notifyError } = useNotificationHelpers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      AppVersion: 1,
      DefaultLoanDuration: 21,
      GlobalLimits: 5,
      MaintenanceMode: false
    }
  });

  const maintenanceMode = watch('MaintenanceMode');

  useEffect(() => {
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await DatabaseInitializer.getAppSettings();
      reset(settings);
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les paramètres');
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AppSettingsFormData) => {
    setIsSaving(true);
    try {
      await DatabaseInitializer.updateAppSettings(data);
      notifySuccess('Paramètres sauvegardés', 'Les modifications ont été appliquées');
    } catch (error) {
      notifyError('Erreur de sauvegarde', 'Impossible de sauvegarder les paramètres');
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  const exportSettings = () => {
    const settings = {
      app: watch(),
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblioteca-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    notifySuccess('Configuration exportée', 'Le fichier a été téléchargé');
  };

  const TabButton = ({ id, label, icon: Icon }: { id: 'app' | 'system' | 'maintenance', label: string, icon: React.ElementType }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const StatCard = ({ icon: Icon, label, value }: {
    icon: React.ElementType,
    label: string,
    value: string | number
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-100">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres Avancés</h1>
                <p className="text-gray-600">Configuration système et maintenance</p>
              </div>
            </div>

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              variant="primary"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation des onglets */}
        <div className="mb-8 flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
          <TabButton id="app" label="Application" icon={Settings} />
          <TabButton id="system" label="Système" icon={Database} />
          <TabButton id="maintenance" label="Maintenance" icon={Wrench} />
        </div>

        <div className="space-y-8">
          {/* Onglet Application */}
          {activeTab === 'app' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres de l&apos;Application</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version de l&apos;application
                  </label>
                  <input
                    {...register('AppVersion', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.AppVersion && (
                    <p className="mt-1 text-sm text-red-600">{errors.AppVersion.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de prêt par défaut (jours)
                  </label>
                  <input
                    {...register('DefaultLoanDuration', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite globale de prêts
                  </label>
                  <input
                    {...register('GlobalLimits', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode maintenance
                  </label>
                  <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg">
                    <input
                      type="checkbox"
                      {...register('MaintenanceMode')}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {maintenanceMode ? 'Activé' : 'Désactivé'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Restreint l&apos;accès aux administrateurs uniquement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Système */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques du Système</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={Users}
                  label="Utilisateurs totaux"
                  value={systemStats.totalUsers}
                />
                <StatCard
                  icon={BookOpen}
                  label="Livres en catalogue"
                  value={systemStats.totalBooks}
                />
                <StatCard
                  icon={BarChart3}
                  label="Prêts actifs"
                  value={systemStats.activeLoans}
                />
                <StatCard
                  icon={AlertCircle}
                  label="Livres en retard"
                  value={systemStats.overdueBooks}
                />
              </div>
            </div>
          )}

          {/* Onglet Maintenance */}
          {activeTab === 'maintenance' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Outils de Maintenance</h2>

              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-medium text-blue-900">Exporter la configuration</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Télécharge un fichier JSON avec tous les paramètres actuels
                  </p>
                  <Button onClick={exportSettings} variant="primary">
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}