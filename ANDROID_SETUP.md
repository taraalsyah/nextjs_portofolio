# Panduan Konfigurasi & Build Android (Capacitor)

Dokumen ini berisi panduan lengkap integrasi **Capacitor** pada project **Next.js** untuk membuat aplikasi Android (**APK** dan **AAB**).

---

## 📋 Fitur Native Android yang Sudah Diintegrasikan

1. **Double-Tap Hardware Back Button**:
   - Menekan tombol back pada halaman biasa akan melakukan navigasi kembali (`history.back()`).
   - Menekan tombol back pada halaman utama (`/`, `/dashboard`, `/login`) akan menampilkan toast *"Tekan sekali lagi untuk keluar"*. Jika ditekan lagi dalam kurun 2 detik, aplikasi akan ditutup (`App.exitApp()`).
2. **Handling Offline (Tanpa Internet)**:
   - Jika koneksi terputus, aplikasi tidak akan menampilkan error browser bawaan, melainkan tampilan khusus **"Tidak Ada Koneksi Internet"** lengkap dengan tombol **"Coba Lagi"**.
3. **Android Status Bar & Splash Screen**:
   - Status Bar disesuaikan dengan tema gelap (`#0f172a`).
   - Splash Screen otomatis tertutup setelah aplikasi web selesai dimuat.
4. **Android Permissions**:
   - `AndroidManifest.xml` sudah dilengkapi izin: Kamera (`CAMERA`), Penyimpanan (`READ_EXTERNAL_STORAGE` & `READ_MEDIA_IMAGES`), Jaringan (`INTERNET`, `ACCESS_NETWORK_STATE`), serta Notifikasi (`POST_NOTIFICATIONS`).

---

## 🚀 Perintah Dasar (NPM Scripts)

| Perintah NPM | Fungsi |
| :--- | :--- |
| `npm run cap:sync` | Menginkronkan perubahan web ke proyek Android |
| `npm run cap:copy` | Menyalin asset build web ke folder Android |
| `npm run cap:open` | Membuka proyek Android di Android Studio |
| `npm run android:sync` | Mem-build Next.js lalu melakukan sync ke Android |
| `npm run android:open` | Membuka proyek di Android Studio |
| `npm run android:build:debug` | Mem-build APK Debug langsung via Command Line (CLI) |
| `npm run android:build:release` | Mem-build APK Release langsung via Command Line (CLI) |

---

## 🛠️ Langkah-Langkah Build APK / AAB

### 1. Install Dependencies
Jalankan perintah ini di terminal proyek Anda:
```bash
npm install
```

### 2. Hubungkan Proyek dengan Production Server / Local Server
Edit file `capacitor.config.ts` pada baris `server`:
- **Production Server** (Rekomendasi untuk NextAuth & Database):
  ```typescript
  server: {
    url: 'https://domain-anda.com', // URL hosting Next.js Anda (misal: Vercel/Railway)
    cleartext: true,
  }
  ```
- **Local Dev Testing** (HP & Laptop terhubung Wi-Fi sama):
  ```typescript
  server: {
    url: 'http://192.168.1.X:3000', // Ganti X dengan IP komputer Anda
    cleartext: true,
  }
  ```

### 3. Sync Aplikasi ke Android
Jalankan perintah sync:
```bash
npm run android:sync
```

### 4. Buka Proyek di Android Studio
```bash
npm run android:open
```

---

## 📦 Cara Generate File APK & AAB di Android Studio

### A. Cara Generate Debug APK (Untuk Pengujian di HP)
1. Buka proyek di Android Studio (`npm run android:open`).
2. Tunggu Gradle Sync selesai.
3. Di menu atas, pilih **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Setelah selesai, klik notification popup **locate** di kanan bawah. File APK terletak di:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### B. Cara Generate Release APK (Untuk Distribusi Langsung)
1. Di Android Studio, pilih menu **Build > Generate Signed Bundle / APK...**
2. Pilih **APK** lalu klik **Next**.
3. Buat KeyStore baru (jika belum ada) atau pakai KeyStore eksisting.
4. Pilih **release**, centang **V1 (JAR Signature)** dan **V2 (Full APK Signature)**.
5. Klik **Create**. File APK siap di-install di HP Android mana pun.

### C. Cara Generate Android App Bundle (.aab) (Untuk Google Play Store)
1. Pilih menu **Build > Generate Signed Bundle / APK...**
2. Pilih **Android App Bundle** lalu klik **Next**.
3. Masukkan informasi KeyStore Anda.
4. Pilih **release** lalu klik **Create**.
5. File `.aab` terletak di folder `android/app/release/app-release.aab`.

---

## 📁 Struktur Folder Utama Android Integration

```
portofolio/
├── capacitor.config.ts                     # Konfigurasi utama Capacitor
├── ANDROID_SETUP.md                        # Dokumentasi Android ini
├── src/
│   └── components/
│       └── capacitor/
│           └── CapacitorProvider.tsx       # Handler Back Button, Offline Status, Status Bar
└── android/                                # Proyek Android Native (Gradle)
    ├── app/
    │   ├── build.gradle                    # Gradle config modul app
    │   └── src/main/
    │       ├── AndroidManifest.xml         # Izin native (Kamera, Storage, Notifikasi)
    │       ├── java/com/taraalsyah/portofolio/MainActivity.java
    │       └── res/
    │           ├── values/                 # Color, String, Style (Theme)
    │           └── xml/file_paths.xml      # FileProvider config
    ├── build.gradle                        # Root Gradle config
    └── variables.gradle                    # Versi SDK Android & Dependency
```

---

## ❓ Troubleshooting Umum

1. **Error: `NET::ERR_CLEARTEXT_NOT_PERMITTED`**:
   - Pastikan pada `AndroidManifest.xml` tag `<application>` memiliki atribut `android:usesCleartextTraffic="true"`.
2. **Navigasi Back Button langsung keluar dari aplikasi**:
   - Pastikan komponen `<CapacitorProvider>` sudah terpasang membungkus aplikasi pada `src/app/providers.tsx`.
3. **Kamera / File Picker tidak dapat dibuka**:
   - Pastikan izin `CAMERA` dan `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` sudah tertera pada `AndroidManifest.xml`.
