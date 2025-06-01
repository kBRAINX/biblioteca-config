'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { AdminAuth, AdminUser } from '@/lib/auth/adminAuth';
import { auth } from '@/lib/firebase';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';

interface AuthState {
    user: AdminUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    const { notifySuccess, notifyError } = useNotificationHelpers();

    const updateState = useCallback((updates: Partial<AuthState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Écouter les changements d'état d'authentification Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                try {
                    // Récupérer les données admin depuis Firestore
                    const adminUser = await AdminAuth.getCurrentAdmin();
                    if (adminUser) {
                        updateState({
                            user: adminUser,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } else {
                        // Utilisateur Firebase mais pas d'admin correspondant
                        await AdminAuth.signOut();
                        updateState({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching admin data:', error);
                    updateState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            } else {
                updateState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        });

        return () => unsubscribe();
    }, [updateState]);

    const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            updateState({ isLoading: true });
            const adminUser = await AdminAuth.signIn(email, password);

            updateState({
                user: adminUser,
                isAuthenticated: true,
                isLoading: false,
            });

            notifySuccess('Connexion réussie', `Bienvenue ${adminUser.name}`);
            return true;
        } catch (error) {
            console.error('Sign in error:', error);
            notifyError('Erreur de connexion', 'Email ou mot de passe incorrect');
            updateState({ isLoading: false });
            return false;
        }
    }, [updateState, notifySuccess, notifyError]);

    const signOut = useCallback(async (): Promise<void> => {
        try {
            updateState({ isLoading: true });
            await AdminAuth.signOut();

            updateState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            notifySuccess('Déconnexion réussie', 'À bientôt !');
        } catch (error) {
            console.error('Sign out error:', error);
            notifyError('Erreur', 'Erreur lors de la déconnexion');
            updateState({ isLoading: false });
        }
    }, [updateState, notifySuccess, notifyError]);

    const createAdminAccount = useCallback(async (
        email: string,
        password: string,
        name: string
    ): Promise<boolean> => {
        try {
            updateState({ isLoading: true });
            const adminUser = await AdminAuth.createAdminAccount(email, password, name);

            updateState({
                user: adminUser,
                isAuthenticated: true,
                isLoading: false,
            });

            notifySuccess('Compte créé', 'Administrateur créé avec succès');
            return true;
        } catch (error) {
            console.error('Create admin error:', error);
            notifyError('Erreur', 'Impossible de créer le compte administrateur');
            updateState({ isLoading: false });
            return false;
        }
    }, [updateState, notifySuccess, notifyError]);

    const refreshUser = useCallback(async (): Promise<void> => {
        if (!auth.currentUser) return;

        try {
            const adminUser = await AdminAuth.getCurrentAdmin();
            if (adminUser) {
                updateState({ user: adminUser });
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    }, [updateState]);

    return {
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        signIn,
        signOut,
        createAdminAccount,
        refreshUser,
    };
}
