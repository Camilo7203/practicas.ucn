import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, FileText, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  uploadMediaSimple,
  validateMediaFile,
  formatFileSize,
  fileToBase64,
  type MediaUploadResponse,
} from '../../services/mediaUploadService';

interface MediaUploaderProps {
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  onUploadComplete: (mediaId: string, handle: string, fileUrl: string, fileName: string) => void;
  currentMediaId?: string;
  onRemove?: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  type,
  onUploadComplete,
  currentMediaId,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(currentMediaId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIcon = () => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-8 h-8" />;
      case 'VIDEO':
        return <Video className="w-8 h-8" />;
      case 'DOCUMENT':
        return <FileText className="w-8 h-8" />;
    }
  };

  const getAcceptedTypes = () => {
    switch (type) {
      case 'IMAGE':
        return 'image/jpeg,image/jpg,image/png';
      case 'VIDEO':
        return 'video/mp4,video/3gpp';
      case 'DOCUMENT':
        return 'application/pdf';
    }
  };

  const getMaxSize = () => {
    switch (type) {
      case 'IMAGE':
        return '5MB';
      case 'VIDEO':
        return '16MB';
      case 'DOCUMENT':
        return '100MB';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validar archivo
    const validation = validateMediaFile(selectedFile, type);
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Generar preview/URL para todos los tipos
    try {
      if (type === 'IMAGE') {
        const base64 = await fileToBase64(selectedFile);
        setPreview(base64);
      } else if (type === 'VIDEO') {
        // Para videos, crear URL del blob
        const videoUrl = URL.createObjectURL(selectedFile);
        setPreview(videoUrl);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simular progreso para feedback visual
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result: MediaUploadResponse = await uploadMediaSimple(file);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.mediaId) {
        setUploadedMediaId(result.mediaId);
        
        // El handle para la plantilla es el mediaId en formato especial
        // Meta requiere un handle que viene de la Resumable Upload API
        // Por ahora, usamos el mediaId directamente
        const handle = result.handle || result.mediaId;
        
        // Crear URL para preview (usar la URL del archivo local o base64)
        let fileUrl = preview || '';
        if (!fileUrl) {
          if (type === 'IMAGE') {
            fileUrl = await fileToBase64(file);
          } else if (type === 'VIDEO') {
            fileUrl = URL.createObjectURL(file);
          } else if (type === 'DOCUMENT') {
            fileUrl = URL.createObjectURL(file);
          }
        }
        
        onUploadComplete(result.mediaId, handle, fileUrl, file.name);
        
        setTimeout(() => {
          setUploading(false);
        }, 500);
      } else {
        setError(result.error || 'Error al subir el archivo');
        setUploading(false);
      }
    } catch (err) {
      setError('Error al subir el archivo');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadedMediaId(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Crear un objeto que simule el evento de input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
      
      // También procesar directamente
      const validation = validateMediaFile(droppedFile, type);
      if (!validation.valid) {
        setError(validation.error || 'Archivo no válido');
        return;
      }

      setError(null);
      setFile(droppedFile);

      // Generar preview/URL para todos los tipos
      try {
        if (type === 'IMAGE') {
          const base64 = await fileToBase64(droppedFile);
          setPreview(base64);
        } else if (type === 'VIDEO') {
          const videoUrl = URL.createObjectURL(droppedFile);
          setPreview(videoUrl);
        }
      } catch (err) {
        console.error('Error generating preview:', err);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Área de carga */}
      {!file && !uploadedMediaId && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors bg-muted/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedTypes()}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className="text-textMuted">{getIcon()}</div>
            <p className="text-sm font-medium text-textPrimary">
              {t('shipments.selectOrDragFile', { type: type.toLowerCase() })}
            </p>
            <p className="text-xs text-textMuted">
              {t('shipments.maxSize', { size: getMaxSize() })}
            </p>
          </div>
        </div>
      )}

      {/* Preview y botón de subir */}
      {file && !uploadedMediaId && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start space-x-3">
            {preview && type === 'IMAGE' ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded"
              />
            ) : preview && type === 'VIDEO' ? (
              <video
                src={preview}
                className="w-20 h-20 object-cover rounded"
                muted
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-textMuted">
                {getIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-textPrimary truncate">
                {file.name}
              </p>
              <p className="text-xs text-textMuted">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={handleRemove}
              className="text-textMuted hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progreso */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-textMuted">
                {t('shipments.uploading', { progress })}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de subir */}
          {!uploading && !error && (
            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-highlight transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{t('shipments.uploadFile')}</span>
            </button>
          )}

          {/* Botón de reintentar */}
          {error && (
            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-highlight transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{t('shipments.retry')}</span>
            </button>
          )}
        </div>
      )}

      {/* Archivo subido exitosamente */}
      {uploadedMediaId && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-green-600">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  {t('shipments.fileUploadedSuccessfully')}
                </p>
                <p className="text-xs text-green-700">
                  ID: {uploadedMediaId}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-green-700 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="text-xs text-textMuted space-y-1">
        <p>
          <strong>{t('shipments.acceptedFormats')}</strong>{' '}
          {type === 'IMAGE' && 'JPEG, JPG, PNG'}
          {type === 'VIDEO' && 'MP4, 3GPP'}
          {type === 'DOCUMENT' && 'PDF'}
        </p>
        <p>
          <strong>{t('shipments.maxSizeLabel')}</strong> {getMaxSize()}
        </p>
      </div>
    </div>
  );
};

export default MediaUploader;
