/**
 * Syarat & Ketentuan (Terms of Service) TaskTuntas
 * File ini memisahkan seluruh teks konten hukum dari komponen UI agar mudah diperbarui.
 */

export const TERMS_VERSION = "2026-10-18";
export const TERMS_LAST_UPDATED = "18 Oktober 2026";

export const BRAND_CONFIG = {
  name: "TaskTuntas",
  company: "PT TaskTuntas Digital Solusindo",
  url: "https://tasktuntas.com",
  email: "support@tasktuntas.com",
  address: "Indonesia",
};

export interface TermSection {
  id: string;
  number: string;
  title: string;
  content: string[];
}

export const TERMS_SECTIONS: TermSection[] = [
  {
    id: "definisi",
    number: "Pasal 1",
    title: "Ketentuan Umum & Definisi",
    content: [
      `1.1. "Layanan" mengacu pada platform SaaS (Software-as-a-Service) manajemen tugas dan proyek modern, fitur AI Assistant, automasi alur kerja, integrasi pembayaran, dan seluruh situs web terkait yang disediakan oleh ${BRAND_CONFIG.name} (${BRAND_CONFIG.url}).`,
      `1.2. "Pengguna" atau "Anda" adalah setiap individu, tim, atau badan usaha yang mengakses, mendaftar, atau memanfaatkan Layanan ${BRAND_CONFIG.name}.`,
      `1.3. "Akun" adalah identitas terdaftar yang mencakup alamat email, kredensial login, data profil, dan hak akses yang diberikan kepada Pengguna.`,
      `1.4. "Konten Pengguna" merujuk pada segala materi, data, proyek, tugas, komentar, berkas, dan informasi yang diunggah atau disimpan oleh Pengguna ke dalam sistem ${BRAND_CONFIG.name}.`,
      `1.5. "Syarat & Ketentuan" merujuk pada keseluruhan perjanjian hukum ini beserta pembaruannya yang sah di masa mendatang.`,
    ],
  },
  {
    id: "kelayakan-akun",
    number: "Pasal 2",
    title: "Kelayakan & Pendaftaran Akun",
    content: [
      "2.1. Untuk menggunakan Layanan, Anda harus berusia minimal 18 tahun atau telah memiliki kapasitas hukum yang sah untuk mengikatkan diri dalam perjanjian kontraktual.",
      "2.2. Anda wajib memberikan informasi pendaftaran yang akurat, lengkap, dan terkini, termasuk nama lengkap dan alamat email yang valid.",
      "2.3. Anda bertanggung jawab penuh atas keamanan dan kerahasiaan kredensial akun Anda (termasuk kata sandi dan kode otentikasi dua langkah / 2FA).",
      `2.4. Segala aktivitas yang terjadi di bawah Akun Anda menjadi tanggung jawab Anda sepenuhnya. Apabila terjadi akses tidak sah, Anda wajib segera memberi tahu kami melalui email ${BRAND_CONFIG.email}.`,
      "2.5. Satu akun hanya boleh dipergunakan oleh pemilik yang berhak dan dilarang dipindahtangankan tanpa persetujuan tertulis dari kami.",
    ],
  },
  {
    id: "layanan-langganan",
    number: "Pasal 3",
    title: "Layanan & Produk Digital",
    content: [
      `3.1. ${BRAND_CONFIG.name} menyediakan akses ke perangkat lunak manajemen proyek berbasis web dan mobile, mencakup fitur gratis, paket berbayar, dan add-on proyek digital.`,
      "3.2. Kami berhak memodifikasi, memperbarui, menambah, atau menghentikan fitur tertentu sewaktu-waktu demi pemeliharaan, stabilitas, atau peningkatan kualitas sistem.",
      "3.3. Kami berusaha semaksimal mungkin menjaga ketersediaan layanan 99.9% uptime, namun tidak menjamin layanan akan selalu bebas dari gangguan teknis, pemeliharaan terjadwal, atau kejadian force majeure.",
    ],
  },
  {
    id: "pembayaran-gateway",
    number: "Pasal 4",
    title: "Pembayaran & Ketentuan Payment Gateway",
    content: [
      "4.1. Transaksi pembayaran untuk produk digital, pembuatan proyek premium, atau langganan diproses melalui saluran payment gateway resmi (termasuk QRIS, Virtual Account bank, dan E-Wallet).",
      "4.2. Semua biaya dinyatakan dalam mata uang Rupiah (IDR) dan telah mencakup rincian pajak atau biaya administrasi yang berlaku kecuali dinyatakan lain secara eksplisit.",
      "4.3. Pembayaran dianggap sah dan terkonfirmasi setelah sistem payment gateway mengirimkan verifikasi sukses otomatis ke server kami.",
      "4.4. Kami tidak menyimpan informasi kartu kredit atau kredensial rahasia perbankan Anda pada server kami. Seluruh proses pembayaran tunduk pada standar keamanan payment gateway yang diawasi oleh Bank Indonesia.",
      "4.5. Pengguna wajib menyelesaikan pembayaran dalam batas waktu yang ditentukan pada tagihan transaksi.",
    ],
  },
  {
    id: "haki-lisensi",
    number: "Pasal 5",
    title: "Hak Kekayaan Intelektual",
    content: [
      `5.1. Seluruh kode sumber, desain UI/UX, logo, merek dagang, basis data, dokumentasi, dan materi visual ${BRAND_CONFIG.name} adalah hak milik eksklusif ${BRAND_CONFIG.company} dan dilindungi oleh undang-undang hak cipta dan kekayaan intelektual Republik Indonesia.`,
      "5.2. Kami memberikan Anda lisensi terbatas, non-eksklusif, tidak dapat dipindahtangankan, dan dapat dibatalkan semata-mata untuk menggunakan Layanan sesuai tujuan peruntukannya.",
      "5.3. Hak kepemilikan atas Konten Pengguna (data proyek dan berkas kerja) sepenuhnya tetap berada pada Pengguna. Anda memberikan kami lisensi terbatas semata-mata untuk meng-host, memproses, dan menampilkan konten tersebut demi terselenggaranya Layanan.",
    ],
  },
  {
    id: "kebijakan-refund",
    number: "Pasal 6",
    title: "Kebijakan Pengembalian Dana (Refund)",
    content: [
      "6.1. Karena sifat produk perangkat lunak dan layanan digital yang langsung aktif dan dapat diakses seketika setelah pembayaran terkonfirmasi, seluruh pembayaran pada dasarnya bersifat final dan tidak dapat dikembalikan (non-refundable).",
      `6.2. Pengecualian refund hanya dapat dipertimbangkan dalam kasus kesalahan sistem yang terverifikasi (misalnya transaksi terpotong ganda untuk satu pesanan yang sama). Pengajuan harus dikirimkan dalam kurun waktu maksimal 3x24 jam sejak transaksi melalui email ${BRAND_CONFIG.email} dengan melampirkan bukti transaksi resmi.`,
    ],
  },
  {
    id: "penggunaan-terlarang",
    number: "Pasal 7",
    title: "Batasan Penggunaan yang Diizinkan",
    content: [
      "7.1. Pengguna dilarang keras menggunakan Layanan untuk:",
      "a. Melakukan tindakan melawan hukum, penipuan, pelanggaran privasi, atau pencemaran nama baik;",
      "b. Mengunggah atau menyebarkan malware, virus, skrip perusak, atau melakukan percobaan rekayasa balik (reverse engineering);",
      "c. Mencoba menerobos pembatasan keamanan, melakukan eksploitasi celah kerentanan (vulnerability exploit), atau scraping data tanpa izin;",
      "d. Membebani infrastruktur server secara berlebihan (DDoS, spamming API, dsb.);",
      "e. Menyimpan atau mendistribusikan konten yang melanggar hak cipta pihak ketiga atau norma hukum Indonesia.",
      "7.2. Kami berhak menangguhkan atau memblokir akses Akun yang terindikasi melanggar ketentuan di atas tanpa pemberitahuan sebelumnya.",
    ],
  },
  {
    id: "batasan-tanggung-jawab",
    number: "Pasal 8",
    title: "Batasan Tanggung Jawab & Pelepasan Tuntutan",
    content: [
      `8.1. Layanan disediakan dengan dasar "sebagaimana adanya" (AS IS) dan "sebagaimana tersedia" (AS AVAILABLE). Sejauh diizinkan oleh hukum yang berlaku, ${BRAND_CONFIG.name} tidak memberikan jaminan tersirat atas kelayakan komersial atau kesesuaian untuk tujuan tertentu.`,
      "8.2. Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial, termasuk namun tidak terbatas pada hilangnya keuntungan, gangguan bisnis, atau kehilangan data akibat kelalaian Pengguna.",
      `8.3. Total kewajiban kumulatif ${BRAND_CONFIG.name} kepada Pengguna untuk klaim apa pun yang timbul dari Layanan dibatasi hingga jumlah total yang dibayarkan oleh Pengguna kepada kami dalam kurun waktu 3 (tiga) bulan terakhir sebelum timbulnya klaim.`,
    ],
  },
  {
    id: "penutupan-akun",
    number: "Pasal 9",
    title: "Penghentian Layanan & Penutupan Akun",
    content: [
      "9.1. Anda dapat berhenti menggunakan Layanan dan meminta penutupan akun kapan saja melalui menu pengaturan akun atau menghubungi tim dukungan kami.",
      "9.2. Kami berhak menangguhkan, membekukan, atau menghentikan Akun Anda apabila ditemukan pelanggaran terhadap Syarat & Ketentuan ini atau atas instruksi dari otoritas penegak hukum yang berwenang.",
      "9.3. Setelah akun ditutup, akses terhadap data proyek yang tersimpan dapat dihapus secara permanen sesuai dengan kebijakan retensi data kami.",
    ],
  },
  {
    id: "perubahan-syarat",
    number: "Pasal 10",
    title: "Pembaruan Syarat & Ketentuan",
    content: [
      `10.1. Kami berhak memperbarui dan memodifikasi Syarat & Ketentuan ini sewaktu-waktu. Setiap pembaruan akan ditandai dengan perubahan versi (${TERMS_VERSION}) dan tanggal "Terakhir diperbarui".`,
      "10.2. Apabila terjadi perubahan yang berdampak signifikan pada hak dan kewajiban Pengguna, kami akan memberikan pemberitahuan melalui email atau notifikasi banner di dalam aplikasi.",
      "10.3. Penggunaan berkelanjutan atas Layanan setelah tanggal efektif pembaruan dianggap sebagai persetujuan Anda yang mengikat secara hukum terhadap Syarat & Ketentuan yang telah diperbarui.",
    ],
  },
  {
    id: "hukum-penyelesaian-sengketa",
    number: "Pasal 11",
    title: "Hukum yang Berlaku & Penyelesaian Sengketa",
    content: [
      "11.1. Syarat & Ketentuan ini diatur dan ditafsirkan sepenuhnya berdasarkan hukum Negara Kesatuan Republik Indonesia.",
      "11.2. Segala perselisihan atau sengketa yang timbul sehubungan dengan penafsiran atau pelaksanaan perjanjian ini akan diselesaikan terlebih dahulu melalui musyawarah untuk mencapai mufakat dalam kurun waktu 30 (tiga puluh) hari kalender.",
      "11.3. Apabila mufakat tidak tercapai, sengketa akan diselesaikan melalui yurisdiksi eksklusif Pengadilan Negeri yang berwenang di wilayah hukum domisili kami.",
    ],
  },
  {
    id: "kontak-bantuan",
    number: "Pasal 12",
    title: "Kontak Resmi & Bantuan",
    content: [
      `12.1. Apabila Anda memiliki pertanyaan, keluhan, masukan, atau memerlukan klarifikasi terkait Syarat & Ketentuan ini, silakan hubungi tim kami secara resmi melalui:`,
      `• Email: ${BRAND_CONFIG.email}`,
      `• Situs Web: ${BRAND_CONFIG.url}`,
      `• Tim Dukungan: ${BRAND_CONFIG.name} Helpdesk & Compliance Team`,
    ],
  },
];
