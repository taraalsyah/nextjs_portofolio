'use client';

import React from 'react';
import { DemoProvider } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { Settings, Globe, Bell, ShieldCheck } from 'lucide-react';
import styles from '@/components/demo/demo.module.css';

function SettingsContent() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header Card */}
      <div className={styles.kanbanHeaderCard}>
        <h2 className={styles.kanbanTitleText}>
          <Settings size={22} color="#2563eb" /> Application Settings
        </h2>
        <p className={styles.kanbanSubtext}>
          Pengaturan umum dan preferensi notifikasi aplikasi (Static Demo Preview).
        </p>
      </div>

      {/* Main Settings Container */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* General Settings Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.15rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="#2563eb" /> General Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Language / Bahasa
              </label>
              <select disabled className={styles.formInput} style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}>
                <option value="en">English (US)</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Timezone / Zona Waktu
              </label>
              <select disabled className={styles.formInput} style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}>
                <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.15rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="#2563eb" /> Notification Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Email Notification</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kirim ringkasan notifikasi task via email</div>
              </div>
              <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 999 }}>
                ENABLED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Task Assignment Notification</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Notifikasi saat Anda ditugaskan ke task baru</div>
              </div>
              <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 999 }}>
                ENABLED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Due Date Reminder</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Pengingat notifikasi task mendekati tenggat waktu</div>
              </div>
              <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 999 }}>
                ENABLED
              </span>
            </div>
          </div>
        </div>

        {/* Security Summary Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.15rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#16a34a" /> Security &amp; Session
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
            Sesi aktif: <strong>Sandbox Explorer (Temporary In-Memory Session)</strong>.<br />
            Seluruh fitur keamanan seperti 2FA, OTP verification, dan Change Password aktif secara otomatis pada akun produksi TaskTuntas.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExploreDemoSettingsPage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Settings">
        <SettingsContent />
      </DemoLayout>
    </DemoProvider>
  );
}
