# Flowchart Alur Aplikasi School Absensi

Dokumen ini berisi diagram alur (flowchart) komprehensif untuk sistem absensi sekolah. Untuk melihat versi visual yang lebih interaktif, silakan buka file [flowchart-visual.html](file:///d:/pkl/app%20absensi/flowchart-visual.html) di browser Anda.

## Alur Sistem Terintegrasi

```mermaid
graph TD
    %% Nodes
    Begin(["Mulai"])
    Login["Halaman Login"]
    Auth{"Validasi Akun"}
    RoleDecide{"Cek Role"}

    DashAdmin["Dashboard Admin"]
    DashGuru["Dashboard Guru"]
    DashSiswa["Dashboard Siswa"]
    DashKepsek["Dashboard Kepsek"]

    AdminMaster["Kelola Data Master (Siswa, Guru, Kelas, Mapel)"]
    AdminJadwal["Atur Jadwal & Blok Minggu"]
    AdminRekap["Generate Laporan (Excel/PDF)"]

    GuruJadwal["Pilih Jadwal Mengajar"]
    GuruQR["Generate QR Code Sesi"]
    GuruMonitor["Monitoring Kehadiran Real-time"]
    GuruIzin["Review Pengajuan Izin"]

    SiswaAbsenHarian["Absensi Harian"]
    SiswaAbsenMapel["Scan QR Absensi Mapel"]
    SiswaIzin["Ajukan Izin/Sakit"]

    Finish(["Selesai"])

    %% Connections
    Begin --> Login
    Login --> Auth
    Auth -->|Gagal| Login
    Auth -->|Sukses| RoleDecide

    RoleDecide -->|Admin| DashAdmin
    RoleDecide -->|Guru| DashGuru
    RoleDecide -->|Siswa| DashSiswa
    RoleDecide -->|Kepsek| DashKepsek

    DashAdmin --> AdminMaster
    DashAdmin --> AdminJadwal
    DashAdmin --> AdminRekap

    DashGuru --> GuruJadwal
    DashGuru --> GuruIzin
    GuruJadwal --> GuruQR
    GuruQR --> GuruMonitor

    DashSiswa --> SiswaAbsenHarian
    DashSiswa --> SiswaAbsenMapel
    DashSiswa --> SiswaIzin

    SiswaAbsenMapel -.->|Scan| GuruQR
    SiswaIzin -.->|Submit| GuruIzin

    GuruMonitor --> Finish
    AdminRekap --> Finish
    SiswaAbsenHarian --> Finish
    DashKepsek --> AdminRekap

    %% Styling
    style Begin fill:#f97316,stroke:#ea580c,color:#fff
    style Finish fill:#f97316,stroke:#ea580c,color:#fff
    style RoleDecide fill:#0ea5e9,stroke:#0284c7,color:#fff
    style Auth fill:#0ea5e9,stroke:#0284c7,color:#fff
    style DashAdmin fill:#4f46e5,stroke:#3730a3,color:#fff
    style DashGuru fill:#10b981,stroke:#059669,color:#fff
    style DashSiswa fill:#f59e0b,stroke:#d97706,color:#fff
```
