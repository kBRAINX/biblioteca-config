import { DatabaseInitializer } from '@/lib/database/initialization';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


export interface ErrorDetails {
    code: number;
    message: string;
    docCount?: number;
}

export interface SystemCheckResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: ErrorDetails;
}

export class SystemChecker {
  static async runFullDiagnostic(): Promise<SystemCheckResult[]> {
    const results: SystemCheckResult[] = [];

    // 1. Vérifier la connexion Firebase
    try {
      await getDocs(collection(db, 'Configuration'));
      results.push({
        status: 'success',
        message: 'Connexion Firebase établie'
      });
    } catch (error: unknown) {
      results.push({
        status: 'error',
        message: 'Échec de connexion à Firebase',
        details: error as ErrorDetails
      });
    }

    // 2. Vérifier l'initialisation
    try {
      const isInitialized = await DatabaseInitializer.checkIfInitialized();
      results.push({
        status: isInitialized ? 'success' : 'warning',
        message: isInitialized ? 'Système initialisé' : 'Système non initialisé'
      });
    } catch (error: unknown) {
      results.push({
        status: 'error',
        message: 'Erreur lors de la vérification d\'initialisation',
        details: error as ErrorDetails
      });
    }

    // 3. Vérifier les collections requises
    const requiredCollections = [
      'admin', 'Configuration', 'BiblioBooks',
      'BiblioUser', 'BiblioAdmin', 'BiblioThesis',
      'Departements', 'OnlineCourses'
    ];

    for (const collectionName of requiredCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          const exists = !snapshot.empty;
          results.push({
            status: exists ? 'success' : 'warning',
            message: `Collection ${collectionName}: ${exists ? 'Présente' : 'Vide ou absente'}`,
            details: { code: 0, message: '', docCount: snapshot.size }
          });
        } catch (error: unknown) {
          results.push({
            status: 'error',
            message: `Erreur avec la collection ${collectionName}`,
            details: error as ErrorDetails
          });
        }
      }

    // 4. Vérifier les variables d'environnement
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
    ];

    for (const envVar of requiredEnvVars) {
      const exists = !!process.env[envVar];
      results.push({
        status: exists ? 'success' : 'error',
        message: `Variable ${envVar}: ${exists ? 'Définie' : 'Manquante'}`
      });
    }

    return results;
  }

  static async checkCloudinaryConnection(): Promise<SystemCheckResult> {
    try {
      // Test simple de connexion à Cloudinary
      const response = await fetch(
        `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'HEAD' }
      );

      if (!response.ok) {
        return {
          status: 'error',
          message: 'Erreur de connexion Cloudinary',
          details: {
            code: response.status,
            message: response.statusText
          }
        };
      }

      return {
        status: 'success',
        message: 'Cloudinary accessible'
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        message: 'Erreur de connexion Cloudinary',
        details: error as ErrorDetails
      };
    }
  }
}