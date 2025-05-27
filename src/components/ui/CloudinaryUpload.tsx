
'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Interface pour le résultat d'upload Cloudinary (adaptée du hook)
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
  resource_type: string;
  bytes: number;
  original_filename?: string;
}

// Options d'upload
interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
}

interface CloudinaryUploadProps {
  onUploadComplete?: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: string) => void;
  onFileRemoved?: () => void;
  initialFile?: CloudinaryUploadResult | string;
  options?: UploadOptions;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxFileSize?: number; // en MB
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onFileRemoved,
  initialFile,
  options = {},
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  maxFiles = 1,
  showPreview = true,
  className,
  placeholder = "Glissez vos fichiers ici ou cliquez pour sélectionner",
  disabled = false,
  maxFileSize = 5, // 5MB par défaut
}) => {
  const { uploadFile, isUploading, uploadProgress, error: hookError } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<CloudinaryUploadResult[]>(() => {
    if (initialFile) {
      if (typeof initialFile === 'string') {
        // Si c'est juste une URL, créer un objet basique
        return [{
          secure_url: initialFile,
          public_id: '',
          format: '',
          width: 0,
          height: 0,
          created_at: '',
          resource_type: initialFile.startsWith('data:') ? 'image' : 'auto',
          bytes: 0,
        }];
      } else {
        return [initialFile];
      }
    }
    return [];
  });
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    initialFile ? (typeof initialFile === 'string' ? initialFile : initialFile.secure_url) : undefined
  );

  // Validation du fichier
  const validateFile = (file: File): boolean => {
    // Vérifier la taille
    if (file.size > maxFileSize * 1024 * 1024) {
      setLocalError(`Le fichier est trop volumineux. Taille maximum: ${maxFileSize}MB`);
      return false;
    }

    // Vérifier le type
    const isValidType = acceptedFileTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      setLocalError(`Type de fichier non autorisé. Types acceptés: ${acceptedFileTypes.join(', ')}`);
      return false;
    }

    return true;
  };

  // Déclencher le dialogue de sélection de fichier
  const handleSelectClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  // Gérer la sélection de fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    await handleUpload(file);
    e.target.value = '';
  };

  // Gérer le glisser-déposer
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;
    await handleUpload(file);
  };

  // Upload du fichier
  const handleUpload = async (file: File) => {
    setLocalError(null);

    // Validation
    if (!validateFile(file)) {
      onUploadError?.(localError || 'Erreur de validation');
      return;
    }

    // Si on a déjà le maximum de fichiers, on remplace
    if (uploadedFiles.length >= maxFiles) {
      setUploadedFiles([]);
      setPreviewUrl(undefined);
    }

    try {
      // Créer une prévisualisation locale pour les images
      if (file.type.startsWith('image/')) {
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
      }

      // Upload vers Cloudinary
      const imageUrl = await uploadFile(file, options);

      // Créer l'objet résultat
      const result: CloudinaryUploadResult = {
        secure_url: imageUrl,
        public_id: file.name.split('.')[0], // Approximation
        format: file.name.split('.').pop() || '',
        width: 0,
        height: 0,
        created_at: new Date().toISOString(),
        resource_type: file.type.startsWith('image/') ? 'image' : 'raw',
        bytes: file.size,
        original_filename: file.name,
      };

      // Libérer la mémoire de la prévisualisation locale si elle existe
      if (file.type.startsWith('image/') && previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setUploadedFiles([result]);
      setPreviewUrl(imageUrl);
      onUploadComplete?.(result);

    } catch (error) {
      // Libérer la mémoire en cas d'erreur
      if (file.type.startsWith('image/') && previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement';
      setLocalError(errorMessage);
      onUploadError?.(errorMessage);

      // Revenir à l'état initial en cas d'échec
      setPreviewUrl(
        initialFile ? (typeof initialFile === 'string' ? initialFile : initialFile.secure_url) : undefined
      );
    }
  };

  // Supprimer un fichier
  const removeFile = (index: number) => {
    const removedFile = uploadedFiles[index];

    // Libérer la mémoire si c'est une URL blob
    if (removedFile?.secure_url.startsWith('blob:')) {
      URL.revokeObjectURL(removedFile.secure_url);
    }

    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrl(undefined);
    setLocalError(null);
    onFileRemoved?.();
  };

  // Obtenir l'icône appropriée selon le type de fichier
  const getFileIcon = (resourceType: string, secure_url?: string) => {
    if (resourceType === 'image' && secure_url) {
      return (
        <Image
          src={secure_url}
          alt="Preview"
          width={40}
          height={40}
          className="object-cover rounded"
        />
      );
    }
    if (resourceType === 'image') {
      return <ImageIcon className="w-4 h-4 text-gray-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const error = localError || hookError;

  return (
    <div className={cn("w-full", className)}>
      {/* Input caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes.join(',')}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {previewUrl && showPreview ? (
        // Affichage avec prévisualisation (similaire au premier composant)
        <div className="relative rounded-lg overflow-hidden">
          {uploadedFiles[0]?.resource_type === 'image' ? (
            <Image
              src={previewUrl}
              alt="Preview"
              width={400}
              height={200}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uploadedFiles[0]?.original_filename || 'Fichier'}
                </p>
              </div>
            </div>
          )}

          {/* Overlay avec boutons d'action */}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSelectClick}
              disabled={disabled || isUploading}
              className="bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Changer
            </button>

            <button
              type="button"
              onClick={() => removeFile(0)}
              disabled={disabled || isUploading}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        // Zone de drop (quand pas de fichier)
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
            "hover:border-primary hover:bg-primary/5",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isDragging && "border-primary bg-primary/10",
            (isUploading || disabled) && "opacity-50 cursor-not-allowed",
            error ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
          )}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragging ? "text-primary" : "text-gray-400"
            )} />

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? "Déposez les fichiers ici..." : placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Types acceptés: {acceptedFileTypes.join(', ')} (max {maxFileSize}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Téléchargement en cours... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="mt-3 flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste des fichiers uploadés (pour les fichiers non-image ou mode liste) */}
      {!showPreview && uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fichiers téléchargés</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.public_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.resource_type, file.secure_url)}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {file.original_filename || file.public_id.split('/').pop() || 'Fichier'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.bytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  type="button"
                  disabled={disabled || isUploading}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};