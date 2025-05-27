
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export class AdminAuth {
  static async createAdminAccount(email: string, password: string, name: string): Promise<AdminUser> {
    try {
      // Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer le document admin dans Firestore
      const adminData: Omit<AdminUser, 'uid'> = {
        email,
        name,
        role: 'super_admin',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'admin', user.uid), adminData);

      return {
        uid: user.uid,
        ...adminData
      };
    } catch (error) {
      console.error('Error creating admin account:', error);
      throw new Error('Impossible de créer le compte administrateur');
    }
  }

  static async signIn(email: string, password: string): Promise<AdminUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Récupérer les données admin
      const adminDoc = await getDoc(doc(db, 'admin', user.uid));

      if (!adminDoc.exists()) {
        throw new Error('Compte administrateur non trouvé');
      }

      const adminData = adminDoc.data();

      // Mettre à jour la dernière connexion
      await setDoc(doc(db, 'admin', user.uid), {
        ...adminData,
        lastLogin: new Date()
      }, { merge: true });

      return {
        uid: user.uid,
        ...adminData
      } as AdminUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error('Erreur de connexion');
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Erreur de déconnexion');
    }
  }

  static async getCurrentAdmin(): Promise<AdminUser | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const adminDoc = await getDoc(doc(db, 'admin', user.uid));

      if (!adminDoc.exists()) {
        return null;
      }

      return {
        uid: user.uid,
        ...adminDoc.data()
      } as AdminUser;
    } catch (error) {
      console.error('Error getting current admin:', error);
      return null;
    }
  }
}