'use client';

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
import { AuthHeader } from '@/components/AuthHeader';
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    const StatCard = ({ icon: Icon, label, value, colorScheme = 'primary' }: {
        icon: React.ElementType,
        label: string,
        value: string | number,
        colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    }) => {
        const getColorClasses = () => {
            switch (colorScheme) {
                case 'primary':
                    return 'bg-primary/10 text-primary';
                case 'secondary':
                    return 'bg-secondary/10 text-secondary';
                case 'success':
                    return 'bg-green-100 text-green-600';
                case 'warning':
                    return 'bg-yellow-100 text-yellow-600';
                case 'danger':
                    return 'bg-red-100 text-red-600';
                default:
                    return 'bg-primary/10 text-primary';
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${getColorClasses()}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600">Chargement des paramètres...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec authentification */}
            <AuthHeader
                title="Paramètres Avancés"
                subtitle="Configuration système et maintenance"
                icon={<Wrench className="w-6 h-6 text-white" />}
            >
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
            </AuthHeader>

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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    />
                                    {errors.DefaultLoanDuration && (
                                        <p className="mt-1 text-sm text-red-600">{errors.DefaultLoanDuration.message}</p>
                                    )}
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    />
                                    {errors.GlobalLimits && (
                                        <p className="mt-1 text-sm text-red-600">{errors.GlobalLimits.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mode maintenance
                                    </label>
                                    <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:border-primary/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('MaintenanceMode')}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {maintenanceMode ? (
                                                    <span className="text-orange-600">Activé</span>
                                                ) : (
                                                    <span className="text-green-600">Désactivé</span>
                                                )}
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
                                    colorScheme="primary"
                                />
                                <StatCard
                                    icon={BookOpen}
                                    label="Livres en catalogue"
                                    value={systemStats.totalBooks}
                                    colorScheme="secondary"
                                />
                                <StatCard
                                    icon={BarChart3}
                                    label="Prêts actifs"
                                    value={systemStats.activeLoans}
                                    colorScheme="success"
                                />
                                <StatCard
                                    icon={AlertCircle}
                                    label="Livres en retard"
                                    value={systemStats.overdueBooks}
                                    colorScheme="warning"
                                />
                            </div>

                            {/* Informations système supplémentaires */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">État du système</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Temps de fonctionnement :</span>
                                            <span className="font-medium text-primary">{systemStats.systemUptime}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Dernière sauvegarde :</span>
                                            <span className="font-medium text-green-600">{systemStats.lastBackup}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Taux d&apos;utilisation :</span>
                                            <span className="font-medium text-secondary">87%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Espace disque :</span>
                                            <span className="font-medium text-green-600">2.4 GB libres</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Onglet Maintenance */}
                    {activeTab === 'maintenance' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Outils de Maintenance</h2>

                            <div className="space-y-6">
                                {/* Export de configuration */}
                                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-primary rounded-lg">
                                            <Download className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Exporter la configuration</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Télécharge un fichier JSON avec tous les paramètres actuels du système.
                                    </p>
                                    <Button
                                        onClick={exportSettings}
                                        variant="primary"
                                        className="hover:bg-primary/90 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exporter la configuration
                                    </Button>
                                </div>

                                {/* Sauvegarde système */}
                                <div className="p-6 bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/20 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-secondary rounded-lg">
                                            <Database className="w-6 h-6 text-secondary-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Sauvegarde de la base de données</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Créer une sauvegarde complète de toutes les données du système.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        className="hover:bg-secondary/90 transition-colors"
                                        onClick={() => notifySuccess('Sauvegarde', 'Fonctionnalité à venir')}
                                    >
                                        <Database className="w-4 h-4 mr-2" />
                                        Créer une sauvegarde
                                    </Button>
                                </div>

                                {/* Nettoyage système */}
                                <div className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-yellow-500 rounded-lg">
                                            <RefreshCw className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Nettoyage système</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Supprimer les fichiers temporaires et optimiser les performances.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
                                        onClick={() => notifySuccess('Nettoyage', 'Fonctionnalité à venir')}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Nettoyer le système
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
