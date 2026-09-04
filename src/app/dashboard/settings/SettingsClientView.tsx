'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, KeyRound, Lock, Eye, EyeOff, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ButtonLoading } from '@/components/ui/loading';

interface SettingsUser {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: Date | string;
}

interface SettingsClientViewProps {
  user: SettingsUser;
}

export default function SettingsClientView({ user }: SettingsClientViewProps) {
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStatus(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Client-side Validation
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setStatus({ type: 'error', message: 'Semua kolom password wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password baru minimal terdiri dari 8 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Konfirmasi password tidak cocok dengan password baru.' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui password.');
      }

      setStatus({ type: 'success', message: data.message || 'Password Anda berhasil diperbarui!' });
      // Reset password fields on success
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Update password API error:', err);
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan pada server saat memperbarui password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div
        className="glass"
        style={{
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Settings Header */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1rem',
          }}
        >
          <Settings style={{ color: 'var(--primary)' }} size={22} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Pengaturan Akun
            </h2>
            <p style={{ color: 'var(--muted-foreground)', margin: '0.1rem 0 0', fontSize: '0.78rem' }}>
              Atur preferensi keamanan dan konfigurasi portal Anda
            </p>
          </div>
        </div>

        {/* Settings Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Group 1: Keamanan & Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                margin: 0,
                color: 'var(--foreground)',
              }}
            >
              <Shield size={15} style={{ color: 'var(--primary)' }} /> Keamanan & Akses Akun
            </h3>

            {/* Role Card */}
            <div
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  Hak Akses Role Aktif
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Akses modul saat ini dibatasi untuk role ({user.role})
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {user.role}
              </span>
            </div>

            {/* Update Password Action Card */}
            <div
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  Kata Sandi / Password
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Perbarui kata sandi akun Anda secara berkala untuk keamanan tinggi
                </span>
              </div>

              {/* Tombol Ubah Password */}
              <button
                type="button"
                onClick={handleOpenModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  border: '1px solid var(--primary-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <KeyRound size={14} />
                <span>Ubah Password</span>
              </button>
            </div>
          </div>

          {/* Group 2: Notifikasi Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                margin: 0,
                color: 'var(--foreground)',
              }}
            >
              <Bell size={15} style={{ color: 'var(--primary)' }} /> Preferensi Notifikasi
            </h3>
            <div
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  Laporan Aktivitas Email
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Kirim log aktivitas login penting ke: <strong style={{ color: 'var(--foreground)' }}>{user.email}</strong>
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '20px',
                  background: 'var(--primary-soft)',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  border: '1px solid var(--primary-border)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '14px',
                    height: '14px',
                    background: 'var(--primary)',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Group 3: Database & Integrasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                margin: 0,
                color: 'var(--foreground)',
              }}
            >
              <Database size={15} style={{ color: 'var(--primary)' }} /> Penyimpanan & Data Terisolasi
            </h3>
            <div
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  Isolasi Data Sesi (ID: {user.id})
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Seluruh data dibatasi strictly berdasarkan NextAuth Session ID
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '100px',
                  background: '#F0FDF4',
                  color: '#16A34A',
                  border: '1px solid #BBF7D0',
                  flexShrink: 0,
                }}
              >
                Aman & Privat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL UBAH PASSWORD ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.25rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                  Ubah Password Akun
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Alert Notification Toast in Modal */}
            {status && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: status.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${status.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                  color: status.type === 'success' ? '#166534' : '#991b1b',
                }}
              >
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{status.message}</span>
              </div>
            )}

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Input 1: oldPassword */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Password Saat Ini (oldPassword) *
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      height: '38px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted-foreground)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title={showOldPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Input 2: newPassword */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Password Baru (newPassword - min 8 karakter) *
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      height: '38px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted-foreground)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title={showNewPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Input 3: confirmPassword */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Konfirmasi Password Baru (confirmPassword) *
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--foreground)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      height: '38px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted-foreground)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title={showConfirmPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <ButtonLoading
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Memperbarui..."
                  disabled={!oldPassword || !newPassword || !confirmPassword}
                  style={{
                    padding: '0.45rem 1.15rem',
                    borderRadius: '6px',
                    background: 'var(--primary)',
                    border: '1px solid var(--primary-hover)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <KeyRound size={14} style={{ marginRight: '4px' }} />
                  <span>Simpan Password</span>
                </ButtonLoading>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
