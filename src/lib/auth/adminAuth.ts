import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updatePassword,
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AdminUser {
    uid: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin';
    createdAt: Date;
    lastLogin?: Date;
    updatedAt?: Date;
    passwordUpdatedAt?: Date;
    emailUpdatedAt?: Date;
}

function isFirebaseError(error: unknown): error is { code: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        true
    );
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

            await setDoc(doc(db, 'SuperAdmin', user.uid), adminData);

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
            const adminDoc = await getDoc(doc(db, 'SuperAdmin', user.uid));

            if (!adminDoc.exists()) {
                throw new Error('Compte administrateur non trouvé');
            }

            const adminData = adminDoc.data();

            // Mettre à jour la dernière connexion
            await updateDoc(doc(db, 'SuperAdmin', user.uid), {
                lastLogin: new Date()
            });

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
            const adminDoc = await getDoc(doc(db, 'SuperAdmin', user.uid));

            if (!adminDoc.exists()) {
                return null;
            }

            return {
                uid: user.uid,
                ...adminDoc.data()
            } as AdminUser;
        } catch (error) {
            console.error('Error getting current super admin:', error);
            return null;
        }
    }

    static async updateProfile(uid: string, data: { name?: string }): Promise<void> {
        try {
            await updateDoc(doc(db, 'SuperAdmin', uid), {
                ...data,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Impossible de mettre à jour le profil');
        }
    }

    static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        try {
            // Réauthentification
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Mise à jour du mot de passe
            await updatePassword(user, newPassword);

            // Mettre à jour la date de modification dans Firestore
            await updateDoc(doc(db, 'SuperAdmin', user.uid), {
                passwordUpdatedAt: new Date()
            });
        } catch (error: unknown) {
            console.error('Error changing password:', error);

            if (isFirebaseError(error))
                if (error.code === 'auth/wrong-password') {
                    throw new Error('Mot de passe actuel incorrect');
                } else if (error.code === 'auth/weak-password') {
                    throw new Error('Le nouveau mot de passe est trop faible');
                }
            throw new Error('Impossible de modifier le mot de passe');
        }
    }

    static async changeEmail(currentPassword: string, newEmail: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        try {
            // Réauthentification
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Mise à jour de l'email
            await updateEmail(user, newEmail);

            // Mettre à jour dans Firestore
            await updateDoc(doc(db, 'SuperAdmin', user.uid), {
                email: newEmail,
                emailUpdatedAt: new Date()
            });
        } catch (error: unknown) {
            console.error('Error changing email:', error);

            if (isFirebaseError(error))
                if (error.code === 'auth/wrong-password') {
                    throw new Error('Mot de passe incorrect');
                } else if (error.code === 'auth/email-already-in-use') {
                    throw new Error('Cette adresse email est déjà utilisée');
                } else if (error.code === 'auth/invalid-email') {
                    throw new Error('Adresse email invalide');
                }
            throw new Error('Impossible de modifier l\'email');
        }
    }

    static async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: unknown) {
            console.error('Error sending password reset email:', error);
            if (isFirebaseError(error)) {
                if (error.code === 'auth/user-not-found') {
                    throw new Error('Aucun compte trouvé avec cette adresse email');
                } else if (error.code === 'auth/invalid-email') {
                    throw new Error('Adresse email invalide');
                }
            }
            throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
        }
    }

    static async verifyPassword(password: string): Promise<boolean> {
        const user = auth.currentUser;
        if (!user || !user.email) return false;

        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            return true;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
}
