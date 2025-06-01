'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DatabaseInitializer } from '@/lib/database/initialization';

interface ThemeColors {
    primary: string;
    secondary: string;
}

interface ThemeContextType {
    colors: ThemeColors;
    updateTheme: (colors: ThemeColors) => void;
    applyTheme: (colors: ThemeColors) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [colors, setColors] = useState<ThemeColors>({
        primary: '#3B82F6',
        secondary: '#8B5CF6'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadThemeFromDatabase();
    }, []);

    const loadThemeFromDatabase = async () => {
        try {
            const orgSettings = await DatabaseInitializer.getOrgSettings();
            if (orgSettings.Theme.Primary && orgSettings.Theme.Secondary) {
                const newColors = {
                    primary: orgSettings.Theme.Primary,
                    secondary: orgSettings.Theme.Secondary
                };
                setColors(newColors);
                applyThemeToDOM(newColors);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            // Appliquer le thème par défaut en cas d'erreur
            applyThemeToDOM(colors);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTheme = useCallback((newColors: ThemeColors) => {
        setColors(newColors);
        applyThemeToDOM(newColors);
    }, []);

    const applyTheme = useCallback((newColors: ThemeColors) => {
        setColors(newColors);
        applyThemeToDOM(newColors);
    }, []);

    const applyThemeToDOM = (themeColors: ThemeColors) => {
        const root = document.documentElement;

        // Convertir les couleurs hex en HSL pour CSS custom properties
        const primaryHSL = hexToHSL(themeColors.primary);
        const secondaryHSL = hexToHSL(themeColors.secondary);

        // Appliquer les variables CSS principales
        root.style.setProperty('--primary', primaryHSL);
        root.style.setProperty('--primary-foreground', getContrastColor(themeColors.primary));
        root.style.setProperty('--secondary', secondaryHSL);
        root.style.setProperty('--secondary-foreground', getContrastColor(themeColors.secondary));

        // Créer des variations pour différents états
        root.style.setProperty('--primary-hover', adjustBrightness(primaryHSL, -10));
        root.style.setProperty('--secondary-hover', adjustBrightness(secondaryHSL, -10));

        // Variables pour les accents et autres éléments
        root.style.setProperty('--accent', adjustBrightness(primaryHSL, 20));
        root.style.setProperty('--accent-foreground', getContrastColor(themeColors.primary));

        // Variables pour les bordures et états
        root.style.setProperty('--ring', primaryHSL);
        root.style.setProperty('--border', adjustBrightness(primaryHSL, 70));
        root.style.setProperty('--input', adjustBrightness(primaryHSL, 80));

        // Variables pour les états destructifs avec nuances de la couleur secondaire
        const destructiveHSL = adjustHue(secondaryHSL, 180); // Couleur complémentaire
        root.style.setProperty('--destructive', destructiveHSL);
        root.style.setProperty('--destructive-foreground', '0 0% 98%');

        // Ajouter les couleurs hex directement pour utilisation dans les composants
        root.style.setProperty('--primary-hex', themeColors.primary);
        root.style.setProperty('--secondary-hex', themeColors.secondary);
    };

    const hexToHSL = (hex: string): string => {
        // Supprimer le # si présent
        hex = hex.replace('#', '');

        // Convertir en RGB
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const adjustBrightness = (hsl: string, amount: number): string => {
        const [h, s, l] = hsl.split(' ');
        const lightness = parseInt(l.replace('%', ''));
        const newLightness = Math.max(0, Math.min(100, lightness + amount));
        return `${h} ${s} ${newLightness}%`;
    };

    const adjustHue = (hsl: string, amount: number): string => {
        const [h, s, l] = hsl.split(' ');
        const hue = parseInt(h);
        const newHue = (hue + amount) % 360;
        return `${newHue} ${s} ${l}`;
    };

    const getContrastColor = (hex: string): string => {
        // Supprimer le # si présent
        hex = hex.replace('#', '');

        // Convertir en RGB
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        // Calculer la luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Retourner blanc ou noir selon la luminance
        return luminance > 0.5 ? '0 0% 9%' : '0 0% 98%';
    };

    return (
        <ThemeContext.Provider value={{ colors, updateTheme, applyTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
