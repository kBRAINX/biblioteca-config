import { useState, useCallback } from 'react';

// Interface pour la réponse de Cloudinary
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
  resource_type: string;
  tags: string[];
  original_filename: string;
}

// Options d'upload
interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
}

// État du hook
interface CloudinaryHookState {
  isUploading: boolean;
  uploadProgress: number;
  isConnected: boolean | null;
  error: string | null;
}

export const useCloudinaryUpload = () => {
  const [state, setState] = useState<CloudinaryHookState>({
    isUploading: false,
    uploadProgress: 0,
    isConnected: null,
    error: null,
  });

  // Configuration Cloudinary
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  /**
   * Met à jour l'état partiellement
   */
  const updateState = useCallback((updates: Partial<CloudinaryHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Test de connexion à Cloudinary
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Testing Cloudinary connection...', {
        cloudName: cloudName || 'MISSING',
        uploadPreset: uploadPreset ? 'PRESENT' : 'MISSING',
        uploadUrl
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
        { method: 'GET' }
      );

      if (response.ok) {
        console.log('Cloudinary connection successful');
        updateState({ isConnected: true, error: null });
        return true;
      } else {
        const errorText = await response.text();
        console.error('Cloudinary connection failed:', errorText);
        updateState({ isConnected: false, error: `Connection failed: ${errorText}` });
        return false;
      }
    } catch (error) {
      console.error('Error testing Cloudinary connection:', error);
      updateState({ isConnected: false, error: `Connection error: ${error}` });
      return false;
    }
  }, [cloudName, uploadPreset, uploadUrl, updateState]);

  /**
   * Convertit un fichier en Base64 (solution de fallback)
   */
  const getBase64Fallback = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }, []);

  /**
   * Upload un fichier vers Cloudinary avec fallback Base64
   */
  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<string> => {
    updateState({ isUploading: true, uploadProgress: 0, error: null });

    // Vérification de la configuration
    if (!cloudName || !uploadPreset) {
      console.warn('Cloudinary configuration is missing, falling back to base64 encoding');
      try {
        const base64Result = await getBase64Fallback(file);
        updateState({ isUploading: false, uploadProgress: 100 });
        return base64Result;
      } catch (error) {
        updateState({
          isUploading: false,
          error: `Base64 conversion failed: ${error}`
        });
        throw error;
      }
    }

    try {

      // Préparation des données
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      // Options additionnelles
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }
      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      // Upload vers Cloudinary
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload failed:', errorData);

        // Si l'erreur concerne le preset, utiliser le fallback
        if (errorData?.error?.message?.includes('upload preset') ||
            errorData?.error?.message?.includes('whitelist')) {
          console.warn('Using base64 fallback due to Cloudinary preset configuration issue');
          const base64Result = await getBase64Fallback(file);
          updateState({ isUploading: false, uploadProgress: 100 });
          return base64Result;
        }

        throw new Error(`Failed to upload image to Cloudinary: ${JSON.stringify(errorData)}`);
      }

      const data: CloudinaryResponse = await response.json();
      updateState({ isUploading: false, uploadProgress: 100 });

      return data.secure_url;

    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);

      // Fallback vers Base64 en cas d'erreur
      console.warn('Falling back to base64 encoding after Cloudinary error');
      try {
        const base64Result = await getBase64Fallback(file);
        updateState({ isUploading: false, uploadProgress: 100 });
        return base64Result;
      } catch (fallbackError) {
        updateState({
          isUploading: false,
          error: `Upload and fallback failed: ${error}`
        });
        throw new Error(`Upload failed and fallback failed: ${fallbackError}`);
      }
    }
  }, [cloudName, uploadPreset, uploadUrl, updateState, getBase64Fallback]);

  /**
   * Supprime un fichier de Cloudinary (simplifié pour le front-end)
   */
  const deleteFile = useCallback(async (publicId: string): Promise<boolean> => {
    try {
      updateState({ error: null });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            upload_preset: uploadPreset
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary delete failed:', errorData);
        updateState({ error: `Delete failed: ${JSON.stringify(errorData)}` });
        return false;
      }

      const result = await response.json();
      return result.result === 'ok';

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      updateState({ error: `Delete error: ${error}` });
      return false;
    }
  }, [cloudName, uploadPreset, updateState]);

  /**
   * Génère une URL redimensionnée pour les images Cloudinary
   */
  const getResizedImageUrl = useCallback((
    imageUrl: string,
    width: number,
    height: number,
    cropMode: string = 'fill'
  ): string => {
    if (!imageUrl) return '';

    // Vérifie si c'est une URL Cloudinary
    if (imageUrl.includes('cloudinary.com')) {
      return imageUrl.replace(
        /\/upload\//,
        `/upload/c_${cropMode},w_${width},h_${height}/`
      );
    }

    // Vérifie si c'est une URL data (Base64)
    if (imageUrl.startsWith('data:')) {
      return imageUrl; // Impossible de redimensionner une image Base64 directement
    }

    // Retourne l'URL originale si ce n'est pas une URL Cloudinary
    return imageUrl;
  }, []);

  /**
   * Upload multiple de fichiers
   */
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<string[]> => {
    const results: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i], options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  }, [uploadFile]);

  /**
   * Reset de l'état
   */
  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      isConnected: null,
      error: null,
    });
  }, []);

  // Retour du hook avec toutes les fonctionnalités
  return {
    // États
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    isConnected: state.isConnected,
    error: state.error,

    // Méthodes
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getResizedImageUrl,
    testConnection,
    resetState,

    // Configuration (lecture seule)
    config: {
      cloudName,
      uploadPreset: uploadPreset ? 'CONFIGURED' : 'MISSING',
      isConfigured: !!(cloudName && uploadPreset)
    }
  };
};