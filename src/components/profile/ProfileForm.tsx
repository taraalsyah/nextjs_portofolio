'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { revalidateDashboard } from '@/app/actions/profile';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Shield, 
  Save, 
  RotateCcw,
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
  const [currentUser, setCurrentUser] = useState<UserProfileData>(initialUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetTrigger, setResetTrigger] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // React Hook Form setup
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

  // Sync state if initialUser prop from server component updates
  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  // Keep form values in sync if currentUser state changes
  useEffect(() => {
    reset({
      name: currentUser.name,
      username: currentUser.username || '',
      phone: currentUser.phone || '',
    });
  }, [currentUser, reset]);

  // Handle Form Submission
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

      // 1. Update status state lokal
      setCurrentUser(data.user);
      setSelectedFile(null);
      setResetTrigger(prev => !prev);
      setStatus({ type: 'success', message: 'Informasi profil berhasil diperbarui.' });

      // 2. SINKRONISASI SESSION NEXTAUTH SECARA REALTIME
      // Memanggil fungsi update() pada useSession() untuk meng-update JWT token.
      await update({
        name: data.user.name,
        image: data.user.image,
        username: data.user.username,
      });

      // 3. REVALIDASI PATH DI SISI SERVER UNTUK MEMBERSIHKAN CLIENT ROUTER CACHE
      await revalidateDashboard();

      // 4. REFRESH ROUTER UNTUK MENG-INVALIDASI CACHE SERVER COMPONENTS
      // Diberikan delay kecil agar penulisan cookie session selesai di browser sebelum refresh dipanggil
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan saat menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Reset
  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setResetTrigger(prev => !prev);
    setStatus(null);
  };

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

  return (
    <div className={styles.container}>
      {/* Alert status notification */}
      {status && (
        <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={`${styles.profileCard} glass`}>
        {/* Interactive Avatar selection */}
        <ProfileAvatar
          currentImage={currentUser.image}
          onFileSelect={setSelectedFile}
          resetTrigger={resetTrigger}
          nameInitials={getInitials(currentUser.name)}
        />

        {/* Input Fields Grid */}
        <div className={styles.formGrid}>
          {/* Field 1: Nama */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <User className={styles.labelIcon} size={16} /> Nama Lengkap
            </label>
            <input
              type="text"
              {...register('name')}
              className={styles.input}
              placeholder="Masukkan nama lengkap Anda"
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name.message}</span>
            )}
          </div>

          {/* Field 2: Username */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <User className={styles.labelIcon} size={16} /> Username
            </label>
            <input
              type="text"
              {...register('username')}
              className={styles.input}
              placeholder="Masukkan username Anda"
            />
            {errors.username && (
              <span className={styles.errorText}>{errors.username.message}</span>
            )}
          </div>

          {/* Field 3: Email (Readonly) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Mail className={styles.labelIcon} size={16} /> Email (Read-Only)
            </label>
            <input
              type="email"
              value={currentUser.email}
              readOnly
              className={`${styles.input} styles.readonlyInput`}
            />
          </div>

          {/* Field 4: Nomor Telepon */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Phone className={styles.labelIcon} size={16} /> Nomor Telepon
            </label>
            <input
              type="text"
              {...register('phone')}
              className={styles.input}
              placeholder="Contoh: 08123456789 (Opsional)"
            />
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone.message}</span>
            )}
          </div>

          {/* Read-Only Stats: Hak Akses / Role */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <Shield className={styles.labelIcon} size={16} /> Peran Hak Akses
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
              <Calendar className={styles.labelIcon} size={16} /> Tanggal Registrasi
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
              <Clock className={styles.labelIcon} size={16} /> Terakhir Kali Login
            </label>
            <input
              type="text"
              value={formattedLastLogin}
              readOnly
              className={`${styles.input} ${styles.readonlyInput}`}
            />
          </div>
        </div>

        {/* Action Button Section */}
        <div className={styles.btnSection}>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || (!isDirty && !selectedFile)}
            className={styles.resetBtn}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
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
                <Save size={16} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
