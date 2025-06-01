'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Shield,
    Eye,
    EyeOff,
    Loader2,
    Book,
    AlertCircle,
    Mail,
    Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

// Schema de validation pour le login
const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    className?: string;
}

export function LoginForm({
                              onSuccess,
                              redirectTo = '/dashboard',
                              className = ''
                          }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { signIn, isLoading, isAuthenticated, user } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setFocus
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    // Focus automatique sur le premier champ
    useEffect(() => {
        setFocus('email');
    }, [setFocus]);

    // Rediriger si déjà connecté
    useEffect(() => {
        if (isAuthenticated && user) {
            if (onSuccess) {
                onSuccess();
            } else {
                router.push(redirectTo);
            }
        }
    }, [isAuthenticated, user, router, redirectTo, onSuccess]);

    const onSubmit = async (data: LoginFormData) => {
        setError(null);

        try {
            const success = await signIn(data.email, data.password);

            if (success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(redirectTo);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Une erreur inattendue s\'est produite');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleForgotPassword = () => {
        // TODO: Implémenter la réinitialisation de mot de passe
        alert('Fonctionnalité de réinitialisation à venir');
    };

    return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
            {/* En-tête */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Système de Bibliothèque
                </h1>
                <p className="text-gray-600">
                    Connectez-vous à votre espace administrateur
                </p>
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center space-x-2 mb-6">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
                </div>

                {error && (
                    <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Adresse email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="admin@bibliotheque.com"
                            disabled={isLoading}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Mot de passe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Lock className="w-4 h-4 inline mr-1" />
                            Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                placeholder="••••••••"
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Options supplémentaires */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked
                            />
                            <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                        </label>

                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-primary hover:text-primary/80 transition-colors"
                            disabled={isLoading}
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    {/* Bouton de connexion */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                        variant="primary"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Connexion en cours...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5 mr-2" />
                                Se connecter
                            </>
                        )}
                    </Button>
                </form>

                {/* Footer informatif */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Accès réservé aux administrateurs autorisés
                        </p>
                    </div>
                </div>
            </div>

            {/* Informations système en bas */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                    Système de gestion de bibliothèque - Version 1.0
                </p>
            </div>
        </div>
    );
}
