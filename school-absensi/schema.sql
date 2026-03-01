-- ============================================================
-- CREATE DATABASE
-- ============================================================
CREATE DATABASE IF NOT EXISTS school_absensi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_absensi;

-- School Absensi Schema
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS absensi_mapel;
DROP TABLE IF EXISTS absensi_harian;
DROP TABLE IF EXISTS jadwal_mengajar;
DROP TABLE IF EXISTS siswa;
DROP TABLE IF EXISTS guru;
DROP TABLE IF EXISTS kelas;
DROP TABLE IF EXISTS mapel;
DROP TABLE IF EXISTS jurusan;
DROP TABLE IF EXISTS tahun_ajaran;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','guru','siswa') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE tahun_ajaran (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(20) NOT NULL,
  semester ENUM('ganjil','genap') NOT NULL,
  is_active TINYINT(1) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_nama_semester (nama, semester)
);

CREATE TABLE jurusan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kelas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(50) NOT NULL,
  tingkat ENUM('X','XI','XII') NOT NULL,
  jurusan_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  wali_kelas_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jurusan_id) REFERENCES jurusan(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  FOREIGN KEY (wali_kelas_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_nama_ta (nama, tahun_ajaran_id),
  INDEX idx_ta (tahun_ajaran_id)
);

CREATE TABLE mapel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kode VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guru (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  nip VARCHAR(30) UNIQUE,
  is_walas TINYINT(1) DEFAULT 0,
  kelas_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
);

CREATE TABLE siswa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  nis VARCHAR(20) UNIQUE NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  is_ketua_kelas TINYINT(1) DEFAULT 0,
  is_alumni TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  INDEX idx_kelas (kelas_id),
  INDEX idx_ta (tahun_ajaran_id)
);

CREATE TABLE jadwal_mengajar (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guru_id INT NOT NULL,
  kelas_id INT NOT NULL,
  mapel_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  tipe_sesi ENUM('teori','praktek') DEFAULT 'teori',
  pola_minggu ENUM('semua','ganjil','genap') DEFAULT 'semua',
  jurusan_urutan INT DEFAULT NULL COMMENT '1=jurusan pertama, 2=jurusan kedua, NULL=semua',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guru_id) REFERENCES guru(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  FOREIGN KEY (mapel_id) REFERENCES mapel(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  UNIQUE KEY uk_jadwal (kelas_id, mapel_id, hari, jam_mulai, tahun_ajaran_id, pola_minggu),
  INDEX idx_ta (tahun_ajaran_id)
);

CREATE TABLE absensi_harian (
  id INT PRIMARY KEY AUTO_INCREMENT,
  siswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  tanggal DATE NOT NULL,
  status ENUM('hadir','sakit','izin','alpha') NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  dicatat_oleh INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  UNIQUE KEY uk_absensi_harian (siswa_id, tanggal, tahun_ajaran_id),
  INDEX idx_tanggal (tanggal),
  INDEX idx_kelas_ta (kelas_id, tahun_ajaran_id)
);

CREATE TABLE absensi_mapel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  siswa_id INT NOT NULL,
  jadwal_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  tanggal DATE NOT NULL,
  status ENUM('hadir','sakit','izin','alpha') NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_mengajar(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  UNIQUE KEY uk_absensi_mapel (siswa_id, jadwal_id, tanggal),
  INDEX idx_ta (tahun_ajaran_id)
);

CREATE TABLE activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- ============================================================
-- FITUR BARU v4: Alert, Izin, QR, Audit, Tren, Batas Kehadiran
-- ============================================================

-- Batas kehadiran minimum per kelas
ALTER TABLE kelas ADD COLUMN batas_kehadiran INT DEFAULT 75 COMMENT 'Persentase minimum kehadiran (%)';

-- Pengajuan izin/sakit terstruktur
CREATE TABLE IF NOT EXISTS pengajuan_izin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  siswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  jenis ENUM('izin','sakit') NOT NULL DEFAULT 'izin',
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  alasan TEXT NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL,
  catatan_reviewer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_siswa (siswa_id),
  INDEX idx_status (status),
  INDEX idx_kelas_ta (kelas_id, tahun_ajaran_id)
);

-- QR Code sesi absensi
CREATE TABLE IF NOT EXISTS qr_sesi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(64) UNIQUE NOT NULL,
  jadwal_id INT NOT NULL,
  guru_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tanggal DATE NOT NULL,
  expired_at TIMESTAMP NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_mengajar(id),
  FOREIGN KEY (guru_id) REFERENCES guru(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  INDEX idx_token (token),
  INDEX idx_active (is_active, expired_at)
);

-- Log scan QR oleh siswa
CREATE TABLE IF NOT EXISTS qr_scan_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  qr_sesi_id INT NOT NULL,
  siswa_id INT NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('hadir','terlambat','ditolak') DEFAULT 'hadir',
  FOREIGN KEY (qr_sesi_id) REFERENCES qr_sesi(id),
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  UNIQUE KEY uk_scan (qr_sesi_id, siswa_id)
);

-- Alert siswa berisiko
CREATE TABLE IF NOT EXISTS alert_siswa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  siswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  jenis ENUM('alpha_beruntun','batas_kehadiran','alpha_tinggi') NOT NULL,
  detail TEXT,
  is_read TINYINT(1) DEFAULT 0,
  dibaca_oleh INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id),
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  INDEX idx_kelas_ta (kelas_id, tahun_ajaran_id),
  INDEX idx_read (is_read)
);

-- Kalender Akademik
CREATE TABLE IF NOT EXISTS kalender_akademik (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(200) NOT NULL,
  tanggal DATE NOT NULL,
  jenis ENUM('libur','ujian','event','kegiatan') DEFAULT 'libur',
  tahun_ajaran_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  INDEX idx_tanggal (tanggal),
  INDEX idx_ta (tahun_ajaran_id)
);

-- Role kepsek support
ALTER TABLE users MODIFY COLUMN role ENUM('admin','guru','siswa','kepsek') NOT NULL DEFAULT 'siswa';
