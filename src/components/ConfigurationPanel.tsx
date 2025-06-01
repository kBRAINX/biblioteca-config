'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Building,
    Mail,
    Phone,
    Clock,
    Palette,
    Save,
    AlertCircle,
    CheckCircle,
    Facebook,
    Instagram,
    MessageCircle,
    Settings,
    Loader2,
    RefreshCw,
    Eye
} from 'lucide-react';
import { CloudinaryUpload } from '@/components/ui/CloudinaryUpload';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/themeContext';
import Image from 'next/image';

// Schema de validation pour les paramètres organisationnels
const orgSettingsSchema = z.object({
    Name: z.string().min(1, 'Le nom de l\'organisation est requis'),
    Address: z.string().min(1, 'L\'adresse est requise'),
    Contact: z.object({
        Email: z.string().email('Email invalide'),
        Phone: z.string().min(1, 'Le téléphone est requis'),
        WhatsApp: z.string().optional(),
        Facebook: z.string().optional(),
        Instagram: z.string().optional(),
    }),
    MaximumSimultaneousLoans: z.number().min(1, 'Le nombre minimum est 1').max(10, 'Le nombre maximum est 10'),
    Theme: z.object({
        Primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide'),
        Secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide'),
    }),
    OpeningHours: z.object({
        Monday: z.string(),
        Tuesday: z.string(),
        Wednesday: z.string(),
        Thursday: z.string(),
        Friday: z.string(),
        Saturday: z.string(),
        Sunday: z.string(),
    }),
    LateReturnPenalties: z.array(z.string()),
    SpecificBorrowingRules: z.array(z.string()),
});

type OrgSettingsFormData = z.infer<typeof orgSettingsSchema>;

interface ConfigurationPanelProps {
    onComplete?: () => void;
}

export default function ConfigurationPanel({ onComplete }: ConfigurationPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [logo, setLogo] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'hours' | 'rules' | 'theme'>('general');
    const [previewMode, setPreviewMode] = useState(false);
    const { notifySuccess, notifyError } = useNotificationHelpers();
    const { applyTheme, colors: currentThemeColors } = useTheme();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm<OrgSettingsFormData>({
        resolver: zodResolver(orgSettingsSchema),
        defaultValues: {
            MaximumSimultaneousLoans: 3,
            LateReturnPenalties: [''],
            SpecificBorrowingRules: [''],
            Theme: {
                Primary: '#3B82F6',
                Secondary: '#8B5CF6'
            },
            OpeningHours: {
                Monday: JSON.stringify({open: "08:00", close: "18:00"}),
                Tuesday: JSON.stringify({open: "08:00", close: "18:00"}),
                Wednesday: JSON.stringify({open: "08:00", close: "18:00"}),
                Thursday: JSON.stringify({open: "08:00", close: "18:00"}),
                Friday: JSON.stringify({open: "08:00", close: "18:00"}),
                Saturday: JSON.stringify({open: "10:00", close: "18:00"}),
                Sunday: JSON.stringify({open: "closed", close: "closed"}),
            }
        }
    });

    const penalties = watch('LateReturnPenalties');
    const rules = watch('SpecificBorrowingRules');
    const primaryColor = watch('Theme.Primary');
    const secondaryColor = watch('Theme.Secondary');

    useEffect(() => {
        loadCurrentSettings();
    }, []);

    // Appliquer le thème en temps réel lors des changements
    useEffect(() => {
        if (primaryColor && secondaryColor && previewMode) {
            applyTheme({
                primary: primaryColor,
                secondary: secondaryColor
            });
        }
    }, [primaryColor, secondaryColor, previewMode, applyTheme]);

    const loadCurrentSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await DatabaseInitializer.getOrgSettings();
            reset(settings);
            setLogo(settings.Logo);
        } catch (error) {
            notifyError('Erreur', 'Impossible de charger les paramètres');
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: OrgSettingsFormData) => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const updatedData = {
                ...data,
                Contact: {
                    ...data.Contact,
                    Facebook: data.Contact.Facebook || '',
                    Instagram: data.Contact.Instagram || '',
                    WhatsApp: data.Contact.WhatsApp || '',
                },
                Logo: logo,
            };

            await DatabaseInitializer.updateOrgSettings(updatedData);

            // Appliquer le thème définitivement
            applyTheme({
                primary: data.Theme.Primary,
                secondary: data.Theme.Secondary
            });

            notifySuccess('Paramètres sauvegardés', 'Les modifications ont été appliquées avec succès');
            setSuccess('Paramètres sauvegardés avec succès !');
            setTimeout(() => setSuccess(null), 3000);
            onComplete?.();
        } catch (error: unknown) {
            notifyError('Erreur de sauvegarde', 'Impossible de sauvegarder les paramètres');
            setError('Erreur lors de la sauvegarde');
            console.log(error);
        } finally {
            setIsSaving(false);
        }
    };

    const addPenalty = () => {
        setValue('LateReturnPenalties', [...penalties, '']);
    };

    const removePenalty = (index: number) => {
        setValue('LateReturnPenalties', penalties.filter((_, i) => i !== index));
    };

    const addRule = () => {
        setValue('SpecificBorrowingRules', [...rules, '']);
    };

    const removeRule = (index: number) => {
        setValue('SpecificBorrowingRules', rules.filter((_, i) => i !== index));
    };

    const handleColorChange = (type: 'Primary' | 'Secondary', color: string) => {
        // Valider le format hex
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(color)) {
            setValue(`Theme.${type}`, color);
        }
    };

    const resetThemeToOriginal = () => {
        applyTheme(currentThemeColors);
        setPreviewMode(false);
    };

    const generateRandomColors = () => {
        const getRandomColor = () => {
            const colors = [
                '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B',
                '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        };

        const primary = getRandomColor();
        let secondary = getRandomColor();
        while (secondary === primary) {
            secondary = getRandomColor();
        }

        setValue('Theme.Primary', primary);
        setValue('Theme.Secondary', secondary);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: 'general' | 'contact' | 'hours' | 'rules' | 'theme', label: string, icon: React.ElementType }) => (
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

    const TimeInput = ({ day, register }: { day: string, register: unknown }) => {
        if (typeof register !== 'function' || !register(day)?.onChange) {
            throw new Error('Invalid register function');
        }
        const [hours, setHours] = useState({ open: '08:00', close: '18:00' });
        const [isClosed, setIsClosed] = useState(false);

        const handleTimeChange = (type: 'open' | 'close', value: string) => {
            const newHours = { ...hours, [type]: value };
            setHours(newHours);
            register(day).onChange({
                target: { value: isClosed ? JSON.stringify({open: 'closed', close: 'closed'}) : JSON.stringify(newHours) }
            });
        };

        return (
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => {
                            setIsClosed(e.target.checked);
                            register(day).onChange({
                                target: { value: e.target.checked ? JSON.stringify({open: 'closed', close: 'closed'}) : JSON.stringify(hours) }
                            });
                        }}
                        className="rounded"
                    />
                    <span className="text-sm">Fermé</span>
                </div>
                {!isClosed && (
                    <div className="flex space-x-2">
                        <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleTimeChange('open', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                        <span className="py-1">-</span>
                        <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleTimeChange('close', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Chargement des paramètres...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec authentification */}
            <AuthHeader
                title="Configuration de l'Organisation"
                subtitle="Configurez les paramètres de votre bibliothèque"
                icon={<Settings className="w-6 h-6 text-white" />}
            >
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    variant="primary"
                    size="md"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                {/* Messages de statut */}
                {error && (
                    <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Navigation des onglets */}
                <div className="mb-8 flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <TabButton id="general" label="Général" icon={Building} />
                    <TabButton id="contact" label="Contact" icon={Mail} />
                    <TabButton id="hours" label="Horaires" icon={Clock} />
                    <TabButton id="rules" label="Règles" icon={Settings} />
                    <TabButton id="theme" label="Thème" icon={Palette} />
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8">
                        {/* Onglet Général */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations Générales</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom de l&apos;organisation
                                        </label>
                                        <input
                                            {...register('Name')}
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Bibliothèque Centrale"
                                        />
                                        {errors.Name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.Name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prêts simultanés maximum
                                        </label>
                                        <input
                                            {...register('MaximumSimultaneousLoans', { valueAsNumber: true })}
                                            type="number"
                                            min="1"
                                            max="10"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                        {errors.MaximumSimultaneousLoans && (
                                            <p className="mt-1 text-sm text-red-600">{errors.MaximumSimultaneousLoans.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Adresse complète
                                    </label>
                                    <textarea
                                        {...register('Address')}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="123 Rue de la Bibliothèque, Ville, Code Postal"
                                    />
                                    {errors.Address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.Address.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Logo de l&apos;organisation
                                    </label>
                                    <CloudinaryUpload
                                        onUploadComplete={(result) => setLogo(result.secure_url)}
                                        acceptedFileTypes={['image/*']}
                                        options={{ folder: 'biblioteca/logos' }}
                                        placeholder="Téléchargez le logo de votre organisation"
                                    />
                                    {logo && (
                                        <div className="mt-4">
                                            {logo && (
                                                <div className="mt-4">
                                                    <Image src={logo} alt="Logo" width={24} height={24} className="object-contain border rounded-lg" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglet Contact */}
                        {activeTab === 'contact' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations de Contact</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Email
                                        </label>
                                        <input
                                            {...register('Contact.Email')}
                                            type="email"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="contact@bibliotheque.com"
                                        />
                                        {errors.Contact?.Email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.Contact.Email.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Phone className="w-4 h-4 inline mr-1" />
                                            Téléphone
                                        </label>
                                        <input
                                            {...register('Contact.Phone')}
                                            type="tel"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="+237 123 456 789"
                                        />
                                        {errors.Contact?.Phone && (
                                            <p className="mt-1 text-sm text-red-600">{errors.Contact.Phone.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MessageCircle className="w-4 h-4 inline mr-1" />
                                            WhatsApp
                                        </label>
                                        <input
                                            {...register('Contact.WhatsApp')}
                                            type="tel"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="+237 123 456 789"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Facebook className="w-4 h-4 inline mr-1" />
                                            Facebook
                                        </label>
                                        <input
                                            {...register('Contact.Facebook')}
                                            type="url"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="https://facebook.com/votrepage"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Instagram className="w-4 h-4 inline mr-1" />
                                            Instagram
                                        </label>
                                        <input
                                            {...register('Contact.Instagram')}
                                            type="url"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="https://instagram.com/votrepage"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Onglet Horaires */}
                        {activeTab === 'hours' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Horaires d&apos;Ouverture</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                                            <h3 className="font-medium text-gray-900 mb-3">
                                                {day === 'Monday' ? 'Lundi' :
                                                    day === 'Tuesday' ? 'Mardi' :
                                                        day === 'Wednesday' ? 'Mercredi' :
                                                            day === 'Thursday' ? 'Jeudi' :
                                                                day === 'Friday' ? 'Vendredi' :
                                                                    day === 'Saturday' ? 'Samedi' : 'Dimanche'}
                                            </h3>
                                            <TimeInput day={`OpeningHours.${day}`} register={register} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Onglet Règles */}
                        {activeTab === 'rules' && (
                            <div className="space-y-8">
                                <h2 className="text-xl font-semibold text-gray-900">Règles et Pénalités</h2>

                                {/* Pénalités de retard */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Pénalités de retard</h3>
                                        <button
                                            type="button"
                                            onClick={addPenalty}
                                            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {penalties.map((penalty, index) => (
                                            <div key={index} className="flex space-x-2">
                                                <input
                                                    {...register(`LateReturnPenalties.${index}`)}
                                                    type="text"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                    placeholder="Ex: 100 FCFA par jour de retard"
                                                />
                                                {penalties.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePenalty(index)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Règles spécifiques */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Règles spécifiques d&apos;emprunt</h3>
                                        <button
                                            type="button"
                                            onClick={addRule}
                                            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {rules.map((rule, index) => (
                                            <div key={index} className="flex space-x-2">
                                                <input
                                                    {...register(`SpecificBorrowingRules.${index}`)}
                                                    type="text"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                    placeholder="Ex: Les étudiants peuvent emprunter maximum 5 livres"
                                                />
                                                {rules.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRule(index)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Onglet Thème - SECTION AMÉLIORÉE */}
                        {activeTab === 'theme' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Personnalisation du Thème</h2>
                                    <div className="flex space-x-3">
                                        <Button
                                            type="button"
                                            onClick={() => setPreviewMode(!previewMode)}
                                            variant={previewMode ? "destructive" : "secondary"}
                                            size="sm"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            {previewMode ? 'Arrêter l\'aperçu' : 'Aperçu en temps réel'}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={generateRandomColors}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Couleurs aléatoires
                                        </Button>
                                        {previewMode && (
                                            <Button
                                                type="button"
                                                onClick={resetThemeToOriginal}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Réinitialiser
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {previewMode && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="w-5 h-5 text-blue-600" />
                                            <span className="text-blue-800 font-medium">Mode aperçu activé</span>
                                        </div>
                                        <p className="text-blue-700 text-sm mt-1">
                                            Les modifications de couleur sont appliquées en temps réel. N&apos;oubliez pas de sauvegarder pour conserver les changements.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Configuration des couleurs */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Couleur Primaire
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex space-x-3">
                                                    <input
                                                        type="color"
                                                        value={primaryColor}
                                                        onChange={(e) => handleColorChange('Primary', e.target.value)}
                                                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                                                    />
                                                    <input
                                                        {...register('Theme.Primary')}
                                                        type="text"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                                                        placeholder="#3B82F6"
                                                        onChange={(e) => handleColorChange('Primary', e.target.value)}
                                                    />
                                                </div>
                                                {errors.Theme?.Primary && (
                                                    <p className="text-sm text-red-600">{errors.Theme.Primary.message}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Utilisée pour les boutons principaux, les liens et les éléments d&apos;action
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Couleur Secondaire
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex space-x-3">
                                                    <input
                                                        type="color"
                                                        value={secondaryColor}
                                                        onChange={(e) => handleColorChange('Secondary', e.target.value)}
                                                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                                                    />
                                                    <input
                                                        {...register('Theme.Secondary')}
                                                        type="text"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                                                        placeholder="#8B5CF6"
                                                        onChange={(e) => handleColorChange('Secondary', e.target.value)}
                                                    />
                                                </div>
                                                {errors.Theme?.Secondary && (
                                                    <p className="text-sm text-red-600">{errors.Theme.Secondary.message}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Utilisée pour les accents, les éléments décoratifs et les variations
                                                </p>
                                            </div>
                                        </div>

                                        {/* Couleurs prédéfinies */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Thèmes prédéfinis
                                            </label>
                                            <div className="grid grid-cols-5 gap-3">
                                                {[
                                                    { primary: '#3B82F6', secondary: '#8B5CF6', name: 'Bleu/Violet' },
                                                    { primary: '#EF4444', secondary: '#F97316', name: 'Rouge/Orange' },
                                                    { primary: '#10B981', secondary: '#14B8A6', name: 'Vert/Teal' },
                                                    { primary: '#F59E0B', secondary: '#EAB308', name: 'Jaune/Ambre' },
                                                    { primary: '#EC4899', secondary: '#A855F7', name: 'Rose/Violet' }
                                                ].map((theme, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => {
                                                            setValue('Theme.Primary', theme.primary);
                                                            setValue('Theme.Secondary', theme.secondary);
                                                        }}
                                                        className="group relative aspect-square rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                                                        title={theme.name}
                                                    >
                                                        <div className="absolute inset-1 rounded-md overflow-hidden">
                                                            <div
                                                                className="h-1/2 w-full"
                                                                style={{ backgroundColor: theme.primary }}
                                                            />
                                                            <div
                                                                className="h-1/2 w-full"
                                                                style={{ backgroundColor: theme.secondary }}
                                                            />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aperçu du thème */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-medium text-gray-900">Aperçu du thème</h3>

                                        {/* Aperçu des couleurs */}
                                        <div className="space-y-4">
                                            <div
                                                className="p-6 rounded-lg text-white shadow-md"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                <h4 className="font-semibold text-lg mb-2">Couleur Primaire</h4>
                                                <p className="text-sm opacity-90 mb-3">
                                                    Cette couleur est utilisée pour les boutons principaux, les liens actifs et les éléments d&apos;action.
                                                </p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 bg-white/20 rounded text-sm font-medium hover:bg-white/30 transition-colors"
                                                    >
                                                        Bouton principal
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 border border-white/30 rounded text-sm font-medium hover:bg-white/10 transition-colors"
                                                    >
                                                        Bouton secondaire
                                                    </button>
                                                </div>
                                            </div>

                                            <div
                                                className="p-6 rounded-lg text-white shadow-md"
                                                style={{ backgroundColor: secondaryColor }}
                                            >
                                                <h4 className="font-semibold text-lg mb-2">Couleur Secondaire</h4>
                                                <p className="text-sm opacity-90 mb-3">
                                                    Cette couleur est utilisée pour les accents, les badges et les éléments décoratifs.
                                                </p>
                                                <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                            Badge
                          </span>
                                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                            Accent
                          </span>
                                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                            Notification
                          </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Aperçu de l'interface */}
                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <h4 className="font-medium text-gray-900 mb-3">Aperçu de l&apos;interface</h4>
                                            <div className="space-y-3">
                                                {/* Header simulé */}
                                                <div className="flex items-center justify-between p-3 bg-white rounded border">
                                                    <div className="flex items-center space-x-2">
                                                        <div
                                                            className="w-8 h-8 rounded"
                                                            style={{ backgroundColor: primaryColor }}
                                                        />
                                                        <span className="font-medium">Bibliothèque</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 rounded text-sm font-medium"
                                                        style={{
                                                            backgroundColor: primaryColor,
                                                            color: 'white'
                                                        }}
                                                    >
                                                        Connexion
                                                    </button>
                                                </div>

                                                {/* Navigation simulée */}
                                                <div className="flex space-x-2">
                                                    {['Accueil', 'Livres', 'Utilisateurs'].map((item, index) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            className="px-3 py-2 rounded text-sm font-medium"
                                                            style={{
                                                                backgroundColor: index === 0 ? primaryColor : 'transparent',
                                                                color: index === 0 ? 'white' : primaryColor,
                                                                border: `1px solid ${primaryColor}`
                                                            }}
                                                        >
                                                            {item}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Card simulée */}
                                                <div className="p-4 bg-white rounded border">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="font-medium">Statistiques</h5>
                                                        <span
                                                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                                            style={{ backgroundColor: secondaryColor }}
                                                        >
                              Nouveau
                            </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="text-center p-2 rounded" style={{ backgroundColor: `${primaryColor}10` }}>
                                                            <div className="text-lg font-bold" style={{ color: primaryColor }}>142</div>
                                                            <div className="text-xs text-gray-600">Livres</div>
                                                        </div>
                                                        <div className="text-center p-2 rounded" style={{ backgroundColor: `${secondaryColor}10` }}>
                                                            <div className="text-lg font-bold" style={{ color: secondaryColor }}>89</div>
                                                            <div className="text-xs text-gray-600">Utilisateurs</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informations sur les couleurs */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Informations techniques</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Couleur primaire:</span>
                                                    <span className="font-mono">{primaryColor}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Couleur secondaire:</span>
                                                    <span className="font-mono">{secondaryColor}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Contraste:</span>
                                                    <span className={`font-medium ${
                                                        getColorContrast(primaryColor) > 4.5 ? 'text-green-600' : 'text-orange-600'
                                                    }`}>
                            {getColorContrast(primaryColor) > 4.5 ? 'Bon' : 'Moyen'}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Fonction utilitaire pour calculer le contraste
    function getColorContrast(hex: string): number {
        // Conversion hex vers RGB
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        // Calcul de la luminance relative
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Calcul du contraste avec le blanc
        return (1 + 0.05) / (luminance + 0.05);
    }
}
