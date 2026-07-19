'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { revalidateDashboard } from '@/app/actions/profile';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Shield, 
  Save, 
  Pencil,
  X,
  Eye,
  PenLine,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import styles from './profile.module.css';

// ─── VALIDASI SCHEMA ZOD ──────────────────────────────────────────────────────
const profileFormSchema = z.object({
  name: z.string()
    .min(3, 'Nama Lengkap minimal 3 karakter')
    .max(100, 'Nama Lengkap maksimal 100 karakter'),
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore (_)'),
  phone: z.string()
    .optional()
    .refine(val => !val || /^[0-9]+$/.test(val), 'Nomor telepon hanya boleh berisi angka')
    .refine(val => !val || val.length <= 20, 'Nomor telepon maksimal 20 digit'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileData {
  id: number;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ProfileFormProps {
  initialUser: UserProfileData;
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserProfileData>(initialUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const prevPathnameRef = useRef<string>(pathname);

  // ─── REACT HOOK FORM ────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser.name,
      username: currentUser.username || '',
      phone: currentUser.phone || '',
    }
  });

  // Capture ref for name input to focus on edit
  const { ref: nameRegRef, ...nameRegRest } = register('name');
  const nameRefCallback = useCallback((el: HTMLInputElement | null) => {
    nameRegRef(el);
    nameInputRef.current = el;
  }, [nameRegRef]);

  // ─── SYNC INITIAL USER PROP ─────────────────────────────────────────────────
  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    reset({
      name: currentUser.name,
      username: currentUser.username || '',
      phone: currentUser.phone || '',
    });
  }, [currentUser, reset]);

  // ─── UNSAVED CHANGES GUARD: BROWSER CLOSE/REFRESH ──────────────────────────
  const hasUnsavedChanges = isEditing && (isDirty || !!selectedFile);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ─── UNSAVED CHANGES GUARD: ROUTE NAVIGATION ──────────────────────────────
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
      );
      if (!confirmed) {
        router.push(prevPathnameRef.current);
        return;
      }
      // User chose to leave — reset state
      setIsEditing(false);
      setSelectedFile(null);
      setResetTrigger(prev => !prev);
      reset();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, hasUnsavedChanges, router, reset]);

  // ─── MODE HANDLERS ─────────────────────────────────────────────────────────
  const handleEdit = () => {
    setIsEditing(true);
    setStatus(null);
    // Focus first editable field after DOM update
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setResetTrigger(prev => !prev);
    reset({
      name: currentUser.name,
      username: currentUser.username || '',
      phone: currentUser.phone || '',
    });
    setStatus(null);
  };

  // ─── FORM SUBMISSION ───────────────────────────────────────────────────────
  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('username', values.username);
      formData.append('phone', values.phone || '');
      
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil.');
      }

      // 1. Update local state & exit edit mode
      setCurrentUser(data.user);
      setSelectedFile(null);
      setResetTrigger(prev => !prev);
      setIsEditing(false);
      setStatus({ type: 'success', message: 'Informasi profil berhasil diperbarui.' });

      // 2. Sync NextAuth session
      await update({
        name: data.user.name,
        image: data.user.image,
        username: data.user.username,
      });

      // 3. Revalidate server-side cache
      await revalidateDashboard();

      // 4. Refresh router for server components
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan saat menyimpan data.' });
      // Stay in edit mode on error — don't discard user input
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formattedJoinDate = new Date(currentUser.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedLastLogin = currentUser.lastLoginAt
    ? new Date(currentUser.lastLoginAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB'
    : '-';

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Alert status notification */}
      {status && (
        <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={`${styles.profileCard} glass`}>
        {/* Card Header: Mode Badge + Edit/Action Buttons */}
        <div className={styles.cardHeader}>
          {isEditing ? (
            <span className={`${styles.modeBadge} ${styles.modeBadgeEdit}`}>
              <PenLine size={12} /> Edit Mode
            </span>
          ) : (
            <span className={`${styles.modeBadge} ${styles.modeBadgeView}`}>
              <Eye size={12} /> View Mode
            </span>
          )}

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className={styles.editBtn}
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Interactive Avatar section */}
        <ProfileAvatar
          currentImage={currentUser.image}
          onFileSelect={setSelectedFile}
          resetTrigger={resetTrigger}
          nameInitials={getInitials(currentUser.name)}
          isEditing={isEditing}
        />

        {/* Input Fields Grid */}
        <div className={styles.formGrid}>
          {/* Field 1: Nama */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <User className={styles.labelIcon} size={13} /> Nama Lengkap
            </label>
            <input
              type="text"
              ref={nameRefCallback}
              {...nameRegRest}
              readOnly={!isEditing}
              className={`${styles.input} ${!isEditing ? styles.viewModeInput : ''}`}
              placeholder="Masukkan nama lengkap Anda"
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name.message}</span>
            )}
          </div>

          {/* Field 2: Username */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <User className={styles.labelIcon} size={13} /> Username
            </label>
            <input
              type="text"
              {...register('username')}
              readOnly={!isEditing}
              className={`${styles.input} ${!isEditing ? styles.viewModeInput : ''}`}
              placeholder="Masukkan username Anda"
            />
            {errors.username && (
              <span className={styles.errorText}>{errors.username.message}</span>
            )}
          </div>

          {/* Field 3: Email (Always Readonly) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Mail className={styles.labelIcon} size={13} /> Email
            </label>
            <input
              type="email"
              value={currentUser.email}
              readOnly
              className={`${styles.input} ${styles.readonlyInput}`}
            />
          </div>

          {/* Field 4: Nomor Telepon */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Phone className={styles.labelIcon} size={13} /> Nomor Telepon
            </label>
            <input
              type="text"
              {...register('phone')}
              readOnly={!isEditing}
              className={`${styles.input} ${!isEditing ? styles.viewModeInput : ''}`}
              placeholder="Contoh: 08123456789 (Opsional)"
            />
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone.message}</span>
            )}
          </div>

          {/* Read-Only Stats: Hak Akses / Role */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Shield className={styles.labelIcon} size={13} /> Peran Hak Akses
            </label>
            <input
              type="text"
              value={(initialUser as any).role || 'user'}
              readOnly
              className={`${styles.input} ${styles.readonlyInput}`}
            />
          </div>

          {/* Read-Only Stats: Bergabung */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Calendar className={styles.labelIcon} size={13} /> Tanggal Registrasi
            </label>
            <input
              type="text"
              value={formattedJoinDate}
              readOnly
              className={`${styles.input} ${styles.readonlyInput}`}
            />
          </div>

          {/* Read-Only Stats: Terakhir Login */}
          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>
              <Clock className={styles.labelIcon} size={13} /> Terakhir Kali Login
            </label>
            <input
              type="text"
              value={formattedLastLogin}
              readOnly
              className={`${styles.input} ${styles.readonlyInput}`}
            />
          </div>
        </div>

        {/* Action Buttons — only visible in Edit Mode */}
        {isEditing && (
          <div className={styles.btnSection}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className={styles.cancelBtn}
            >
              <X size={14} />
              <span>Batal</span>
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || (!isDirty && !selectedFile)}
              className={styles.saveBtn}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner} />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
