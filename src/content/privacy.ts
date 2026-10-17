/**
 * Kebijakan Privasi (Privacy Policy) TaskTuntas
 * File ini memisahkan isi kebijakan privasi dari komponen UI.
 */

import { BRAND_CONFIG } from './terms';

export const PRIVACY_VERSION = "2026-10-18";
export const PRIVACY_LAST_UPDATED = "18 Oktober 2026";

export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  content: string[];
}

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "pengumpulan-data",
    number: "Pasal 1",
    title: "Informasi yang Kami Kumpulkan",
    content: [
      `1.1. Informasi yang Anda berikan secara langsung saat registrasi akun, termasuk nama lengkap, alamat email, dan kata sandi yang telah di-hash secara aman.`,
      `1.2. Data operasional yang dihasilkan selama penggunaan ${BRAND_CONFIG.name}, seperti nama proyek, detail tugas, riwayat aktivitas, dan preferensi pengaturan.`,
      `1.3. Informasi transaksi pembayaran yang dikirimkan oleh penyedia payment gateway berlisensi (kami tidak menyimpan informasi sensitif nomor kartu kredit atau detail perbankan Anda).`,
      `1.4. Informasi teknis otomatis mencakup alamat IP, jenis perangkat, peramban (browser), dan waktu akses untuk keperluan keamanan dan audit log.`,
    ],
  },
  {
    id: "penggunaan-data",
    number: "Pasal 2",
    title: "Penggunaan Informasi",
    content: [
      `2.1. Menyediakan, mengoperasikan, memelihara, dan meningkatkan kualitas Layanan ${BRAND_CONFIG.name}.`,
      `2.2. Memproses transaksi, mengirimkan kode verifikasi OTP (One-Time Password), dan notifikasi alur kerja persetujuan tugas (approval workflow).`,
      `2.3. Mencegah aktivitas penipuan, akses tidak sah, dan pelanggaran keamanan sistem.`,
      `2.4. Menanggapi permintaan bantuan pelanggan dan dukungan teknis.`,
    ],
  },
  {
    id: "keamanan-data",
    number: "Pasal 3",
    title: "Keamanan Data & Penyimpanan",
    content: [
      `3.1. Kami menerapkan enkripsi standar industri (termasuk HTTPS/TLS dan hashing kata sandi dengan bcrypt) untuk melindungi integritas dan kerahasiaan data Anda.`,
      `3.2. Akses internal terhadap basis data dibatasi secara ketat hanya untuk personel yang memiliki otorisasi operasional.`,
    ],
  },
  {
    id: "kontak-privasi",
    number: "Pasal 4",
    title: "Hak Pengguna & Kontak Privasi",
    content: [
      `4.1. Anda berhak memperbarui, mengunduh, atau meminta penghapusan data pribadi Anda kapan saja.`,
      `4.2. Untuk pertanyaan mengenai kebijakan privasi atau permohonan data, hubungi Petugas Perlindungan Data kami melalui email ${BRAND_CONFIG.email}.`,
    ],
  },
];
