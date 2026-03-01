# AbsensiKu PWA — Setup Guide

## Struktur Project

```
school-absensi-pwa/        ← Frontend PWA (project ini)
school-absensi/            ← Backend API (Node.js/Express)
```

---

## 1. Setup Backend (school-absensi)

```bash
cd school-absensi
npm install
cp .env.example .env        # Isi koneksi database
node -e "require('./backend/config/database')" # Test koneksi DB
mysql -u root -p school_absensi < schema.sql   # Import schema
npm start
# Backend berjalan di http://localhost:3000
```

---

## 2. Setup Frontend PWA

PWA ini adalah **pure HTML/CSS/JS** — tidak butuh build process!

### Cara Development (serve lokal):

**Opsi A — Python (paling cepat):**
```bash
cd school-absensi-pwa/public
python3 -m http.server 8080
# Buka http://localhost:8080
```

**Opsi B — Node.js http-server:**
```bash
npm install -g http-server
cd school-absensi-pwa/public
http-server -p 8080
```

**Opsi C — VS Code Live Server:**
Buka folder `school-absensi-pwa/public` di VS Code, klik "Go Live"

---

## 3. Konfigurasi API URL

Edit file `school-absensi-pwa/public/src/services/api.js` baris pertama:

```js
// Development (backend lokal):
const API_BASE = 'http://localhost:3000/api';

// Production (ganti dengan URL server):
const API_BASE = 'https://api.sekolah.anda.com/api';
```

Atau set via HTML sebelum load script:
```html
<script>window.API_BASE = 'http://localhost:3000/api';</script>
```

---

## 4. Menginstall di HP (PWA)

### Android:
1. Buka Chrome → ketuk ikon **⋮** → **"Tambahkan ke layar utama"**
2. Atau tunggu banner install muncul otomatis

### iOS (Safari):
1. Buka Safari → ketuk ikon **Share** (kotak panah ke atas)
2. Pilih **"Tambah ke Layar Utama"**

---

## 5. Deploy Production

### Opsi A — Nginx (disarankan):
```nginx
server {
    listen 80;
    server_name absensi.sekolahanda.com;
    root /var/www/school-absensi-pwa/public;
    index index.html;

    # PWA — semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # HTTPS required untuk PWA features
}
```

### Opsi B — File hosting sederhana:
Upload semua isi folder `public/` ke hosting (Netlify, Vercel, GitHub Pages, dll)

> ⚠️ **PWA butuh HTTPS** untuk Service Worker, Install prompt, dan Camera API

---

## 6. Akun Login Default

| Role | Identifier | Password |
|------|-----------|---------|
| Admin | admin@sekolah.com | admin123 |
| Guru | (NIP guru) | (password) |
| Siswa | (NIS siswa) | (password) |
| Kepsek | kepsek@sekolah.com | (password) |

---

## 7. Fitur PWA

| Fitur | Status |
|-------|--------|
| Installable di HP | ✅ |
| Offline cache | ✅ Service Worker |
| Bottom navigation | ✅ Mobile-first |
| Dark theme | ✅ Default |
| QR Code absensi | ✅ |
| Import Excel | ✅ SheetJS |
| Grafik interaktif | ✅ Chart.js |
| Kalender akademik | ✅ |
| Notifikasi bell | ✅ |
| Dashboard Kepsek | ✅ |

---

## 8. File Struktur PWA

```
public/
├── index.html          ← Shell utama PWA
├── manifest.json       ← PWA config
├── sw.js               ← Service Worker
├── icons/              ← App icons (generate sendiri)
└── src/
    ├── styles.css      ← Design system lengkap
    ├── app.js          ← Router & init
    ├── services/
    │   ├── api.js      ← API client
    │   └── store.js    ← State management
    ├── components/
    │   ├── toast.js    ← Toast notifications
    │   ├── modal.js    ← Bottom sheet modal
    │   └── calendar.js ← Kalender component
    └── pages/
        ├── dashboard/
        │   ├── admin.js
        │   ├── guru.js
        │   ├── siswa.js
        │   └── kepsek.js   ← Dashboard Kepala Sekolah
        ├── absensi/
        │   ├── harian.js
        │   ├── mapel.js
        │   └── qr.js
        ├── kalender.js     ← Kalender akademik
        ├── import.js       ← Import siswa Excel
        └── notifikasi.js   ← QR, Alert, Izin, Tren
```

---

## 9. Generate App Icons

Gunakan tool online untuk generate semua ukuran dari 1 logo:
- https://realfavicongenerator.net
- https://pwa-asset-generator.dev

Upload hasil ke folder `public/icons/`
