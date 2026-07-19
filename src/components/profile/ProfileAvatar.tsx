'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import styles from './profile.module.css';

interface ProfileAvatarProps {
  currentImage?: string | null;
  onFileSelect: (file: File | null) => void;
  resetTrigger: boolean;
  nameInitials: string;
  isEditing: boolean;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProfileAvatar({ currentImage, onFileSelect, resetTrigger, nameInitials, isEditing }: ProfileAvatarProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview and selected file on parent form reset
  useEffect(() => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetTrigger]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validasi format file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Format foto harus berupa JPG, JPEG, PNG, atau WEBP.');
      onFileSelect(null);
      return;
    }

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran foto maksimal adalah 2 MB.');
      onFileSelect(null);
      return;
    }

    // Set preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileSelect(file);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const imageSrc = previewUrl || currentImage || null;

  return (
    <div className={styles.avatarSection}>
      <div className={styles.avatarWrapper}>
        {imageSrc ? (
          <img src={imageSrc} alt="Avatar Preview" className={styles.avatarImage} />
        ) : (
          <span>{nameInitials}</span>
        )}
      </div>

      {isEditing ? (
        <div className={styles.avatarActions}>
          <div className={styles.uploadBtn}>
            <label className={styles.uploadLabel} onClick={handleTriggerUpload}>
              <Camera size={16} />
              <span>Pilih Foto Baru</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp"
              className={styles.fileInput}
            />
          </div>
          <span className={styles.avatarInfoText}>
            Ekstensi: JPG, JPEG, PNG, atau WEBP. Maksimal 2 MB.
          </span>

          {error && (
            <span className={styles.errorText} style={{ marginTop: '0.25rem' }}>
              <AlertCircle size={14} /> {error}
            </span>
          )}
        </div>
      ) : (
        <div className={styles.avatarViewInfo}>
          <span className={styles.avatarViewName}>Foto Profil</span>
          <span className={styles.avatarViewEmail}>Klik Edit untuk mengubah foto profil</span>
        </div>
      )}
    </div>
  );
}
