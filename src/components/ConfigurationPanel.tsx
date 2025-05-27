// src/components/ConfigurationPanel.tsx
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
  Loader2
} from 'lucide-react';
import { CloudinaryUpload } from '@/components/ui/CloudinaryUpload';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
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
    Primary: z.string().min(1, 'La couleur primaire est requise'),
    Secondary: z.string().min(1, 'La couleur secondaire est requise'),
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
  const { notifySuccess, notifyError } = useNotificationHelpers();

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

  useEffect(() => {
    loadCurrentSettings();
  }, []);

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

  const TabButton = ({ id, label, icon: Icon }: { id: 'general' | 'contact' | 'hours' | 'rules' | 'theme', label: string, icon: React.ElementType }) => (
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuration de l&apos;Organisation</h1>
                <p className="text-gray-600">Configurez les paramètres de votre bibliothèque</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Onglet Thème */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personnalisation du Thème</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Primaire
                    </label>
                    <div className="flex space-x-3">
                      <input
                        {...register('Theme.Primary')}
                        type="color"
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        {...register('Theme.Primary')}
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#3B82F6"
                      />
                    </div>
                    {errors.Theme?.Primary && (
                      <p className="mt-1 text-sm text-red-600">{errors.Theme.Primary.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Secondaire
                    </label>
                    <div className="flex space-x-3">
                      <input
                        {...register('Theme.Secondary')}
                        type="color"
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        {...register('Theme.Secondary')}
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#8B5CF6"
                      />
                    </div>
                    {errors.Theme?.Secondary && (
                      <p className="mt-1 text-sm text-red-600">{errors.Theme.Secondary.message}</p>
                    )}
                  </div>
                </div>

                {/* Aperçu du thème */}
                <div className="mt-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu du thème</h3>
                  <div className="space-y-4">
                    <div
                      className="p-4 rounded-lg text-white"
                      style={{ backgroundColor: watch('Theme.Primary') }}
                    >
                      <h4 className="font-semibold">Couleur Primaire</h4>
                      <p className="text-sm opacity-90">Utilisée pour les boutons principaux et les liens</p>
                    </div>
                    <div
                      className="p-4 rounded-lg text-white"
                      style={{ backgroundColor: watch('Theme.Secondary') }}
                    >
                      <h4 className="font-semibold">Couleur Secondaire</h4>
                      <p className="text-sm opacity-90">Utilisée pour les accents et les éléments décoratifs</p>
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
}