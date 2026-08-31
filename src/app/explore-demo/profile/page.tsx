'use client';

import React from 'react';
import { DemoProvider } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { User, Eye, Edit2, Mail, Phone, Shield, Calendar, Clock, UserCheck } from 'lucide-react';
import styles from '@/components/demo/demo.module.css';

const STATIC_DEMO_PROFILE = {
  fullName: 'Tara Alsyah Icode',
  username: 'TaraIcodeAdmin',
  email: 'tara.alsyah@icode.co.id',
  phone: '62838000000',
  role: 'Admin',
  registerDate: '18 Juli 2026',
  lastLogin: '31 Agustus 2026 23:45:21 WIB',
};

function ProfileContent() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header Card matching Screenshot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Profil Saya
          </h2>
          <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Kelola informasi identitas, foto profil, dan data kontak Anda
          </p>
        </div>
      </div>

      {/* Main Profile Box Container matching Screenshot */}
      <div
        style={{
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Top Header Row inside Card: VIEW MODE badge on Left & Edit Button on Right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.3rem 0.65rem',
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}
          >
            <Eye size={13} /> VIEW MODE
          </span>

          <button
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'not-allowed',
              opacity: 0.8,
            }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>

        {/* Foto Profil Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            TA
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Foto Profil
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Klik Edit untuk mengubah foto profil
            </p>
          </div>
        </div>

        {/* Form Fields Grid matching Screenshot */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* NAMA LENGKAP */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <User size={12} /> NAMA LENGKAP
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.fullName}
            </div>
          </div>

          {/* USERNAME */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <UserCheck size={12} /> USERNAME
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.username}
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <Mail size={12} /> EMAIL
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {STATIC_DEMO_PROFILE.email}
            </div>
          </div>

          {/* NOMOR TELEPON (62838000000) */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <Phone size={12} /> NOMOR TELEPON
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.phone}
            </div>
          </div>

          {/* PERAN HAK AKSES */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <Shield size={12} /> PERAN HAK AKSES
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.role}
            </div>
          </div>

          {/* TANGGAL REGISTRASI */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <Calendar size={12} /> TANGGAL REGISTRASI
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.registerDate}
            </div>
          </div>

          {/* TERAKHIR KALI LOGIN (Full Width) */}
          <div style={{ gridColumn: 'span 2' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '0.4rem',
              }}
            >
              <Clock size={12} /> TERAKHIR KALI LOGIN
            </label>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {STATIC_DEMO_PROFILE.lastLogin}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExploreDemoProfilePage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Profile">
        <ProfileContent />
      </DemoLayout>
    </DemoProvider>
  );
}
