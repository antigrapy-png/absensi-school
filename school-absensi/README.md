# 🏫 Sistem Absensi Sekolah

Aplikasi web absensi sekolah production-ready dengan Node.js + Express + MariaDB + Tailwind CSS.

## Stack
- **Backend**: Node.js, Express, JWT, bcryptjs
- **Database**: MariaDB / MySQL
- **Frontend**: Vanilla JS, Tailwind CSS (CDN), Chart.js

## Fitur
- ✅ 3 Role: Admin, Guru, Siswa
- ✅ 30 Kelas auto-generate (5 Jurusan × 3 Tingkat × 2 Kelas)
- ✅ Multi Semester (Ganjil/Genap)
- ✅ Absensi Harian & Absensi Mapel
- ✅ Auto naik tingkat (X→XI→XII→Alumni)
- ✅ Export Excel (per semester/kelas/global)
- ✅ Dashboard role-based dengan grafik
- ✅ Bulk action siswa
- ✅ Activity Log
- ✅ Rekap & statistik per semester

## Setup

### 1. Install dependencies
```bash
cd school-absensi
npm install
```

### 2. Setup database
```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE school_absensi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p school_absensi < schema.sql
```

### 3. Konfigurasi .env
```bash
cp .env .env.local
# Edit .env sesuai konfigurasi database Anda
```

Edit file `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_absensi
JWT_SECRET=ganti_dengan_secret_yang_kuat
```

### 4. Jalankan seeder
```bash
npm run seed
```

Output seeder:
- 2 Tahun Ajaran (2026/2027 Ganjil aktif, Genap nonaktif)
- 5 Jurusan (RPL, TEI, PBS, TKR, TBO)
- 30 Kelas per semester
- 30+ Guru (1 walas per kelas)
- 450 Siswa (15 per kelas, 1 ketua kelas per kelas)
- 10 Mata Pelajaran

### 5. Jalankan server
```bash
npm start
# atau development mode
npm run dev
```

Akses: http://localhost:3000

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin1@school.com | admin123 |
| Admin | admin2@school.com | admin123 |
| Guru Walas X RPL 1 | guru01@school.com | guru123 |
| Siswa pertama | siswa00001@school.com | siswa123 |

## Struktur Project
```
school-absensi/
├── backend/
│   ├── config/database.js          # Koneksi database
│   ├── modules/
│   │   ├── auth/auth.routes.js     # Login, me, change-password
│   │   ├── semester/               # CRUD semester, naik tingkat
│   │   ├── jurusan/                # CRUD jurusan
│   │   ├── kelas/                  # CRUD kelas, detail siswa
│   │   ├── guru/                   # CRUD guru
│   │   ├── siswa/                  # CRUD siswa, bulk action
│   │   ├── mapel/                  # CRUD mata pelajaran
│   │   ├── jadwal/                 # CRUD jadwal mengajar
│   │   ├── absensi/                # Absensi harian & mapel
│   │   └── rekap/                  # Dashboard & statistik
│   ├── middlewares/auth.js         # JWT auth, role check, activity log
│   ├── utils/excelGenerator.js     # Export Excel
│   ├── seeders/seeder.js           # Auto-generate data
│   ├── routes.js                   # Route aggregator + export
│   └── app.js                      # Entry point
├── public/js/main.js               # SPA frontend
├── views/index.html                # Single HTML
├── schema.sql                      # Database schema
├── .env                            # Environment config
└── package.json
```

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | User info |
| GET | /api/semester | List semester |
| POST | /api/semester | Tambah semester |
| PUT | /api/semester/:id/activate | Aktifkan semester |
| POST | /api/semester/:id/duplicate-kelas | Duplikat kelas |
| POST | /api/semester/naik-tingkat | Naik kelas otomatis |
| GET | /api/kelas | List kelas |
| GET | /api/kelas/:id/siswa | Siswa per kelas |
| GET | /api/guru | List guru |
| GET | /api/siswa | List siswa |
| POST | /api/siswa/bulk-action | Bulk aksi siswa |
| GET | /api/absensi/harian | Data absensi harian |
| POST | /api/absensi/harian/bulk | Input absensi harian |
| GET | /api/absensi/harian/rekap | Rekap per kelas |
| POST | /api/absensi/mapel/bulk | Input absensi mapel |
| GET | /api/absensi/siswa/:id | Riwayat siswa |
| GET | /api/absensi/statistik | Statistik global |
| GET | /api/rekap/dashboard | Dashboard data |
| GET | /api/export/excel | Export Excel |
| GET | /api/logs | Activity log |

## Rules Bisnis
- Absensi terkunci setelah 24 jam
- Semester non-aktif = read-only
- Unique absensi per siswa per hari per semester
- Unique absensi mapel per siswa per jadwal per tanggal
- Auto-log semua aksi penting ke activity_log
