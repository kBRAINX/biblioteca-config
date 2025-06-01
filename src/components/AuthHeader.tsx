'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LogOut,
    User,
    Settings,
    ChevronDown,
    UserCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface AuthHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode; // Pour les boutons d'action spécifiques à la page
}

export function AuthHeader({ title, subtitle, icon, children }: AuthHeaderProps) {
    const { user, signOut, isLoading } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleProfile = () => {
        setIsMenuOpen(false);
        router.push('/profile');
    };

    const handleDashboard = () => {
        setIsMenuOpen(false);
        router.push('/dashboard');
    };

    const handleConfiguration = () => {
        setIsMenuOpen(false);
        router.push('/dashboard/advanced');
    };

    // Fermer le menu quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    {/* Titre et icône */}
                    <div className="flex items-center space-x-3">
                        {icon && (
                            <div className="p-2 bg-primary rounded-lg">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            {subtitle && (
                                <p className="text-gray-600">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions de droite */}
                    <div className="flex items-center space-x-4">
                        {/* Boutons d'action personnalisés */}
                        {children}

                        {/* Informations utilisateur et menu */}
                        {user && (
                            <div className="flex items-center space-x-3">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>

                                {/* Menu utilisateur */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Menu déroulant */}
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                                            <div className="py-2">
                                                {/* En-tête du menu */}
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                            {user.role === 'super_admin' ? 'Super Admin' : 'Administrateur'}
                          </span>
                                                </div>

                                                {/* Liens du menu */}
                                                <div className="py-1">
                                                    <button
                                                        onClick={handleProfile}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                                                    >
                                                        <UserCircle className="w-4 h-4" />
                                                        <span>Mon Profil</span>
                                                    </button>

                                                    <button
                                                        onClick={handleDashboard}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>Tableau de Bord</span>
                                                    </button>

                                                    <button
                                                        onClick={handleConfiguration}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>Configuration Avancée</span>
                                                    </button>
                                                </div>

                                                {/* Séparateur */}
                                                <hr className="my-1" />

                                                {/* Déconnexion */}
                                                <div className="py-1">
                                                    <button
                                                        onClick={handleSignOut}
                                                        disabled={isLoading}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>Se déconnecter</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bouton de déconnexion rapide (mobile) */}
                                <Button
                                    onClick={handleSignOut}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                    className="sm:hidden"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
