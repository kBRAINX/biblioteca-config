'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Mail,
    Lock,
    Save,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2,
    Shield,
    Key,
    UserCircle,
} from 'lucide-react';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Schemas de validation
const profileSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string().min(6, 'Confirmation requise'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
});

const emailSchema = z.object({
    newEmail: z.string().email('Email invalide'),
    currentPassword: z.string().min(1, 'Mot de passe requis pour confirmer'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

export default function UserProfilePage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showEmailPassword, setShowEmailPassword] = useState(false);

    const { user } = useAuth();
    const { notifySuccess, notifyError } = useNotificationHelpers();

    // Formulaire profil
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        }
    });

    function isFirebaseError(error: unknown): error is { code: string } {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            true
        );
    }

    // Formulaire mot de passe
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    // Formulaire email
    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name,
                email: user.email,
            });
        }
    }, [user, profileForm]);

    // Mise à jour du profil
    const onUpdateProfile = async (data: ProfileFormData) => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Mettre à jour dans Firestore
            await updateDoc(doc(db, 'admin', user.uid), {
                name: data.name,
                updatedAt: new Date()
            });

            notifySuccess('Profil mis à jour', 'Vos informations ont été sauvegardées');
        } catch (error) {
            console.error('Error updating profile:', error);
            notifyError('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setIsLoading(false);
        }
    };

    // Changement de mot de passe
    const onChangePassword = async (data: PasswordFormData) => {
        if (!auth.currentUser || !user) return;

        setIsLoading(true);
        try {
            // Réauthentification
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Mise à jour du mot de passe
            await updatePassword(auth.currentUser, data.newPassword);

            // Mettre à jour la date de modification
            await updateDoc(doc(db, 'admin', user.uid), {
                passwordUpdatedAt: new Date()
            });

            notifySuccess('Mot de passe modifié', 'Votre mot de passe a été mis à jour');
            passwordForm.reset();
        } catch (error: unknown) {
            console.error('Error changing password:', error);

            if (isFirebaseError(error)) {
                if (error.code === 'auth/wrong-password') {
                    notifyError('Erreur', 'Mot de passe actuel incorrect');
                } else {
                    notifyError('Erreur', 'Impossible de modifier le mot de passe');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Changement d'email
    const onChangeEmail = async (data: EmailFormData) => {
        if (!auth.currentUser || !user) return;

        setIsLoading(true);
        try {
            // Réauthentification
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Mise à jour de l'email
            await updateEmail(auth.currentUser, data.newEmail);

            // Mettre à jour dans Firestore
            await updateDoc(doc(db, 'admin', user.uid), {
                email: data.newEmail,
                emailUpdatedAt: new Date()
            });

            notifySuccess('Email modifié', 'Votre adresse email a été mise à jour');
            emailForm.reset();
        } catch (error: unknown) {
            console.error('Error changing email:', error);

            if (isFirebaseError(error)) {
                if (error.code === 'auth/wrong-password') {
                    notifyError('Erreur', 'Mot de passe incorrect');
                } else if (error.code === 'auth/email-already-in-use') {
                    notifyError('Erreur', 'Cette adresse email est déjà utilisée');
                } else {
                    notifyError('Erreur', 'Impossible de modifier l\'email');
                }
            } else {
                notifyError('Erreur', 'Une erreur inattendue s\'est produite');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: {
        id: 'profile' | 'password' | 'email',
        label: string,
        icon: React.ElementType
    }) => (
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

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec authentification */}
            <AuthHeader
                title="Mon Profil"
                subtitle="Gérez vos informations personnelles et sécurité"
                icon={<UserCircle className="w-6 h-6 text-white" />}
            />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Informations utilisateur */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary capitalize">
                  {user.role.replace('_', ' ')}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation des onglets */}
                <div className="mb-8 flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <TabButton id="profile" label="Informations personnelles" icon={User} />
                    <TabButton id="password" label="Mot de passe" icon={Lock} />
                    <TabButton id="email" label="Adresse email" icon={Mail} />
                </div>

                {/* Contenu des onglets */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8">

                        {/* Onglet Profil */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <User className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-semibold text-gray-900">Informations personnelles</h3>
                                </div>

                                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom complet
                                        </label>
                                        <input
                                            {...profileForm.register('name')}
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Votre nom complet"
                                        />
                                        {profileForm.formState.errors.name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {profileForm.formState.errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email (lecture seule)
                                        </label>
                                        <input
                                            value={user.email}
                                            type="email"
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Pour modifier votre email, utilisez l&apos;onglet &apos;&apos;Adresse email&apos;&apos;
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            variant="primary"
                                        >
                                            {isLoading ? (
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
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Onglet Mot de passe */}
                        {activeTab === 'password' && (
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Lock className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-semibold text-gray-900">Modifier le mot de passe</h3>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center space-x-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <span className="text-blue-800 font-medium">Sécurité</span>
                                    </div>
                                    <p className="text-blue-700 text-sm mt-1">
                                        Choisissez un mot de passe fort avec au moins 6 caractères pour protéger votre compte.
                                    </p>
                                </div>

                                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mot de passe actuel
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...passwordForm.register('currentPassword')}
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.currentPassword && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordForm.formState.errors.currentPassword.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nouveau mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...passwordForm.register('newPassword')}
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.newPassword && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordForm.formState.errors.newPassword.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmer le nouveau mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...passwordForm.register('confirmPassword')}
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordForm.formState.errors.confirmPassword.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            variant="primary"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Modification...
                                                </>
                                            ) : (
                                                <>
                                                    <Key className="w-4 h-4 mr-2" />
                                                    Modifier le mot de passe
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Onglet Email */}
                        {activeTab === 'email' && (
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Mail className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-semibold text-gray-900">Modifier l&apos;adresse email</h3>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-yellow-800 font-medium">Important</span>
                                    </div>
                                    <p className="text-yellow-700 text-sm mt-1">
                                        Modifier votre email changera également votre identifiant de connexion.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h4 className="font-medium text-gray-900 mb-2">Email actuel</h4>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>

                                <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nouvelle adresse email
                                        </label>
                                        <input
                                            {...emailForm.register('newEmail')}
                                            type="email"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="nouvelle@adresse.com"
                                        />
                                        {emailForm.formState.errors.newEmail && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {emailForm.formState.errors.newEmail.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mot de passe actuel (pour confirmation)
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...emailForm.register('currentPassword')}
                                                type={showEmailPassword ? 'text' : 'password'}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowEmailPassword(!showEmailPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {emailForm.formState.errors.currentPassword && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {emailForm.formState.errors.currentPassword.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            variant="primary"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Modification...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Modifier l&apos;email
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
