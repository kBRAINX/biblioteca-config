# 📚 Systeme de Biblioteque - Panel de Configuration

Panel de configuration professionnel pour l'initialisation et la gestion d'un système de bibliothèque avec Firebase et Cloudinary.

## 🚀 Fonctionnalités

- ✅ **Initialisation automatique** de la base de données Firebase
- ✅ **Configuration d'administrateur** avec validation complète
- ✅ **Upload de médias** via Cloudinary avec composant réutilisable
- ✅ **Interface responsive** sur tous les appareils
- ✅ **Mode sombre/clair** avec next-themes
- ✅ **Gestion des paramètres organisationnels** (horaires, contacts, thèmes, règles)
- ✅ **Validation de formulaires** avec Zod et React Hook Form
- ✅ **Système de notifications** toast professionnel
- ✅ **Outils de diagnostic** intégrés pour le développement

## 🛠️ Technologies

- **Next.js 15** avec TypeScript
- **Tailwind CSS** pour le style
- **Firebase/Firestore** pour la base de données
- **Cloudinary** pour la gestion des médias
- **React Hook Form + Zod** pour la validation
- **Lucide React** pour les icônes

## 📦 Installation

### 1. Créer le projet

```bash
npx create-next-app@latest bibliotec-config --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd bibliotec-config
```

### 2. Installer les dépendances

```bash
npm install firebase react-hook-form @hookform/resolvers zod lucide-react next-themes clsx class-variance-authority tailwind-merge react-dropzone
```

### 3. Copier les fichiers

Copiez tous les fichiers fournis en respectant la structure :

```
biblioteca-config/
├── src/
│   ├── app/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
├── middleware.ts
├── .env
└── ...
```

### 4. Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activer **Firestore Database**
3. Activer **Authentication** > Email/Password
4. Copier les clés de configuration

### 5. Configuration Cloudinary

1. Créer un compte sur [Cloudinary](https://cloudinary.com)
2. Aller dans **Settings** > **Upload Presets**
3. **Create Upload Preset** :
   - Name: `bibliotec_uploads`
   - **Signing Mode: Unsigned** ✅
   - Folder: `bibliotec` (optionnel)

### 6. Variables d'environnement

Créer `.env.local` à la racine :

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary (seulement 2 variables)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=biblioteca_uploads
```

### 7. Lancer le projet

```bash
npm run dev
```

Accédez à `http://localhost:3000`

## 📖 Utilisation

### Première utilisation - Initialisation

1. **Étape 1 - Configuration Administrateur** :
   - Saisissez le nom et l'email de l'administrateur
   - Double confirmation de l'email

2. **Étape 2 - Initialisation automatique** :
   - Création automatique de toutes les collections Firebase
   - Configuration des documents par défaut

3. **Étape 3 - Configuration** :
   - Accès au panel de configuration avancée

### Panel de Configuration (5 onglets)

#### **Général**
- Nom de l'organisation
- Adresse complète
- Logo (upload via Cloudinary)
- Nombre maximum de prêts simultanés

#### **Contact**
- Email de contact
- Téléphone et WhatsApp
- Réseaux sociaux (Facebook, Instagram)

#### **Horaires**
- Configuration des horaires d'ouverture
- Gestion des jours fermés
- Interface jour par jour

#### **Règles**
- Pénalités de retard configurables
- Règles spécifiques d'emprunt
- Système d'ajout/suppression dynamique

#### **Thème**
- Couleurs primaire et secondaire
- Aperçu en temps réel
- Interface de sélection de couleurs

### Tableau de Bord Avancé

- **Paramètres d'application** : Version, durée de prêt, limites
- **Statistiques système** : Utilisateurs, livres, prêts actifs
- **Mode maintenance** : Restriction d'accès
- **Export/Import** : Sauvegarde de configuration

## 🗄️ Structure de la Base de Données

### Collections créées automatiquement :

- **admin** : Comptes administrateurs
- **BiblioAdmin** : Données des administrateurs
- **BiblioBooks** : Catalogue des livres
- **BiblioThesis** : Thèses et mémoires
- **BiblioUser** : Utilisateurs du système
- **Configuration** : Paramètres du système
- **Departements** : Départements académiques
- **OnlineCourses** : Cours en ligne

### Documents de configuration principaux :

- **Configuration/AppSettings** : Version, durée de prêt, mode maintenance
- **Configuration/Notifications** : Types de notifications, délais, messages
- **Configuration/OrgSettings** : Informations organisationnelles complètes

## 🎨 Composants Réutilisables

### CloudinaryUpload

```tsx
<CloudinaryUpload
  onUploadComplete={(result) => setImageUrl(result.secure_url)}
  acceptedFileTypes={['image/*']}
  options={{ folder: 'bibliotec/logos' }}
  placeholder="Téléchargez votre logo"
/>
```

### Button

```tsx
<Button variant="primary" size="lg" isLoading={isSubmitting}>
  Sauvegarder
</Button>
```

### Modal

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Confirmation">
  Contenu du modal
</Modal>
```

## 🔧 Développement

### Outils de debug intégrés

En mode développement, cliquez sur le bouton **Dev Tools** en bas à gauche pour :
- Lancer un diagnostic complet du système
- Vérifier les variables d'environnement
- Inspecter l'état des collections Firebase
- Tester la connexion Cloudinary

### Commandes utiles

```bash
# Vérification des types TypeScript
npm run type-check

# Build de production
npm run build

# Linting
npm run lint
```

## 🚀 Déploiement

### Vercel (recommandé)

```bash
npm install -g vercel
vercel --prod
```

Configurez toutes les variables d'environnement dans votre dashboard Vercel.

### Autres plateformes

Le projet est compatible avec Netlify, Railway, et autres plateformes supportant Next.js.

## 🛡️ Sécurité

- ✅ Validation côté client et serveur avec Zod
- ✅ Upload sécurisé via Cloudinary (preset unsigned)
- ✅ Gestion des erreurs appropriée
- ✅ Variables d'environnement protégées

## 📝 Prochaines Étapes

Après la configuration initiale :

1. **Configurer les règles de sécurité Firebase**
2. **Développer les modules métier** (gestion des livres, utilisateurs)
3. **Intégrer l'authentification complète**
4. **Ajouter des fonctionnalités avancées**

## 🤝 Support

Pour toute question :
- Vérifiez les variables d'environnement
- Utilisez les **DevTools** intégrés
- Consultez les logs de développement (F12)
- Vérifiez que le preset Cloudinary est "Unsigned"

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.