require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const bcrypt = require("bcryptjs");
const db = require("../config/database");

const JURUSAN = [
  { kode: "RPL", nama: "Rekayasa Perangkat Lunak" },
  { kode: "TEI", nama: "Teknik Elektronika Industri" },
  { kode: "PBS", nama: "Perbankan Syariah" },
  { kode: "TKR", nama: "Teknik Kendaraan Ringan" },
  { kode: "TBO", nama: "Teknik Bisnis dan Otomotif" },
];
const TINGKAT = ["X", "XI", "XII"];
const KELAS_PER_JURUSAN_PER_TINGKAT = 2;

const MAPEL = [
  { kode: "MAT", nama: "Matematika" },
  { kode: "BIN", nama: "Bahasa Indonesia" },
  { kode: "BIG", nama: "Bahasa Inggris" },
  { kode: "PKN", nama: "Pendidikan Kewarganegaraan" },
  { kode: "AGM", nama: "Pendidikan Agama" },
  { kode: "IPA", nama: "Ilmu Pengetahuan Alam" },
  { kode: "IPS", nama: "Ilmu Pengetahuan Sosial" },
  { kode: "SBD", nama: "Seni Budaya" },
  { kode: "PJK", nama: "Penjaskes" },
  { kode: "PKJ", nama: "Produktif Kejuruan" },
];

async function seed() {
  console.log("🌱 Mulai seeding...");
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Disable FK checks so we can truncate tables freely
    await conn.query("SET FOREIGN_KEY_CHECKS=0");

    // Clear all tables
    console.log("🧹 Membersihkan tabel lama...");
    for (const tbl of [
      "activity_log",
      "alert_siswa",
      "qr_scan_log",
      "qr_sesi",
      "pengajuan_izin",
      "absensi_mapel",
      "absensi_harian",
      "jadwal_mengajar",
      "siswa",
      "guru",
      "kelas",
      "users",
      "mapel",
      "jurusan",
      "tahun_ajaran",
    ]) {
      await conn.query(`DELETE FROM \`${tbl}\``);
      await conn.query(`ALTER TABLE \`${tbl}\` AUTO_INCREMENT = 1`);
    }

    await conn.query("SET FOREIGN_KEY_CHECKS=1");

    // === Tahun Ajaran ===
    console.log("📅 Seeding tahun ajaran...");
    await conn.query(`INSERT INTO tahun_ajaran (nama, semester, is_active, start_date, end_date) VALUES
      ('2026/2027', 'ganjil', 1, '2026-07-13', '2026-12-20'),
      ('2026/2027', 'genap', 0, '2027-01-04', '2027-06-28')`);
    const [[taAktif]] = await conn.query(
      "SELECT id FROM tahun_ajaran WHERE is_active = 1",
    );
    const taId = taAktif.id;
    const [[taGenap]] = await conn.query(
      "SELECT id FROM tahun_ajaran WHERE is_active = 0",
    );
    const taGenapId = taGenap.id;

    // === Mapel ===
    console.log("📚 Seeding mapel...");
    for (const m of MAPEL) {
      await conn.query("INSERT IGNORE INTO mapel (kode, nama) VALUES (?,?)", [
        m.kode,
        m.nama,
      ]);
    }

    // === Jurusan ===
    console.log("🏫 Seeding jurusan...");
    const jurusanIds = {};
    for (const j of JURUSAN) {
      const [existing] = await conn.query(
        "SELECT id FROM jurusan WHERE kode = ?",
        [j.kode],
      );
      if (existing.length) {
        jurusanIds[j.kode] = existing[0].id;
      } else {
        const [res] = await conn.query(
          "INSERT INTO jurusan (kode, nama) VALUES (?,?)",
          [j.kode, j.nama],
        );
        jurusanIds[j.kode] = res.insertId;
      }
    }

    // === Admin Users ===
    console.log("👤 Seeding admin...");
    const admins = [
      { nama: "Admin Utama", email: "admin1@school.com" },
      { nama: "Admin Kedua", email: "admin2@school.com" },
    ];
    for (const a of admins) {
      const hashed = await bcrypt.hash("admin123", 10);
      await conn.query(
        "INSERT IGNORE INTO users (nama, email, password, role) VALUES (?,?,?,?)",
        [a.nama, a.email, hashed, "admin"],
      );
    }

    // === Generate 30 Kelas + Guru Walas ===
    console.log("🏫 Seeding 30 kelas + guru walas...");
    const kelasIds = {}; // key: "X RPL 1" => id
    let guruCounter = 1;
    const guruHashed = await bcrypt.hash("GuruSmkn1babelan", 10);

    // First create all kelas, then assign walas
    for (const j of JURUSAN) {
      for (const tingkat of TINGKAT) {
        for (let n = 1; n <= KELAS_PER_JURUSAN_PER_TINGKAT; n++) {
          const kelasNama = `${tingkat} ${j.kode} ${n}`;
          // Insert kelas for active semester
          const [kr] = await conn.query(
            "INSERT IGNORE INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id) VALUES (?,?,?,?)",
            [kelasNama, tingkat, jurusanIds[j.kode], taId],
          );
          let kelasId;
          if (kr.insertId) {
            kelasId = kr.insertId;
          } else {
            const [existing] = await conn.query(
              "SELECT id FROM kelas WHERE nama=? AND tahun_ajaran_id=?",
              [kelasNama, taId],
            );
            kelasId = existing[0].id;
          }
          kelasIds[kelasNama] = kelasId;

          // Also create for genap semester
          await conn.query(
            "INSERT IGNORE INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id) VALUES (?,?,?,?)",
            [kelasNama, tingkat, jurusanIds[j.kode], taGenapId],
          );

          // Create guru walas for this kelas
          const guruEmail = `guru${String(guruCounter).padStart(2, "0")}@school.com`;
          const guruNama = `Guru Walas ${kelasNama}`;
          const [gu] = await conn.query(
            "INSERT IGNORE INTO users (nama, email, password, role) VALUES (?,?,?,?)",
            [guruNama, guruEmail, guruHashed, "guru"],
          );
          let guruUserId;
          if (gu.insertId) {
            guruUserId = gu.insertId;
          } else {
            const [eu] = await conn.query(
              "SELECT id FROM users WHERE email = ?",
              [guruEmail],
            );
            guruUserId = eu[0].id;
          }

          const [gg] = await conn.query(
            "INSERT IGNORE INTO guru (user_id, nip, is_walas, kelas_id) VALUES (?,?,1,?)",
            [guruUserId, `NIP${String(guruCounter).padStart(6, "0")}`, kelasId],
          );

          await conn.query("UPDATE kelas SET wali_kelas_id = ? WHERE id = ?", [
            guruUserId,
            kelasId,
          ]);

          guruCounter++;
        }
      }
    }

    // Extra non-walas guru
    for (let i = guruCounter; i <= guruCounter + 14; i++) {
      const guruEmail = `guru${String(i).padStart(2, "0")}@school.com`;
      const [eu] = await conn.query("SELECT id FROM users WHERE email = ?", [
        guruEmail,
      ]);
      if (!eu.length) {
        const [gu] = await conn.query(
          "INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)",
          [`Guru Mapel ${i}`, guruEmail, guruHashed, "guru"],
        );
        await conn.query(
          "INSERT INTO guru (user_id, nip, is_walas) VALUES (?,?,0)",
          [gu.insertId, `NIP${String(i).padStart(6, "0")}`],
        );
      }
    }

    // === Siswa - 15 per kelas ===
    console.log("👨‍🎓 Seeding siswa (15 per kelas = 450 siswa)...");
    const siswaHashed = await bcrypt.hash("Smkn1babelan", 10);
    let siswaCounter = 1;

    for (const [kelasNama, kelasId] of Object.entries(kelasIds)) {
      // Get jurusan and tingkat from kelas nama
      const parts = kelasNama.split(" "); // e.g. ["X", "RPL", "1"]
      const tingkat = parts[0];
      const jurusanKode = parts[1];
      const kelasNo = parts[2];

      for (let s = 1; s <= 15; s++) {
        const nisStr = String(siswaCounter).padStart(5, "0");
        const nis = `2026${nisStr}`;
        const nama = `Siswa ${kelasNama} ${s}`;
        const email = `siswa${nisStr}@school.com`;
        const isKetua = s === 1 ? 1 : 0;

        const [eu] = await conn.query("SELECT id FROM users WHERE email = ?", [
          email,
        ]);
        let userId;
        if (eu.length) {
          userId = eu[0].id;
        } else {
          const [ur] = await conn.query(
            "INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)",
            [nama, email, siswaHashed, "siswa"],
          );
          userId = ur.insertId;
        }
        await conn.query(
          "INSERT IGNORE INTO siswa (user_id, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas) VALUES (?,?,?,?,?)",
          [userId, nis, kelasId, taId, isKetua],
        );
        siswaCounter++;
      }
    }

    await conn.commit();
    conn.release();
    console.log("✅ Seeding selesai!");
    console.log(`   - 2 tahun ajaran`);
    console.log(`   - ${MAPEL.length} mata pelajaran`);
    console.log(`   - ${JURUSAN.length} jurusan`);
    console.log(`   - 30 kelas (per semester aktif)`);
    console.log(`   - 30 guru walas + extra guru`);
    console.log(`   - 450 siswa (15 per kelas)`);
    console.log(`\n📧 Login Admin: admin1@school.com / admin123`);
    console.log(`📧 Login Guru: NIP000001 / GuruSmkn1babelan`);
    console.log(`📧 Login Siswa: 202600001 / Smkn1babelan`);
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Seeding gagal:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
