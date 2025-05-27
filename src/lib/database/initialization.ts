
import {
  doc,
  setDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types pour les données de configuration
export interface AdminData {
  email: string;
  name: string;
  role: 'super_admin';
  createdAt: FieldValue | Timestamp;
  lastLogin?: FieldValue | Timestamp;
}

export interface AppSettings {
  AppVersion: number;
  DefaultLoanDuration: number;
  GlobalLimits: number;
  MaintenanceMode: boolean;
}

export interface NotificationSettings {
  ActiveNotificationTypes: string[];
  notificationDelays: {
    overDueReminder: number;
    reminderBeforeDue: number;
  };
  predefinedMessages: {
    overdue: string;
    reminder: string;
    reservationReady: string;
  };
}

export interface OrgSettings {
  Address: string;
  Contact: {
    Email: string;
    Facebook: string;
    Instagram: string;
    Phone: string;
    WhatsApp: string;
  };
  LateReturnPenalties: string[];
  Logo: string;
  MaximumSimultaneousLoans: number;
  Name: string;
  OpeningHours: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  SpecificBorrowingRules: string[];
  Theme: {
    Primary: string;
    Secondary: string;
  };
}

// Données par défaut
const defaultAppSettings: AppSettings = {
  AppVersion: 1,
  DefaultLoanDuration: 21,
  GlobalLimits: 5,
  MaintenanceMode: true
};

const defaultNotificationSettings: NotificationSettings = {
  ActiveNotificationTypes: ["email", "sms", "whatsapp"],
  notificationDelays: {
    overDueReminder: 1,
    reminderBeforeDue: 3
  },
  predefinedMessages: {
    overdue: "Your borrowed book is overdue. Please return it as soon as possible.",
    reminder: "Don't forget to return your book on time!",
    reservationReady: "Your reserved book is now available for pickup."
  }
};

const defaultOrgSettings: OrgSettings = {
  Address: "",
  Contact: {
    Email: "",
    Facebook: "",
    Instagram: "",
    Phone: "+237 123456789",
    WhatsApp: "+237 123456789"
  },
  LateReturnPenalties: [""],
  Logo: "",
  MaximumSimultaneousLoans: 3,
  Name: "",
  OpeningHours: {
    Monday: '{"open": "08:00", "close": "18:00"}',
    Tuesday: '{"open": "08:00", "close": "18:00"}',
    Wednesday: '{"open": "08:00", "close": "18:00"}',
    Thursday: '{"open": "08:00", "close": "18:00"}',
    Friday: '{"open": "08:00", "close": "18:00"}',
    Saturday: '{"open": "10:00", "close": "18:00"}',
    Sunday: '{"open": "closed", "close": "closed"}'
  },
  SpecificBorrowingRules: [""],
  Theme: {
    Primary: "",
    Secondary: ""
  }
};

// Collections à créer
const collectionsToCreate = [
  'BiblioAdmin',
  'BiblioBooks',
  'BiblioThesis',
  'BiblioUser',
  'Configuration',
  'Departements',
  'OnlineCourses',
  'admin'
];

export class DatabaseInitializer {
  static async checkIfInitialized(): Promise<boolean> {
    try {
      const initDoc = await getDoc(doc(db, 'Configuration', 'initialized'));
      return initDoc.exists();
    } catch (error) {
      console.error('Error checking initialization status:', error);
      return false;
    }
  }

  static async initializeDatabase(adminData: Omit<AdminData, 'createdAt' | 'role'>): Promise<void> {
    const batch = writeBatch(db);

    try {
      // 1. Créer le document administrateur
      const adminRef = doc(db, 'admin', adminData.email);
      const adminDocument: AdminData = {
        ...adminData,
        role: 'super_admin',
        createdAt: serverTimestamp()
      };
      batch.set(adminRef, adminDocument);

      // 2. Créer les documents de configuration
      const appSettingsRef = doc(db, 'Configuration', 'AppSettings');
      batch.set(appSettingsRef, defaultAppSettings);

      const notificationSettingsRef = doc(db, 'Configuration', 'Notifications');
      batch.set(notificationSettingsRef, defaultNotificationSettings);

      const orgSettingsRef = doc(db, 'Configuration', 'OrgSettings');
      batch.set(orgSettingsRef, defaultOrgSettings);

      // 3. Créer un document de marquage d'initialisation
      const initRef = doc(db, 'Configuration', 'initialized');
      batch.set(initRef, {
        initialized: true,
        initializedAt: serverTimestamp(),
        initializedBy: adminData.email,
        version: '1.0.0'
      });

      // 4. Créer des documents vides dans les autres collections pour les initialiser
      for (const collectionName of collectionsToCreate) {
        if (collectionName !== 'Configuration' && collectionName !== 'admin') {
          const placeholderRef = doc(db, collectionName, '_placeholder');
          batch.set(placeholderRef, {
            _placeholder: true,
            createdAt: serverTimestamp(),
            note: `Collection ${collectionName} initialized`
          });
        }
      }

      // 5. Exécuter toutes les opérations
      await batch.commit();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw new Error('Failed to initialize database');
    }
  }

  static async updateOrgSettings(settings: Partial<OrgSettings>): Promise<void> {
    try {
      const orgSettingsRef = doc(db, 'Configuration', 'OrgSettings');
      const currentDoc = await getDoc(orgSettingsRef);

      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as OrgSettings;
        const updatedData = { ...currentData, ...settings };
        await setDoc(orgSettingsRef, updatedData);
      } else {
        await setDoc(orgSettingsRef, { ...defaultOrgSettings, ...settings });
      }
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw new Error('Failed to update organization settings');
    }
  }

  static async updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const appSettingsRef = doc(db, 'Configuration', 'AppSettings');
      const currentDoc = await getDoc(appSettingsRef);

      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as AppSettings;
        const updatedData = { ...currentData, ...settings };
        await setDoc(appSettingsRef, updatedData);
      } else {
        await setDoc(appSettingsRef, { ...defaultAppSettings, ...settings });
      }
    } catch (error) {
      console.error('Error updating app settings:', error);
      throw new Error('Failed to update app settings');
    }
  }

  static async getOrgSettings(): Promise<OrgSettings> {
    try {
      const orgSettingsRef = doc(db, 'Configuration', 'OrgSettings');
      const docSnap = await getDoc(orgSettingsRef);

      if (docSnap.exists()) {
        return docSnap.data() as OrgSettings;
      } else {
        return defaultOrgSettings;
      }
    } catch (error) {
      console.error('Error fetching organization settings:', error);
      throw new Error('Failed to fetch organization settings');
    }
  }

  static async getAppSettings(): Promise<AppSettings> {
    try {
      const appSettingsRef = doc(db, 'Configuration', 'AppSettings');
      const docSnap = await getDoc(appSettingsRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      } else {
        return defaultAppSettings;
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
      throw new Error('Failed to fetch app settings');
    }
  }
}