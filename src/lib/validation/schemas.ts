import { z } from 'zod';

// Schema pour la validation des horaires
export const openingHoursSchema = z.object({
  open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$|^closed$/, 'Format d\'heure invalide'),
}).refine(data => {
  if (data.open === 'closed' || data.close === 'closed') {
    return data.open === 'closed' && data.close === 'closed';
  }

  const openTime = new Date(`1970-01-01T${data.open}:00`);
  const closeTime = new Date(`1970-01-01T${data.close}:00`);

  return openTime < closeTime;
}, {
  message: 'L\'heure d\'ouverture doit être antérieure à l\'heure de fermeture',
});

// Schema pour la validation des contacts
export const contactSchema = z.object({
  Email: z.string().email('Email invalide'),
  Phone: z.string().min(8, 'Numéro de téléphone trop court'),
  WhatsApp: z.string().optional(),
  Facebook: z.string().url('URL Facebook invalide').optional().or(z.literal('')),
  Instagram: z.string().url('URL Instagram invalide').optional().or(z.literal('')),
});

// Schema pour la validation des couleurs
export const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide');

// Schema global pour les paramètres organisationnels
export const organizationSettingsSchema = z.object({
  Name: z.string().min(1, 'Le nom de l\'organisation est requis'),
  Address: z.string().min(10, 'L\'adresse doit être plus détaillée'),
  Contact: contactSchema,
  MaximumSimultaneousLoans: z.number().min(1).max(20),
  Theme: z.object({
    Primary: colorSchema,
    Secondary: colorSchema,
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
  LateReturnPenalties: z.array(z.string().min(1, 'La pénalité ne peut pas être vide')),
  SpecificBorrowingRules: z.array(z.string().min(1, 'La règle ne peut pas être vide')),
  Logo: z.string().optional(),
});

// Schema pour l'administrateur
export const adminSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  confirmEmail: z.string().email('Email invalide'),
}).refine(data => data.email === data.confirmEmail, {
  message: 'Les emails ne correspondent pas',
  path: ['confirmEmail'],
});

// Schema pour les paramètres d'application
export const appSettingsSchema = z.object({
  AppVersion: z.number().min(1),
  DefaultLoanDuration: z.number().min(1).max(365),
  GlobalLimits: z.number().min(1).max(50),
  MaintenanceMode: z.boolean(),
});