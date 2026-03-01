/**
 * JADWAL GENERATOR LENGKAP - SMKN 1 BABELAN
 * Semester Genap Tahun Pelajaran 2025-2026
 * Berisi: Jadwal TEORI + PRAKTIK
 *
 * Usage:
 *   node jadwal-all.js
 *   atau import sebagai module:
 *   const jadwalAll = require('./jadwal-all')
 *
 *   // Akses teori
 *   jadwalAll.teori.getJadwalByKelas('X TEI 1')
 *
 *   // Akses praktik
 *   jadwalAll.praktik.getJadwalByKelas('X TEI 1')
 *
 *   // Gabungan semua sesi (flat)
 *   jadwalAll.getAllFlat()
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

const HARI = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
};

/** Buat satu entry sesi jadwal */
function j(hari, jamMulai, jamSelesai, mapel, guru) {
  return { hari, jamMulai, jamSelesai, mapel, guru };
}

/** Fungsi query umum — dipakai oleh teori & praktik */
function buildQueryFunctions(jadwal) {
  return {
    getAll: () => jadwal,

    getByKelas: (namaKelas) => jadwal[namaKelas] || [],

    getByHari: (hari) => {
      const result = {};
      for (const [namaKelas, sesi] of Object.entries(jadwal)) {
        const filtered = sesi.filter((s) => s.hari === hari);
        if (filtered.length > 0) result[namaKelas] = filtered;
      }
      return result;
    },

    getByGuru: (namaGuru) => {
      const result = [];
      for (const [namaKelas, sesi] of Object.entries(jadwal)) {
        sesi.forEach((s) => {
          if (s.guru === namaGuru) result.push({ kelas: namaKelas, ...s });
        });
      }
      return result;
    },

    getFlat: (tipe) => {
      const flat = [];
      for (const [namaKelas, sesi] of Object.entries(jadwal)) {
        sesi.forEach((s, i) => {
          flat.push({
            id: `${tipe.toUpperCase()}_${namaKelas.replace(/\s/g, "_")}_${s.hari}_${i}`,
            tipe,
            kelas: namaKelas,
            hari: s.hari,
            jamMulai: s.jamMulai,
            jamSelesai: s.jamSelesai,
            mapel: s.mapel,
            guru: s.guru,
          });
        });
      }
      return flat;
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  ████████╗███████╗ ██████╗ ██████╗ ██╗
//     ██╔══╝██╔════╝██╔═══██╗██╔══██╗██║
//     ██║   █████╗  ██║   ██║██████╔╝██║
//     ██║   ██╔══╝  ██║   ██║██╔══██╗██║
//     ██║   ███████╗╚██████╔╝██║  ██║██║
//     ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝
// ═════════════════════════════════════════════════════════════════════════════

// ─── MASTER: MATA PELAJARAN (TEORI) ───────────────────────────────────────
const mapelTeori = [
  { kode: "PAI", nama: "Pendidikan Agama Islam" },
  { kode: "PJOK", nama: "Pendidikan Jasmani, Olahraga & Kesehatan" },
  { kode: "BING", nama: "Bahasa Inggris" },
  { kode: "BINDO", nama: "Bahasa Indonesia" },
  { kode: "MTK", nama: "Matematika" },
  { kode: "BI", nama: "Bahasa Indonesia (Vokasi)" },
  { kode: "PP", nama: "Projek Penguatan Profil Pelajar Pancasila (P5)" },
  { kode: "KIK", nama: "Kompetensi Inti Kejuruan" },
  { kode: "MPP", nama: "Mata Pelajaran Pilihan" },
  { kode: "IPAS", nama: "Ilmu Pengetahuan Alam dan Sosial" },
  { kode: "SB", nama: "Seni Budaya" },
  { kode: "S", nama: "Sejarah" },
  { kode: "B SUNDA", nama: "Bahasa Sunda" },
];

// ─── MASTER: GURU (TEORI) ─────────────────────────────────────────────────
const guruTeori = [
  { id: 1, nama: "Ainah Diah Vika", mapel: ["BING", "PAI"] },
  { id: 2, nama: "Adi Yoga S", mapel: ["PJOK"] },
  { id: 3, nama: "Darsono", mapel: ["PAI", "BING"] },
  { id: 4, nama: "Siti Nurkhasanah", mapel: ["MTK", "PAI"] },
  { id: 5, nama: "Nurdariatiningsih", mapel: ["B SUNDA"] },
  { id: 6, nama: "Kuswara", mapel: ["B SUNDA", "PAI", "KIK"] },
  { id: 7, nama: "Fuji Lestari", mapel: ["BINDO"] },
  { id: 8, nama: "Yayat Anwar H", mapel: ["PAI"] },
  { id: 9, nama: "Sapto Hartono", mapel: ["MTK"] },
  { id: 10, nama: "Respi Retna N", mapel: ["BINDO", "KIK"] },
  { id: 11, nama: "Udin Zachrudin", mapel: ["PAI", "BING"] },
  { id: 12, nama: "Arief Surahman", mapel: ["BINDO", "MTK"] },
  { id: 13, nama: "Nabella Azannia S", mapel: ["KIK", "BING"] },
  { id: 14, nama: "Siti Fatimah", mapel: ["MTK", "PP"] },
  { id: 15, nama: "Asdim", mapel: ["KIK", "IPAS"] },
  { id: 16, nama: "Iyan Supriyatna", mapel: ["KIK", "BI"] },
  { id: 17, nama: "Wiwik Indrawati", mapel: ["BING", "PAI"] },
  { id: 18, nama: "Sanusi", mapel: ["PAI", "PP"] },
  { id: 19, nama: "Safitri Khoirunnisa", mapel: ["PAI", "KIK", "BING"] },
  { id: 20, nama: "Taryono", mapel: ["PAI", "IPAS", "SB"] },
  { id: 21, nama: "Khaerul Ikhfan", mapel: ["KIK"] },
  { id: 22, nama: "Siti Khodijah", mapel: ["BINDO", "SB", "S"] },
  { id: 23, nama: "H. Abu Ala Almaududi", mapel: ["PAI"] },
  { id: 24, nama: "Joko Andrianto", mapel: ["BI", "KIK"] },
  { id: 25, nama: "Silvira", mapel: ["B SUNDA", "SB"] },
  { id: 26, nama: "Susi Wulandari", mapel: ["BINDO", "MTK"] },
  { id: 27, nama: "Utami Putri Shafira", mapel: ["BI", "BINDO"] },
  { id: 28, nama: "Bulan Novanda J", mapel: ["BING"] },
  { id: 29, nama: "Riyadi Pria Dwi", mapel: ["PP", "BINDO"] },
  { id: 30, nama: "Setiowati Dwi Rimbawani", mapel: ["KIK"] },
  { id: 31, nama: "Pringgo Willy P", mapel: ["IPAS", "SB"] },
  { id: 32, nama: "Wahyu Lesmono", mapel: ["KIK", "PP"] },
  { id: 33, nama: "Narasa", mapel: ["IPAS", "PP", "S"] },
  { id: 34, nama: "Zakiah Drazat", mapel: ["SB", "PAI"] },
  { id: 35, nama: "Siti Cholifah", mapel: ["IPAS", "SB"] },
  { id: 36, nama: "Nurainih", mapel: ["PAI", "KIK"] },
  { id: 37, nama: "Ade Kosasih", mapel: ["PAI", "KIK"] },
  { id: 38, nama: "Imron", mapel: ["KIK"] },
  { id: 39, nama: "Asep Hermawan", mapel: ["BI"] },
  { id: 40, nama: "Syamsul Aribowo", mapel: ["KIK"] },
];

// ─── MASTER: KELAS ────────────────────────────────────────────────────────
const kelasMaster = [
  // X
  { id: 1, nama: "X TEI 1", tingkat: "X", jurusan: "TEI", rombel: 1 },
  { id: 2, nama: "X TEI 2", tingkat: "X", jurusan: "TEI", rombel: 2 },
  { id: 3, nama: "X TKR 1", tingkat: "X", jurusan: "TKR", rombel: 1 },
  { id: 4, nama: "X TKR 2", tingkat: "X", jurusan: "TKR", rombel: 2 },
  { id: 5, nama: "X RPL 1", tingkat: "X", jurusan: "RPL", rombel: 1 },
  { id: 6, nama: "X RPL 2", tingkat: "X", jurusan: "RPL", rombel: 2 },
  { id: 7, nama: "X TBO 1", tingkat: "X", jurusan: "TBO", rombel: 1 },
  { id: 8, nama: "X TBO 2", tingkat: "X", jurusan: "TBO", rombel: 2 },
  { id: 9, nama: "X PBS 1", tingkat: "X", jurusan: "PBS", rombel: 1 },
  { id: 10, nama: "X PBS 2", tingkat: "X", jurusan: "PBS", rombel: 2 },
  // XI
  { id: 11, nama: "XI TEI 1", tingkat: "XI", jurusan: "TEI", rombel: 1 },
  { id: 12, nama: "XI TEI 2", tingkat: "XI", jurusan: "TEI", rombel: 2 },
  { id: 13, nama: "XI TKR 1", tingkat: "XI", jurusan: "TKR", rombel: 1 },
  { id: 14, nama: "XI TKR 2", tingkat: "XI", jurusan: "TKR", rombel: 2 },
  { id: 15, nama: "XI RPL 1", tingkat: "XI", jurusan: "RPL", rombel: 1 },
  { id: 16, nama: "XI RPL 2", tingkat: "XI", jurusan: "RPL", rombel: 2 },
  { id: 17, nama: "XI TBO 1", tingkat: "XI", jurusan: "TBO", rombel: 1 },
  { id: 18, nama: "XI TBO 2", tingkat: "XI", jurusan: "TBO", rombel: 2 },
  { id: 19, nama: "XI PBS 1", tingkat: "XI", jurusan: "PBS", rombel: 1 },
  { id: 20, nama: "XI PBS 2", tingkat: "XI", jurusan: "PBS", rombel: 2 },
  // XII
  { id: 21, nama: "XII TEI 1", tingkat: "XII", jurusan: "TEI", rombel: 1 },
  { id: 22, nama: "XII TEI 2", tingkat: "XII", jurusan: "TEI", rombel: 2 },
  { id: 23, nama: "XII TKR 1", tingkat: "XII", jurusan: "TKR", rombel: 1 },
  { id: 24, nama: "XII TKR 2", tingkat: "XII", jurusan: "TKR", rombel: 2 },
  { id: 25, nama: "XII RPL 1", tingkat: "XII", jurusan: "RPL", rombel: 1 },
  { id: 26, nama: "XII RPL 2", tingkat: "XII", jurusan: "RPL", rombel: 2 },
  { id: 27, nama: "XII TBO 1", tingkat: "XII", jurusan: "TBO", rombel: 1 },
  { id: 28, nama: "XII TBO 2", tingkat: "XII", jurusan: "TBO", rombel: 2 },
  { id: 29, nama: "XII PBS 1", tingkat: "XII", jurusan: "PBS", rombel: 1 },
  { id: 30, nama: "XII PBS 2", tingkat: "XII", jurusan: "PBS", rombel: 2 },
];

// ─── DATA JADWAL TEORI ────────────────────────────────────────────────────
const jadwalTeori = {
  // ── KELAS X ──
  "X TEI 1": [
    j(HARI.SENIN, 1, 2, "IPAS", "Narasa"),
    j(HARI.SENIN, 3, 5, "PAI", "Yayat Anwar H"),
    j(HARI.SENIN, 6, 7, "BINDO", "Nurdariatiningsih"),
    j(HARI.SELASA, 1, 3, "BING", "Ainah Diah Vika"),
    j(HARI.SELASA, 4, 6, "BINDO", "Respi Retna N"),
    j(HARI.RABU, 1, 2, "SB", "Zakiah Drazat"),
    j(HARI.RABU, 3, 5, "BING", "Narasa"),
    j(HARI.RABU, 6, 7, "BINDO", "Taryono"),
    j(HARI.KAMIS, 1, 3, "IPAS", "Nurdariatiningsih"),
    j(HARI.KAMIS, 4, 6, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.JUMAT, 1, 2, "PP", "Siti Khodijah"),
    j(HARI.JUMAT, 3, 4, "PAI", "Udin Zachrudin"),
  ],
  "X TEI 2": [
    j(HARI.SENIN, 1, 2, "BING", "Ainah Diah Vika"),
    j(HARI.SENIN, 3, 5, "S", "Narasa"),
    j(HARI.SENIN, 6, 7, "PAI", "Yayat Anwar H"),
    j(HARI.SELASA, 1, 3, "IPAS", "Narasa"),
    j(HARI.SELASA, 4, 6, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.RABU, 1, 2, "SB", "Zakiah Drazat"),
    j(HARI.RABU, 3, 5, "PP", "Narasa"),
    j(HARI.RABU, 6, 7, "PAI", "Yayat Anwar H"),
    j(HARI.KAMIS, 1, 3, "IPAS", "Siti Cholifah"),
    j(HARI.KAMIS, 4, 6, "BINDO", "Nurdariatiningsih"),
    j(HARI.JUMAT, 1, 2, "B SUNDA", "Kuswara"),
    j(HARI.JUMAT, 3, 4, "BING", "Ainah Diah Vika"),
  ],
  "X TKR 1": [
    j(HARI.SENIN, 1, 2, "BING", "Ainah Diah Vika"),
    j(HARI.SENIN, 3, 5, "PP", "Udin Zachrudin"),
    j(HARI.SENIN, 6, 7, "PAI", "Narasa"),
    j(HARI.SELASA, 1, 3, "SB", "Zakiah Drazat"),
    j(HARI.SELASA, 4, 6, "S", "Narasa"),
    j(HARI.RABU, 1, 2, "BINDO", "Wahyu Lesmono"),
    j(HARI.RABU, 3, 5, "PP", "Narasa"),
    j(HARI.RABU, 6, 7, "IPAS", "Pringgo Willy P"),
    j(HARI.KAMIS, 1, 3, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.KAMIS, 4, 6, "IPAS", "Pringgo Willy P"),
    j(HARI.JUMAT, 1, 2, "PAI", "Udin Zachrudin"),
    j(HARI.JUMAT, 3, 4, "B SUNDA", "Kuswara"),
  ],
  "X TKR 2": [
    j(HARI.SENIN, 1, 2, "IPAS", "Siti Cholifah"),
    j(HARI.SENIN, 3, 5, "BING", "Silvira"),
    j(HARI.SENIN, 6, 7, "PP", "Sanusi"),
    j(HARI.SELASA, 1, 3, "SB", "Zakiah Drazat"),
    j(HARI.SELASA, 4, 6, "PAI", "Yayat Anwar H"),
    j(HARI.RABU, 1, 2, "BINDO", "Ainah Diah Vika"),
    j(HARI.RABU, 3, 5, "PAI", "Yayat Anwar H"),
    j(HARI.RABU, 6, 7, "BINDO", "Ainah Diah Vika"),
    j(HARI.KAMIS, 1, 3, "BING", "Siti Khodijah"),
    j(HARI.KAMIS, 4, 6, "IPAS", "Siti Cholifah"),
    j(HARI.JUMAT, 1, 2, "IPAS", "Siti Khodijah"),
    j(HARI.JUMAT, 3, 4, "B SUNDA", "Kuswara"),
  ],
  "X RPL 1": [
    j(HARI.SENIN, 1, 2, "BINDO", "Asdim"),
    j(HARI.SENIN, 3, 5, "S", "Narasa"),
    j(HARI.SENIN, 6, 7, "PAI", "Yayat Anwar H"),
    j(HARI.SELASA, 1, 3, "BING", "Ainah Diah Vika"),
    j(HARI.SELASA, 4, 6, "IPAS", "Narasa"),
    j(HARI.RABU, 1, 2, "BINDO", "Narasa"),
    j(HARI.RABU, 3, 5, "IPAS", "Pringgo Willy P"),
    j(HARI.RABU, 6, 7, "B SUNDA", "Nurdariatiningsih"),
    j(HARI.KAMIS, 1, 3, "BING", "Ainah Diah Vika"),
    j(HARI.KAMIS, 4, 6, "S", "Narasa"),
    j(HARI.JUMAT, 1, 2, "PP", "Yayat Anwar H"),
    j(HARI.JUMAT, 3, 4, "SB", "Zakiah Drazat"),
  ],
  "X RPL 2": [
    j(HARI.SENIN, 1, 2, "BINDO", "Asdim"),
    j(HARI.SENIN, 3, 5, "PAI", "Yayat Anwar H"),
    j(HARI.SENIN, 6, 7, "IPAS", "Pringgo Willy P"),
    j(HARI.SELASA, 1, 3, "BING", "Wiwik Indrawati"),
    j(HARI.SELASA, 4, 6, "IPAS", "Narasa"),
    j(HARI.RABU, 1, 2, "BINDO", "Zakiah Drazat"),
    j(HARI.RABU, 3, 5, "IPAS", "Ainah Diah Vika"),
    j(HARI.RABU, 6, 7, "S", "Narasa"),
    j(HARI.KAMIS, 1, 3, "BING", "Wiwik Indrawati"),
    j(HARI.JUMAT, 1, 2, "PAI", "Yayat Anwar H"),
    j(HARI.JUMAT, 3, 4, "B SUNDA", "Ainah Diah Vika"),
  ],
  "X TBO 1": [
    j(HARI.SENIN, 1, 2, "B SUNDA", "Yayat Anwar H"),
    j(HARI.SENIN, 3, 5, "IPAS", "Siti Khodijah"),
    j(HARI.SENIN, 6, 7, "BINDO", "Respi Retna N"),
    j(HARI.SELASA, 1, 3, "IPAS", "Siti Cholifah"),
    j(HARI.SELASA, 4, 6, "BINDO", "Pringgo Willy P"),
    j(HARI.RABU, 1, 2, "BINDO", "Respi Retna N"),
    j(HARI.RABU, 3, 5, "PAI", "Udin Zachrudin"),
    j(HARI.RABU, 6, 7, "SB", "Zakiah Drazat"),
    j(HARI.KAMIS, 1, 3, "S", "Siti Khodijah"),
    j(HARI.KAMIS, 4, 6, "SB", "Zakiah Drazat"),
    j(HARI.JUMAT, 1, 2, "BING", "Silvira"),
    j(HARI.JUMAT, 3, 4, "PP", "Siti Khodijah"),
  ],
  "X TBO 2": [
    j(HARI.SENIN, 1, 2, "B SUNDA", "Respi Retna N"),
    j(HARI.SENIN, 3, 5, "IPAS", "Siti Cholifah"),
    j(HARI.SENIN, 6, 7, "BINDO", "Pringgo Willy P"),
    j(HARI.SELASA, 1, 3, "IPAS", "Siti Cholifah"),
    j(HARI.SELASA, 4, 6, "BINDO", "Pringgo Willy P"),
    j(HARI.RABU, 1, 2, "BINDO", "Darsono"),
    j(HARI.RABU, 3, 5, "PAI", "Taryono"),
    j(HARI.RABU, 6, 7, "BING", "Silvira"),
    j(HARI.KAMIS, 1, 3, "S", "Siti Khodijah"),
    j(HARI.KAMIS, 4, 6, "SB", "Zakiah Drazat"),
    j(HARI.JUMAT, 1, 2, "PP", "Taryono"),
    j(HARI.JUMAT, 3, 4, "BING", "Silvira"),
  ],
  "X PBS 1": [
    j(HARI.SENIN, 1, 2, "PP", "Narasa"),
    j(HARI.SENIN, 3, 5, "IPAS", "Nurdariatiningsih"),
    j(HARI.SENIN, 6, 7, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.SELASA, 1, 3, "PAI", "Darsono"),
    j(HARI.SELASA, 4, 6, "BINDO", "Yayat Anwar H"),
    j(HARI.RABU, 1, 2, "B SUNDA", "Nurdariatiningsih"),
    j(HARI.RABU, 3, 5, "SB", "Zakiah Drazat"),
    j(HARI.RABU, 6, 7, "IPAS", "Riyadi Pria Dwi"),
    j(HARI.KAMIS, 1, 3, "BING", "Silvira"),
    j(HARI.KAMIS, 4, 6, "IPAS", "Nurdariatiningsih"),
    j(HARI.JUMAT, 1, 2, "S", "Narasa"),
    j(HARI.JUMAT, 3, 4, "BING", "Silvira"),
  ],
  "X PBS 2": [
    j(HARI.SENIN, 1, 2, "PP", "Narasa"),
    j(HARI.SENIN, 3, 5, "PAI", "Darsono"),
    j(HARI.SENIN, 6, 7, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.SELASA, 1, 3, "IPAS", "Nabella Azannia S"),
    j(HARI.SELASA, 4, 6, "S", "Zakiah Drazat"),
    j(HARI.RABU, 1, 2, "B SUNDA", "Riyadi Pria Dwi"),
    j(HARI.RABU, 3, 5, "SB", "Zakiah Drazat"),
    j(HARI.RABU, 6, 7, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.KAMIS, 1, 3, "IPAS", "Siti Cholifah"),
    j(HARI.KAMIS, 4, 6, "BING", "Taryono"),
    j(HARI.JUMAT, 1, 2, "PAI", "Yayat Anwar H"),
    j(HARI.JUMAT, 3, 4, "B SUNDA", "Taryono"),
  ],

  // ── KELAS XI ──
  "XI TEI 1": [
    j(HARI.SENIN, 1, 2, "KIK", "Pringgo Willy P"),
    j(HARI.SENIN, 3, 5, "PJOK", "Adi Yoga S"),
    j(HARI.SENIN, 6, 8, "BINDO", "Respi Retna N"),
    j(HARI.SENIN, 9, 10, "SB", "Zakiah Drazat"),
    j(HARI.SELASA, 1, 3, "MTK", "Sapto Hartono"),
    j(HARI.SELASA, 4, 5, "BING", "Safitri Khoirunnisa"),
    j(HARI.RABU, 1, 2, "BING", "Safitri Khoirunnisa"),
    j(HARI.RABU, 3, 5, "PAI", "Yayat Anwar H"),
    j(HARI.KAMIS, 1, 3, "BINDO", "Respi Retna N"),
    j(HARI.KAMIS, 4, 6, "BI", "Zakiah Drazat"),
    j(HARI.KAMIS, 7, 8, "SB", "Siti Khodijah"),
    j(HARI.KAMIS, 9, 10, "PP", "Yayat Anwar H"),
    j(HARI.JUMAT, 1, 2, "BI", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "PAI", "Yayat Anwar H"),
  ],
  "XI TEI 2": [
    j(HARI.SENIN, 1, 2, "KIK", "Pringgo Willy P"),
    j(HARI.SENIN, 3, 5, "PJOK", "Adi Yoga S"),
    j(HARI.SENIN, 6, 8, "PAI", "Darsono"),
    j(HARI.SELASA, 1, 3, "BI", "Fuji Lestari"),
    j(HARI.SELASA, 4, 5, "MTK", "Safitri Khoirunnisa"),
    j(HARI.RABU, 1, 2, "MTK", "Safitri Khoirunnisa"),
    j(HARI.RABU, 3, 5, "BING", "Safitri Khoirunnisa"),
    j(HARI.KAMIS, 1, 3, "S", "Nurdariatiningsih"),
    j(HARI.KAMIS, 4, 6, "BINDO", "Ainah Diah Vika"),
    j(HARI.KAMIS, 7, 8, "MTK", "Sanusi"),
    j(HARI.JUMAT, 1, 2, "BI", "Ainah Diah Vika"),
    j(HARI.JUMAT, 3, 4, "BINDO", "Ainah Diah Vika"),
  ],
  "XI TKR 1": [
    j(HARI.SENIN, 1, 2, "KIK", "Iyan Supriatna"),
    j(HARI.SENIN, 3, 5, "PP", "Siti Khodijah"),
    j(HARI.SENIN, 6, 8, "MTK", "Fuji Lestari"),
    j(HARI.SELASA, 1, 3, "BINDO", "Fuji Lestari"),
    j(HARI.SELASA, 4, 5, "PJOK", "Ainah Diah Vika"),
    j(HARI.RABU, 1, 3, "S", "Pringgo Willy P"),
    j(HARI.RABU, 4, 6, "BING", "Ainah Diah Vika"),
    j(HARI.KAMIS, 1, 3, "BI", "Iyan Supriyatna"),
    j(HARI.KAMIS, 4, 6, "MTK", "Fuji Lestari"),
    j(HARI.KAMIS, 7, 8, "PAI", "Yayat Anwar H"),
    j(HARI.JUMAT, 1, 2, "BI", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "PAI", "Susi Wulandari"),
  ],
  "XI TKR 2": [
    j(HARI.SENIN, 1, 2, "KIK", "Iyan Supriatna"),
    j(HARI.SENIN, 3, 5, "PP", "Siti Khodijah"),
    j(HARI.SENIN, 6, 8, "S", "Wiwik Indrawati"),
    j(HARI.SELASA, 1, 3, "BINDO", "Respi Retna N"),
    j(HARI.SELASA, 4, 5, "PJOK", "Adi Yoga S"),
    j(HARI.RABU, 1, 3, "PJOK", "Siti Khodijah"),
    j(HARI.RABU, 4, 6, "BING", "Wiwik Indrawati"),
    j(HARI.KAMIS, 1, 3, "MTK", "Siti Nurkhasanah"),
    j(HARI.KAMIS, 4, 6, "BI", "Udin Zachrudin"),
    j(HARI.JUMAT, 1, 2, "MTK", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "BI", "Siti Nurkhasanah"),
  ],
  "XI RPL 1": [
    j(HARI.SENIN, 1, 3, "S", "Fuad"),
    j(HARI.SENIN, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.SELASA, 1, 3, "BING", "Imron"),
    j(HARI.SELASA, 4, 6, "PJOK", "Kuswara"),
    j(HARI.RABU, 1, 3, "PAI", "Susi Wulandari"),
    j(HARI.RABU, 4, 6, "BI", "Respi Retna N"),
    j(HARI.KAMIS, 1, 3, "MTK", "Siti Khodijah"),
    j(HARI.KAMIS, 4, 6, "BING", "Kuswara"),
    j(HARI.KAMIS, 7, 8, "PP", "Susi Wulandari"),
    j(HARI.JUMAT, 1, 2, "BI", "Respi Retna N"),
    j(HARI.JUMAT, 3, 4, "BINDO", "Narasa"),
  ],
  "XI RPL 2": [
    j(HARI.SENIN, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.SENIN, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.SELASA, 1, 3, "BING", "Ainah Diah Vika"),
    j(HARI.SELASA, 4, 6, "PP", "Narasa"),
    j(HARI.RABU, 1, 3, "BI", "Susi Wulandari"),
    j(HARI.RABU, 4, 6, "BINDO", "Respi Retna N"),
    j(HARI.KAMIS, 1, 3, "MTK", "Zakiah Drazat"),
    j(HARI.KAMIS, 4, 6, "PAI", "Ainah Diah Vika"),
    j(HARI.JUMAT, 1, 2, "BI", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "MTK", "Siti Nurkhasanah"),
  ],
  "XI TBO 1": [
    j(HARI.SENIN, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.SENIN, 4, 6, "KIK", "Asdim"),
    j(HARI.SELASA, 1, 3, "PAI", "Karimah"),
    j(HARI.SELASA, 4, 6, "BINDO", "Nabella Azannia S"),
    j(HARI.RABU, 1, 3, "PP", "Siti Khodijah"),
    j(HARI.RABU, 4, 6, "BI", "Riyadi Pria Dwi"),
    j(HARI.KAMIS, 1, 3, "BING", "Udin Zachrudin"),
    j(HARI.KAMIS, 4, 6, "MTK", "Utami Putri Shafira"),
    j(HARI.KAMIS, 7, 8, "BI", "Utami Putri Shafira"),
    j(HARI.JUMAT, 1, 2, "MTK", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "MTK", "Siti Nurkhasanah"),
  ],
  "XI TBO 2": [
    j(HARI.SENIN, 1, 3, "S", "Narasa"),
    j(HARI.SENIN, 4, 6, "KIK", "Asdim"),
    j(HARI.SELASA, 1, 3, "PAI", "Karimah"),
    j(HARI.SELASA, 4, 6, "MTK", "Fuji Lestari"),
    j(HARI.RABU, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.RABU, 4, 6, "BINDO", "Ainah Diah Vika"),
    j(HARI.KAMIS, 1, 3, "MTK", "Ainah Diah Vika"),
    j(HARI.KAMIS, 4, 6, "BI", "Siti Khodijah"),
    j(HARI.JUMAT, 1, 2, "BING", "Utami Putri Shafira"),
    j(HARI.JUMAT, 3, 4, "MTK", "Fuji Lestari"),
  ],
  "XI PBS 1": [
    j(HARI.SENIN, 1, 3, "PP", "Siti Khodijah"),
    j(HARI.SENIN, 4, 6, "KIK", "Siti Nurkhasanah"),
    j(HARI.SELASA, 1, 3, "BI", "Joko Andrianto"),
    j(HARI.SELASA, 4, 6, "MTK", "Siti Nurkhasanah"),
    j(HARI.RABU, 1, 3, "PAI", "Udin Zachrudin"),
    j(HARI.RABU, 4, 6, "MTK", "Adi Yoga S"),
    j(HARI.KAMIS, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.KAMIS, 4, 6, "BING", "Safitri Khoirunnisa"),
    j(HARI.KAMIS, 7, 8, "BINDO", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 1, 2, "BINDO", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 3, 4, "BI", "Siti Nurkhasanah"),
  ],
  "XI PBS 2": [
    j(HARI.SENIN, 1, 3, "PP", "Siti Khodijah"),
    j(HARI.SENIN, 4, 6, "KIK", "Siti Nurkhasanah"),
    j(HARI.SELASA, 1, 3, "BI", "Joko Andrianto"),
    j(HARI.SELASA, 4, 6, "MTK", "Siti Fatimah"),
    j(HARI.RABU, 1, 3, "PAI", "Udin Zachrudin"),
    j(HARI.RABU, 4, 6, "S", "Wiwik Indrawati"),
    j(HARI.KAMIS, 1, 3, "PJOK", "Imron"),
    j(HARI.KAMIS, 4, 6, "BING", "Respi Retna N"),
    j(HARI.KAMIS, 7, 8, "BINDO", "Wiwik Indrawati"),
    j(HARI.JUMAT, 1, 2, "BINDO", "Respi Retna N"),
    j(HARI.JUMAT, 3, 4, "BI", "Joko Andrianto"),
  ],

  // ── KELAS XII ──
  "XII TEI 1": [
    j(HARI.SENIN, 1, 3, "PP", "Sanusi"),
    j(HARI.SENIN, 4, 5, "PAI", "Udin Zachrudin"),
    j(HARI.SENIN, 6, 7, "PAI", "Ainah Diah Vika"),
    j(HARI.SELASA, 1, 3, "MTK", "Sapto Hartono"),
    j(HARI.SELASA, 4, 6, "MPP", "Syamsul Aribowo"),
    j(HARI.RABU, 1, 3, "BING", "Wiwik Indrawati"),
    j(HARI.RABU, 4, 6, "BI", "Joko Andrianto"),
    j(HARI.KAMIS, 1, 3, "MTK", "Sapto Hartono"),
    j(HARI.KAMIS, 4, 6, "BINDO", "Asdim"),
    j(HARI.JUMAT, 1, 5, "KIK", "Bulan Novanda J"),
  ],
  "XII TEI 2": [
    j(HARI.SENIN, 1, 3, "MPP", "Arief Surahman"),
    j(HARI.SENIN, 4, 5, "MTK", "Sapto Hartono"),
    j(HARI.SELASA, 1, 3, "PAI", "Udin Zachrudin"),
    j(HARI.SELASA, 4, 6, "PP", "Sanusi"),
    j(HARI.RABU, 1, 3, "BING", "Wiwik Indrawati"),
    j(HARI.KAMIS, 1, 3, "BINDO", "Asdim"),
    j(HARI.KAMIS, 4, 6, "KIK", "Setiowati Dwi Rimbawani"),
    j(HARI.JUMAT, 1, 3, "KIK", "Setiowati Dwi Rimbawani"),
  ],
  "XII TKR 1": [
    j(HARI.SENIN, 1, 3, "BI", "Utami Putri Shafira"),
    j(HARI.SENIN, 4, 5, "BINDO", "Respi Retna N"),
    j(HARI.SELASA, 1, 3, "PAI", "Darsono"),
    j(HARI.SELASA, 4, 6, "PP", "Ade Kosasih"),
    j(HARI.RABU, 1, 3, "KIK", "Sanusi"),
    j(HARI.RABU, 4, 6, "KIK", "Iyan Supriyatna"),
    j(HARI.KAMIS, 1, 3, "PAI", "Darsono"),
    j(HARI.KAMIS, 4, 6, "BING", "Ainah Diah Vika"),
    j(HARI.JUMAT, 1, 3, "KIK", "Iyan Supriyatna"),
  ],
  "XII TKR 2": [
    j(HARI.SENIN, 1, 3, "BI", "Utami Putri Shafira"),
    j(HARI.SENIN, 4, 5, "BINDO", "Asdim"),
    j(HARI.SELASA, 1, 3, "BING", "Safitri Khoirunnisa"),
    j(HARI.SELASA, 4, 6, "BING", "Safitri Khoirunnisa"),
    j(HARI.RABU, 1, 3, "PAI", "Taryono"),
    j(HARI.RABU, 4, 6, "MTK", "Siti Fatimah"),
    j(HARI.KAMIS, 1, 3, "PAI", "Darsono"),
    j(HARI.KAMIS, 4, 6, "MPP", "Ade Kosasih"),
    j(HARI.KAMIS, 7, 8, "PP", "Siti Khodijah"),
    j(HARI.JUMAT, 1, 3, "KIK", "Iyan Supriyatna"),
  ],
  "XII RPL 1": [
    j(HARI.SENIN, 1, 3, "MTK", "Sapto Hartono"),
    j(HARI.SENIN, 4, 5, "BI", "Joko Andrianto"),
    j(HARI.SELASA, 1, 3, "BINDO", "Asdim"),
    j(HARI.SELASA, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.RABU, 1, 3, "PAI", "Darsono"),
    j(HARI.RABU, 4, 6, "BING", "Taryono"),
    j(HARI.KAMIS, 1, 3, "PP", "Sanusi"),
    j(HARI.KAMIS, 4, 6, "BING", "Taryono"),
    j(HARI.KAMIS, 7, 8, "PAI", "Darsono"),
    j(HARI.JUMAT, 1, 3, "MPP", "Khaerul Ikhfan"),
    j(HARI.JUMAT, 4, 5, "KIK", "H. Abu Ala Almaududi"),
  ],
  "XII RPL 2": [
    j(HARI.SENIN, 1, 3, "MTK", "Siti Nurkhasanah"),
    j(HARI.SENIN, 4, 5, "BING", "Silvira"),
    j(HARI.SELASA, 1, 3, "BINDO", "Asdim"),
    j(HARI.SELASA, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.RABU, 1, 3, "PAI", "Yayat Anwar H"),
    j(HARI.RABU, 4, 6, "PP", "Sanusi"),
    j(HARI.KAMIS, 1, 3, "BI", "Siti Wulandari"),
    j(HARI.KAMIS, 4, 6, "MPP", "Khaerul Ikhfan"),
    j(HARI.KAMIS, 7, 8, "PAI", "Yayat Anwar H"),
    j(HARI.JUMAT, 1, 3, "BING", "Silvira"),
    j(HARI.JUMAT, 4, 5, "KIK", "Taryono"),
  ],
  "XII TBO 1": [
    j(HARI.SENIN, 1, 3, "BINDO", "Respi Retna N"),
    j(HARI.SENIN, 4, 5, "MPP", "Asdim"),
    j(HARI.SELASA, 1, 3, "KIK", "Nabella Azannia S"),
    j(HARI.SELASA, 4, 6, "MTK", "Siti Fatimah"),
    j(HARI.RABU, 1, 3, "PP", "Sanusi"),
    j(HARI.RABU, 4, 6, "PAI", "Yayat Anwar H"),
    j(HARI.KAMIS, 1, 3, "BI", "Utami Putri Shafira"),
    j(HARI.KAMIS, 4, 6, "BING", "Safitri Khoirunnisa"),
    j(HARI.JUMAT, 1, 3, "KIK", "Nabella Azannia S"),
    j(HARI.JUMAT, 4, 5, "BING", "Safitri Khoirunnisa"),
  ],
  "XII TBO 2": [
    j(HARI.SENIN, 1, 3, "MTK", "Siti Nurkhasanah"),
    j(HARI.SENIN, 4, 5, "MPP", "Arief Surahman"),
    j(HARI.SELASA, 1, 3, "KIK", "Nurainih"),
    j(HARI.SELASA, 4, 6, "PAI", "Yayat Anwar H"),
    j(HARI.RABU, 1, 3, "BINDO", "Riyadi Pria Dwi"),
    j(HARI.RABU, 4, 6, "BING", "Ainah Diah Vika"),
    j(HARI.KAMIS, 1, 3, "PP", "Sanusi"),
    j(HARI.KAMIS, 4, 6, "BING", "Taryono"),
    j(HARI.JUMAT, 1, 3, "KIK", "Nabella Azannia S"),
    j(HARI.JUMAT, 4, 5, "MPP", "Nabella Azannia S"),
  ],
  "XII PBS 1": [
    j(HARI.SENIN, 1, 3, "MTK", "Sapto Hartono"),
    j(HARI.SENIN, 4, 5, "PP", "Sanusi"),
    j(HARI.SELASA, 1, 3, "PAI", "Kuswara"),
    j(HARI.SELASA, 4, 6, "BING", "Safitri Khoirunnisa"),
    j(HARI.RABU, 1, 3, "KIK", "Nabella Azannia S"),
    j(HARI.RABU, 4, 6, "BI", "Joko Andrianto"),
    j(HARI.KAMIS, 1, 3, "BING", "Nabella Azannia S"),
    j(HARI.KAMIS, 4, 6, "PAI", "Kuswara"),
    j(HARI.KAMIS, 7, 8, "KIK", "Asdim"),
    j(HARI.JUMAT, 1, 3, "KIK", "Nabella Azannia S"),
  ],
  "XII PBS 2": [
    j(HARI.SENIN, 1, 3, "BI", "Joko Andrianto"),
    j(HARI.SENIN, 4, 5, "MTK", "Siti Fatimah"),
    j(HARI.SELASA, 1, 3, "PP", "Sanusi"),
    j(HARI.SELASA, 4, 6, "PAI", "Kuswara"),
    j(HARI.RABU, 1, 3, "BING", "Taryono"),
    j(HARI.RABU, 4, 6, "KIK", "Nabella Azannia S"),
    j(HARI.KAMIS, 1, 3, "BING", "Nabella Azannia S"),
    j(HARI.KAMIS, 4, 6, "PAI", "Kuswara"),
    j(HARI.KAMIS, 7, 8, "KIK", "Nabella Azannia S"),
    j(HARI.JUMAT, 1, 3, "KIK", "Nabella Azannia S"),
  ],
};

const _teoriQ = buildQueryFunctions(jadwalTeori);

// ═════════════════════════════════════════════════════════════════════════════
//  ██████╗ ██████╗  █████╗ ██╗  ██╗████████╗██╗██╗  ██╗
//  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝██║██║ ██╔╝
//  ██████╔╝██████╔╝███████║█████╔╝    ██║   ██║█████╔╝
//  ██╔═══╝ ██╔══██╗██╔══██║██╔═██╗   ██║   ██║██╔═██╗
//  ██║     ██║  ██║██║  ██║██║  ██╗  ██║   ██║██║  ██╗
//  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝   ╚═╝╚═╝  ╚═╝
// ═════════════════════════════════════════════════════════════════════════════

// ─── MASTER: MATA PELAJARAN (PRAKTIK) ─────────────────────────────────────
const mapelPraktik = [
  { kode: "KK", nama: "Kompetensi Kejuruan" },
  { kode: "KK PK", nama: "Kompetensi Kejuruan - Pemesinan Kapal" },
  { kode: "KK KA", nama: "Kompetensi Kejuruan - Konstruksi/Kelistrikan Kapal" },
  { kode: "KK EI", nama: "Kompetensi Kejuruan - Elektronika Industri" },
  { kode: "KK APS", nama: "Kompetensi Kejuruan - Automatisasi & Perkantoran" },
  { kode: "KK 3 SK", nama: "Kompetensi Kejuruan - Sistem Kontrol" },
  {
    kode: "KK 2 PSE",
    nama: "Kompetensi Kejuruan - Penggunaan Sistem Elektronika",
  },
  {
    kode: "KK 1 PRE",
    nama: "Kompetensi Kejuruan - Perakitan & Rekayasa Elektronika",
  },
  { kode: "KK/INEX", nama: "Kompetensi Kejuruan - Instalasi & Eksperimen" },
  { kode: "KK/PCB", nama: "Kompetensi Kejuruan - Perancangan Papan Sirkuit" },
  {
    kode: "KK/PPB",
    nama: "Kompetensi Kejuruan - Pemrograman & Pengujian Berbasis",
  },
  { kode: "KK/KBA", nama: "Kompetensi Kejuruan - Kontrol Berbasis Arduino" },
  {
    kode: "KK LLKS",
    nama: "Kompetensi Kejuruan - Layanan Lembaga Keuangan Syariah",
  },
  { kode: "KKA", nama: "Kompetensi Kejuruan Akuntansi" },
  { kode: "MPP", nama: "Mata Pelajaran Pilihan" },
  { kode: "KIK", nama: "Kompetensi Inti Kejuruan" },
  { kode: "DPK", nama: "Dasar Program Keahlian" },
  { kode: "DPK 1", nama: "Dasar Program Keahlian 1" },
  { kode: "DPK 2", nama: "Dasar Program Keahlian 2" },
  { kode: "DPK 3", nama: "Dasar Program Keahlian 3" },
  { kode: "INFORMATIKA", nama: "Informatika" },
  { kode: "MTK", nama: "Matematika" },
  { kode: "PJOK", nama: "Pendidikan Jasmani, Olahraga & Kesehatan" },
  { kode: "RC", nama: "Rangkaian Listrik / Robotik" },
  { kode: "TP", nama: "Teknik Pemesinan / Teknik Pengelasan" },
];

// ─── MASTER: GURU (PRAKTIK) ───────────────────────────────────────────────
const guruPraktik = [
  { id: 1, nama: "Siti Fatimah", mapel: ["MTK", "DPK"] },
  { id: 2, nama: "Imron", mapel: ["PJOK", "KK"] },
  { id: 3, nama: "Setiowati Dwi R", mapel: ["KK 3 SK", "KK"] },
  { id: 4, nama: "Nanang Sugihantoro", mapel: ["DPK", "KK"] },
  { id: 5, nama: "Syamsul Aribowo", mapel: ["KK", "MPP", "MTK"] },
  { id: 6, nama: "Yuni Anggraeni M", mapel: ["KK 2 PSE", "DPK"] },
  { id: 7, nama: "Bulan Novanda J", mapel: ["KK 1 PRE", "INFORMATIKA"] },
  { id: 8, nama: "Siti Nurkhasanah", mapel: ["MTK"] },
  { id: 9, nama: "Miqdad Satia Pratama", mapel: ["DPK"] },
  { id: 10, nama: "Asep Hermawan", mapel: ["PJOK", "KK"] },
  { id: 11, nama: "Ade Kosasih", mapel: ["KK", "MPP", "INFORMATIKA"] },
  { id: 12, nama: "Riyadi Pria Dwi", mapel: ["INFORMATIKA", "DPK"] },
  { id: 13, nama: "Adi Yoga S", mapel: ["PJOK"] },
  { id: 14, nama: "Fuji Lestari", mapel: ["MTK", "DPK"] },
  { id: 15, nama: "Neneng Hasanah", mapel: ["INFORMATIKA", "KK LLKS"] },
  { id: 16, nama: "Taufik Hardiyanto", mapel: ["DPK"] },
  { id: 17, nama: "Khaerul Ikhfan", mapel: ["MPP", "KK"] },
  { id: 18, nama: "Lusi Febrianti", mapel: ["KK", "DPK"] },
  { id: 19, nama: "Abdul Ajis", mapel: ["KK"] },
  { id: 20, nama: "Hidayanti", mapel: ["KK"] },
  { id: 21, nama: "Ibnu Adkha", mapel: ["KK"] },
  { id: 22, nama: "Saep Gunawan", mapel: ["KK"] },
  { id: 23, nama: "Suhendi", mapel: ["KK"] },
  { id: 24, nama: "Dedy Supriyadin", mapel: ["KK", "MPP"] },
  { id: 25, nama: "Wahyu Lesmono", mapel: ["KK 2 PSE", "KIK"] },
  { id: 26, nama: "Pringgo Willy P", mapel: ["KIK", "KK 1 PRE"] },
  { id: 27, nama: "H. Abu Ala Almaududi", mapel: ["KK", "KIK"] },
  { id: 28, nama: "Iyan Supriatna", mapel: ["KK", "KIK"] },
  { id: 29, nama: "Rosmalia", mapel: ["KK APS", "KK PK", "KK KA"] },
  { id: 30, nama: "Hermanto", mapel: ["KK EI", "KK APS", "KK LLKS"] },
  { id: 31, nama: "Hj. Paikotul Himmah", mapel: ["KK KA", "KK LLKS"] },
  { id: 32, nama: "Nurainih", mapel: ["KK", "MPP", "KIK"] },
  { id: 33, nama: "Muhammad Fathur R", mapel: ["KK/INEX", "KK/KBA", "KK/PCB"] },
  { id: 34, nama: "Muhamad Anas", mapel: ["KK/PCB", "KK/PPB"] },
  { id: 35, nama: "Hasrawati", mapel: ["KK/PPB", "DPK"] },
  { id: 36, nama: "Arief Surahman", mapel: ["KKA", "MPP"] },
  { id: 37, nama: "Nabella Azannia S", mapel: ["KK APS", "MPP"] },
  { id: 38, nama: "Asep Hermawaran", mapel: ["KK 2 PSE", "KK 1 PRE"] },
];

// ─── DATA JADWAL PRAKTIK ──────────────────────────────────────────────────
const jadwalPraktik = {
  // ── KELAS X ──
  "X TEI 1": [
    j(HARI.SENIN, 1, 4, "MTK", "Siti Fatimah"),
    j(HARI.SENIN, 5, 8, "PJOK", "Imron"),
    j(HARI.SELASA, 1, 4, "DPK 3", "Setiowati Dwi R"),
    j(HARI.SELASA, 5, 8, "INFORMATIKA", "Nanang Sugihantoro"),
    j(HARI.RABU, 1, 4, "DPK 2", "Yuni Anggraeni M"),
    j(HARI.RABU, 5, 8, "DPK 1", "Bulan Novanda J"),
    j(HARI.KAMIS, 1, 4, "MTK", "Siti Nurkhasanah"),
    j(HARI.KAMIS, 5, 8, "KA", "Syamsul Aribowo"),
    j(HARI.JUMAT, 1, 3, "INFORMATIKA", "Nanang Sugihantoro"),
    j(HARI.JUMAT, 4, 6, "MTK", "Siti Fatimah"),
  ],
  "X TEI 2": [
    j(HARI.SENIN, 1, 4, "MTK", "Siti Fatimah"),
    j(HARI.SENIN, 5, 8, "PJOK", "Imron"),
    j(HARI.SELASA, 1, 4, "DPK 3", "Setiowati Dwi R"),
    j(HARI.SELASA, 5, 8, "INFORMATIKA", "Neneng Hasanah"),
    j(HARI.RABU, 1, 4, "DPK 2", "Yuni Anggraeni M"),
    j(HARI.RABU, 5, 8, "DPK 1", "Bulan Novanda J"),
    j(HARI.KAMIS, 1, 4, "MTK", "Siti Nurkhasanah"),
    j(HARI.KAMIS, 5, 8, "KA", "Syamsul Aribowo"),
    j(HARI.JUMAT, 1, 3, "INFORMATIKA", "Nanang Sugihantoro"),
    j(HARI.JUMAT, 4, 6, "MTK", "Siti Fatimah"),
  ],
  "X TKR 1": [
    j(HARI.SENIN, 1, 5, "DPK", "Miqdad Satia Pratama"),
    j(HARI.SELASA, 1, 5, "DPK", "Miqdad Satia Pratama"),
    j(HARI.RABU, 1, 4, "INFORMATIKA", "Ade Kosasih"),
    j(HARI.KAMIS, 1, 3, "MTK", "Siti Fatimah"),
    j(HARI.KAMIS, 4, 6, "KKA", "Asep Hermawan"),
    j(HARI.KAMIS, 7, 8, "PJOK", "Imron"),
    j(HARI.JUMAT, 1, 3, "PJOK", "Imron"),
    j(HARI.JUMAT, 4, 6, "MTK", "Siti Fatimah"),
  ],
  "X TKR 2": [
    j(HARI.SENIN, 1, 5, "DPK", "Miqdad Satia Pratama"),
    j(HARI.SELASA, 1, 4, "INFORMATIKA", "Nanang Sugihantoro"),
    j(HARI.SELASA, 5, 8, "DPK", "Miqdad Satia Pratama"),
    j(HARI.RABU, 1, 4, "DPK", "Miqdad Satia Pratama"),
    j(HARI.KAMIS, 1, 3, "KKA", "Asep Hermawan"),
    j(HARI.KAMIS, 4, 6, "MTK", "Siti Nurkhasanah"),
    j(HARI.KAMIS, 7, 8, "PJOK", "Imron"),
    j(HARI.JUMAT, 1, 3, "MTK", "Siti Nurkhasanah"),
    j(HARI.JUMAT, 4, 6, "PJOK", "Imron"),
  ],
  "X RPL 1": [
    j(HARI.SENIN, 1, 4, "INFORMATIKA", "Neneng Hasanah"),
    j(HARI.SENIN, 5, 8, "PJOK", "Imron"),
    j(HARI.SELASA, 1, 4, "DPK", "Khaerul Ikhfan"),
    j(HARI.RABU, 1, 4, "DPK", "Lusi Febrianti"),
    j(HARI.KAMIS, 1, 3, "PJOK", "Imron"),
    j(HARI.KAMIS, 4, 6, "MTK", "Fuji Lestari"),
    j(HARI.KAMIS, 7, 8, "KKA", "Abdul Ajis"),
    j(HARI.JUMAT, 1, 3, "MTK", "Fuji Lestari"),
    j(HARI.JUMAT, 4, 6, "DPK", "Lusi Febrianti"),
  ],
  "X RPL 2": [
    j(HARI.SENIN, 1, 4, "INFORMATIKA", "Neneng Hasanah"),
    j(HARI.SENIN, 5, 8, "PJOK", "Imron"),
    j(HARI.SELASA, 1, 4, "DPK", "Khaerul Ikhfan"),
    j(HARI.RABU, 1, 4, "DPK", "Lusi Febrianti"),
    j(HARI.KAMIS, 1, 3, "PJOK", "Imron"),
    j(HARI.KAMIS, 4, 6, "MTK", "Fuji Lestari"),
    j(HARI.KAMIS, 7, 8, "KKA", "Abdul Ajis"),
    j(HARI.JUMAT, 1, 3, "MTK", "Fuji Lestari"),
    j(HARI.JUMAT, 4, 6, "DPK", "Lusi Febrianti"),
  ],
  "X TBO 1": [
    j(HARI.SENIN, 1, 4, "DPK", "Hasrawati"),
    j(HARI.SELASA, 1, 4, "INFORMATIKA", "Ade Kosasih"),
    j(HARI.SELASA, 5, 8, "DPK", "Arief Surahman"),
    j(HARI.RABU, 1, 6, "MTK", "Fuji Lestari"),
    j(HARI.RABU, 7, 9, "DPK", "Arief Surahman"),
    j(HARI.KAMIS, 1, 4, "DPK", "Muhammad Fathur R"),
    j(HARI.KAMIS, 5, 8, "PJOK", "Adi Yoga S"),
    j(HARI.JUMAT, 1, 3, "KKA", "Abdul Ajis"),
    j(HARI.JUMAT, 4, 6, "PJOK", "Adi Yoga S"),
  ],
  "X TBO 2": [
    j(HARI.SENIN, 1, 4, "DPK", "Hasrawati"),
    j(HARI.SELASA, 1, 4, "INFORMATIKA", "Ade Kosasih"),
    j(HARI.SELASA, 5, 8, "DPK", "Arief Surahman"),
    j(HARI.RABU, 1, 6, "MTK", "Riyadi Pria Dwi"),
    j(HARI.RABU, 7, 9, "DPK", "Arief Surahman"),
    j(HARI.KAMIS, 1, 4, "DPK", "Muhammad Fathur R"),
    j(HARI.KAMIS, 5, 8, "PJOK", "Imron"),
    j(HARI.JUMAT, 1, 3, "KKA", "Abdul Ajis"),
    j(HARI.JUMAT, 4, 6, "PJOK", "Imron"),
  ],
  "X PBS 1": [
    j(HARI.SENIN, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.SELASA, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.RABU, 1, 3, "KKA", "Syamsul Aribowo"),
    j(HARI.RABU, 4, 6, "PJOK", "Adi Yoga S"),
    j(HARI.RABU, 7, 9, "MTK", "Fuji Lestari"),
    j(HARI.KAMIS, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.KAMIS, 5, 7, "INFORMATIKA", "Neneng Hasanah"),
    j(HARI.JUMAT, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.JUMAT, 4, 6, "MTK", "Fuji Lestari"),
  ],
  "X PBS 2": [
    j(HARI.SENIN, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.SELASA, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.RABU, 1, 3, "MTK", "Siti Nurkhasanah"),
    j(HARI.RABU, 4, 6, "PJOK", "Adi Yoga S"),
    j(HARI.KAMIS, 1, 4, "DPK", "Taufik Hardiyanto"),
    j(HARI.KAMIS, 5, 7, "INFORMATIKA", "Neneng Hasanah"),
    j(HARI.JUMAT, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.JUMAT, 4, 6, "KKA", "Syamsul Aribowo"),
  ],

  // ── KELAS XI ──
  "XI TEI 1": [
    j(HARI.SENIN, 1, 5, "KK 2 PSE", "Wahyu Lesmono"),
    j(HARI.SELASA, 1, 5, "KK 1 PRE", "Bulan Novanda J"),
    j(HARI.RABU, 1, 5, "KK 3 SK", "Setiowati Dwi R"),
    j(HARI.KAMIS, 1, 3, "KIK", "Pringgo Willy P"),
    j(HARI.KAMIS, 4, 7, "KK 3 SK", "Setiowati Dwi R"),
    j(HARI.JUMAT, 1, 4, "MPP RC", "Asep Hermawan"),
  ],
  "XI TEI 2": [
    j(HARI.SENIN, 1, 5, "KK 2 PSE", "Wahyu Lesmono"),
    j(HARI.SELASA, 1, 5, "KK 1 PRE", "Bulan Novanda J"),
    j(HARI.RABU, 1, 5, "KK 3 SK", "Setiowati Dwi R"),
    j(HARI.KAMIS, 1, 3, "KIK", "Pringgo Willy P"),
    j(HARI.KAMIS, 4, 7, "KK 3 SK", "Setiowati Dwi R"),
    j(HARI.JUMAT, 1, 4, "MPP RC", "Asep Hermawan"),
  ],
  "XI TKR 1": [
    j(HARI.SENIN, 1, 5, "KK", "Dedy Supriyadin"),
    j(HARI.SELASA, 1, 5, "KK", "Saep Gunawan"),
    j(HARI.RABU, 1, 4, "KIK", "Iyan Supriatna"),
    j(HARI.KAMIS, 1, 5, "KK", "Suhendi"),
    j(HARI.JUMAT, 1, 4, "MPP TP", "Ade Kosasih"),
  ],
  "XI TKR 2": [
    j(HARI.SENIN, 1, 5, "KK", "Dedy Supriyadin"),
    j(HARI.SELASA, 1, 5, "KK", "Saep Gunawan"),
    j(HARI.RABU, 1, 4, "KIK", "Iyan Supriatna"),
    j(HARI.KAMIS, 1, 5, "KK", "Suhendi"),
    j(HARI.JUMAT, 1, 4, "MPP TP", "Ade Kosasih"),
  ],
  "XI RPL 1": [
    j(HARI.SENIN, 1, 5, "KK", "Abdul Ajis"),
    j(HARI.SELASA, 1, 5, "KK", "Ibnu Adkha"),
    j(HARI.RABU, 1, 4, "KK", "Hidayanti"),
    j(HARI.KAMIS, 1, 3, "KK", "Lusi Febrianti"),
    j(HARI.KAMIS, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.JUMAT, 1, 4, "MPP", "Ibnu Adkha"),
  ],
  "XI RPL 2": [
    j(HARI.SENIN, 1, 5, "KK", "Abdul Ajis"),
    j(HARI.SELASA, 1, 5, "KK", "Ibnu Adkha"),
    j(HARI.RABU, 1, 4, "KK", "Hidayanti"),
    j(HARI.KAMIS, 1, 3, "KK", "Lusi Febrianti"),
    j(HARI.KAMIS, 4, 6, "KIK", "H. Abu Ala Almaududi"),
    j(HARI.JUMAT, 1, 4, "MPP", "H. Abu Ala Almaududi"),
  ],
  "XI TBO 1": [
    j(HARI.SENIN, 1, 5, "KK/INEX", "Muhammad Fathur R"),
    j(HARI.SELASA, 1, 5, "KK/PCB", "Muhamad Anas"),
    j(HARI.RABU, 1, 5, "KK/PPB", "Hasrawati"),
    j(HARI.KAMIS, 1, 3, "KK/KBA", "Muhammad Fathur R"),
    j(HARI.KAMIS, 4, 6, "KIK", "Arief Surahman"),
    j(HARI.JUMAT, 1, 4, "MPP", "Arief Surahman"),
  ],
  "XI TBO 2": [
    j(HARI.SENIN, 1, 5, "KK/INEX", "Muhammad Fathur R"),
    j(HARI.SELASA, 1, 5, "KK/PCB", "Muhamad Anas"),
    j(HARI.RABU, 1, 5, "KK/PPB", "Hasrawati"),
    j(HARI.KAMIS, 1, 3, "KK/KBA", "Muhammad Fathur R"),
    j(HARI.KAMIS, 4, 6, "KIK", "Arief Surahman"),
    j(HARI.JUMAT, 1, 4, "MPP", "Arief Surahman"),
  ],
  "XI PBS 1": [
    j(HARI.SENIN, 1, 4, "KK PK", "Rosmalia"),
    j(HARI.SELASA, 1, 4, "KK KA", "Hj. Paikotul Himmah"),
    j(HARI.RABU, 1, 3, "MPP", "Nurainih"),
    j(HARI.RABU, 4, 7, "KK EI", "Hermanto"),
    j(HARI.KAMIS, 1, 3, "KK APS", "Rosmalia"),
    j(HARI.KAMIS, 4, 6, "KK EI", "Hermanto"),
    j(HARI.KAMIS, 7, 8, "KIK", "Nurainih"),
    j(HARI.JUMAT, 1, 4, "MPP", "Nurainih"),
  ],
  "XI PBS 2": [
    j(HARI.SENIN, 1, 4, "KK PK", "Rosmalia"),
    j(HARI.SELASA, 1, 4, "KK KA", "Neneng Hasanah"),
    j(HARI.RABU, 1, 3, "MPP", "Nurainih"),
    j(HARI.RABU, 4, 7, "KK EI", "Hermanto"),
    j(HARI.KAMIS, 1, 3, "KK APS", "Rosmalia"),
    j(HARI.KAMIS, 4, 6, "KK EI", "Hermanto"),
    j(HARI.KAMIS, 7, 8, "KIK", "Nurainih"),
    j(HARI.JUMAT, 1, 4, "MPP", "Nurainih"),
  ],

  // ── KELAS XII ──
  "XII TEI 1": [
    j(HARI.SENIN, 1, 5, "KK 3 SK", "Syamsul Aribowo"),
    j(HARI.RABU, 1, 5, "KK 2 PSE", "Asep Hermawaran"),
    j(HARI.RABU, 6, 10, "MPP", "Syamsul Aribowo"),
    j(HARI.JUMAT, 1, 5, "KK 1 PRE", "Yuni Anggraeni M"),
  ],
  "XII TEI 2": [
    j(HARI.SENIN, 1, 5, "KK 3 SK", "Syamsul Aribowo"),
    j(HARI.RABU, 1, 5, "KK 2 PSE", "Asep Hermawaran"),
    j(HARI.RABU, 6, 10, "MPP", "Asep Hermawan"),
    j(HARI.JUMAT, 1, 5, "KK 1 PRE", "Yuni Anggraeni M"),
  ],
  "XII TKR 1": [
    j(HARI.SENIN, 1, 5, "KK", "Suhendi"),
    j(HARI.RABU, 1, 3, "MPP", "Ade Kosasih"),
    j(HARI.RABU, 4, 8, "KK", "Dedy Supriyadin"),
    j(HARI.KAMIS, 1, 5, "KK", "Saep Gunawan"),
    j(HARI.JUMAT, 1, 5, "KK", "Dedy Supriyadin"),
  ],
  "XII TKR 2": [
    j(HARI.SENIN, 1, 5, "KK", "Suhendi"),
    j(HARI.RABU, 1, 3, "MPP", "Ade Kosasih"),
    j(HARI.RABU, 4, 8, "KK", "Dedy Supriyadin"),
    j(HARI.KAMIS, 1, 5, "KK", "Saep Gunawan"),
    j(HARI.JUMAT, 1, 5, "KK", "Dedy Supriyadin"),
  ],
  "XII RPL 1": [
    j(HARI.SENIN, 1, 3, "MPP", "Khaerul Ikhfan"),
    j(HARI.SENIN, 4, 7, "KK", "Lusi Febrianti"),
    j(HARI.RABU, 1, 4, "KK", "Abdul Ajis"),
    j(HARI.KAMIS, 1, 3, "KK", "Hidayanti"),
    j(HARI.KAMIS, 4, 6, "KK", "Abdul Ajis"),
    j(HARI.JUMAT, 1, 3, "KK", "Ibnu Adkha"),
    j(HARI.JUMAT, 4, 6, "KK", "Hidayanti"),
    j(HARI.JUMAT, 7, 8, "KK", "Lusi Febrianti"),
  ],
  "XII RPL 2": [
    j(HARI.SENIN, 1, 3, "MPP", "Khaerul Ikhfan"),
    j(HARI.SENIN, 4, 7, "KK", "Lusi Febrianti"),
    j(HARI.RABU, 1, 4, "KK", "Abdul Ajis"),
    j(HARI.KAMIS, 1, 3, "KK", "Hidayanti"),
    j(HARI.KAMIS, 4, 6, "KK", "Abdul Ajis"),
    j(HARI.JUMAT, 1, 3, "KK", "Ibnu Adkha"),
    j(HARI.JUMAT, 4, 6, "KK", "Hidayanti"),
    j(HARI.JUMAT, 7, 8, "KK", "Lusi Febrianti"),
  ],
  "XII TBO 1": [
    j(HARI.SENIN, 1, 3, "MPP", "Arief Surahman"),
    j(HARI.SENIN, 4, 7, "KK/PCB", "Muhamad Anas"),
    j(HARI.SELASA, 1, 5, "KK/INEX", "Muhammad Fathur R"),
    j(HARI.RABU, 1, 5, "KK/PCB", "Muhamad Anas"),
    j(HARI.KAMIS, 1, 5, "KK/PPB", "Hasrawati"),
    j(HARI.KAMIS, 6, 8, "KK/KBA", "Muhammad Fathur R"),
    j(HARI.JUMAT, 1, 3, "PJOK", "Adi Yoga S"),
    j(HARI.JUMAT, 4, 6, "DPK 3", "Setiowati Dwi R"),
    j(HARI.JUMAT, 7, 8, "DPK 2", "Yuni Anggraeni M"),
  ],
  "XII TBO 2": [
    j(HARI.SENIN, 1, 3, "MPP", "Arief Surahman"),
    j(HARI.SENIN, 4, 7, "KK/PCB", "Muhamad Anas"),
    j(HARI.SELASA, 1, 5, "KK/INEX", "Muhammad Fathur R"),
    j(HARI.RABU, 1, 5, "KK/PCB", "Muhamad Anas"),
    j(HARI.KAMIS, 1, 5, "KK/PPB", "Hasrawati"),
    j(HARI.KAMIS, 6, 8, "KK/KBA", "Muhammad Fathur R"),
    j(HARI.JUMAT, 1, 3, "KK/KBA", "Rosmalia"),
  ],
  "XII PBS 1": [
    j(HARI.SENIN, 1, 4, "KK KA", "Rosmalia"),
    j(HARI.SELASA, 1, 4, "KK LLKS", "Neneng Hasanah"),
    j(HARI.RABU, 1, 4, "KK APS", "Rosmalia"),
    j(HARI.KAMIS, 1, 4, "KK APS", "Rosmalia"),
    j(HARI.JUMAT, 1, 4, "KK APS", "Rosmalia"),
  ],
  "XII PBS 2": [
    j(HARI.SENIN, 1, 4, "KK KA", "Hj. Paikotul Himmah"),
    j(HARI.SELASA, 1, 4, "KK LLKS", "Hermanto"),
    j(HARI.RABU, 1, 4, "KK KA", "Hj. Paikotul Himmah"),
    j(HARI.RABU, 5, 7, "KK LLKS", "Hermanto"),
    j(HARI.KAMIS, 1, 3, "MPP", "Nabella Azannia S"),
    j(HARI.KAMIS, 4, 6, "KK APS", "Hj. Paikotul Himmah"),
    j(HARI.JUMAT, 1, 4, "KK APS", "Hj. Paikotul Himmah"),
  ],
};

const _praktikQ = buildQueryFunctions(jadwalPraktik);

// ═════════════════════════════════════════════════════════════════════════════
//  EXPORT
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  /** Data master kelas (shared) */
  kelas: kelasMaster,

  // ── Namespace TEORI ──────────────────────────────────────────────────────
  teori: {
    mapel: mapelTeori,
    guru: guruTeori,
    jadwal: jadwalTeori,
    jadwalFlat: _teoriQ.getFlat("teori"),

    getJadwalByKelas: (namaKelas) => _teoriQ.getByKelas(namaKelas),
    getAllJadwal: () => _teoriQ.getAll(),
    getJadwalByHari: (hari) => _teoriQ.getByHari(hari),
    getJadwalByGuru: (namaGuru) => _teoriQ.getByGuru(namaGuru),
    getFlat: () => _teoriQ.getFlat("teori"),
  },

  // ── Namespace PRAKTIK ────────────────────────────────────────────────────
  praktik: {
    mapel: mapelPraktik,
    guru: guruPraktik,
    jadwal: jadwalPraktik,
    jadwalFlat: _praktikQ.getFlat("praktik"),

    getJadwalByKelas: (namaKelas) => _praktikQ.getByKelas(namaKelas),
    getAllJadwal: () => _praktikQ.getAll(),
    getJadwalByHari: (hari) => _praktikQ.getByHari(hari),
    getJadwalByGuru: (namaGuru) => _praktikQ.getByGuru(namaGuru),
    getFlat: () => _praktikQ.getFlat("praktik"),
  },

  /**
   * Semua sesi (teori + praktik) dalam satu flat array
   * Berguna untuk seed ke database sekaligus
   */
  getAllFlat: () => [
    ..._teoriQ.getFlat("teori"),
    ..._praktikQ.getFlat("praktik"),
  ],

  /**
   * Jadwal lengkap satu kelas: teori + praktik digabung
   * @param {string} namaKelas - contoh: 'X TEI 1'
   */
  getJadwalLengkapByKelas: (namaKelas) => ({
    kelas: namaKelas,
    teori: _teoriQ.getByKelas(namaKelas),
    praktik: _praktikQ.getByKelas(namaKelas),
  }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  STANDALONE (node jadwal-all.js)
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const all = module.exports;
  const totalTeori = all.teori.jadwalFlat.length;
  const totalPraktik = all.praktik.jadwalFlat.length;

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  SMKN 1 BABELAN — JADWAL GENERATOR LENGKAP  ║");
  console.log("╚══════════════════════════════════════════════╝\n");
  console.log(`Total Kelas         : ${all.kelas.length}`);
  console.log(`Total Sesi Teori    : ${totalTeori}`);
  console.log(`Total Sesi Praktik  : ${totalPraktik}`);
  console.log(`Total Sesi Gabungan : ${totalTeori + totalPraktik}`);

  console.log("\n─── Sample: Jadwal Lengkap X TEI 1 ───");
  console.log(JSON.stringify(all.getJadwalLengkapByKelas("X TEI 1"), null, 2));

  console.log("\n─── Sample: Guru Setiowati Dwi R (Praktik) ───");
  console.log(
    JSON.stringify(all.praktik.getJadwalByGuru("Setiowati Dwi R"), null, 2),
  );
}
