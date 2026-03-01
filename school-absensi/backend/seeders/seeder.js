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

async function seed() {
  console.log("🌱 Mulai seeding...");
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("SET FOREIGN_KEY_CHECKS=0");

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

    console.log("📚 Seeding mapel...");
    for (const m of MAPEL) {
      await conn.query("INSERT IGNORE INTO mapel (kode, nama) VALUES (?,?)", [
        m.kode,
        m.nama,
      ]);
    }

    console.log("🏫 Seeding jurusan...");
    const jurusanIds = {};
    for (const j of JURUSAN) {
      const [res] = await conn.query(
        "INSERT INTO jurusan (kode, nama) VALUES (?,?)",
        [j.kode, j.nama],
      );
      jurusanIds[j.kode] = res.insertId;
    }

    console.log("👤 Seeding admin...");
    const admins = [{ nama: "Admin Utama", email: "admin1@school.com" }];
    for (const a of admins) {
      const hashed = await bcrypt.hash("admin123", 10);
      await conn.query(
        "INSERT IGNORE INTO users (nama, email, password, role) VALUES (?,?,?,?)",
        [a.nama, a.email, hashed, "admin"],
      );
    }

    console.log("🏫 Seeding 30 kelas + guru walas...");
    const kelasIds = {};
    let guruCounter = 1;
    const guruHashed = await bcrypt.hash("GuruSmkn1babelan", 10);

    for (const j of JURUSAN) {
      for (const tingkat of TINGKAT) {
        for (let n = 1; n <= KELAS_PER_JURUSAN_PER_TINGKAT; n++) {
          const kelasNama = `${tingkat} ${j.kode} ${n}`;
          const [kr] = await conn.query(
            "INSERT INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id) VALUES (?,?,?,?)",
            [kelasNama, tingkat, jurusanIds[j.kode], taId],
          );
          kelasIds[kelasNama] = kr.insertId;

          await conn.query(
            "INSERT INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id) VALUES (?,?,?,?)",
            [kelasNama, tingkat, jurusanIds[j.kode], taGenapId],
          );

          const guruEmail = `guru${String(guruCounter).padStart(2, "0")}@school.com`;
          const [gu] = await conn.query(
            "INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)",
            [`Guru Walas ${kelasNama}`, guruEmail, guruHashed, "guru"],
          );
          await conn.query(
            "INSERT INTO guru (user_id, nip, is_walas, kelas_id) VALUES (?,?,1,?)",
            [
              gu.insertId,
              `NIP${String(guruCounter).padStart(6, "0")}`,
              kr.insertId,
            ],
          );
          await conn.query("UPDATE kelas SET wali_kelas_id = ? WHERE id = ?", [
            gu.insertId,
            kr.insertId,
          ]);
          guruCounter++;
        }
      }
    }

    console.log("👨‍🎓 Seeding siswa (15 per kelas)...");
    const siswaHashed = await bcrypt.hash("Smkn1babelan", 10);
    let siswaCounter = 1;

    for (const [kelasNama, kelasId] of Object.entries(kelasIds)) {
      for (let s = 1; s <= 15; s++) {
        const nisStr = String(siswaCounter).padStart(5, "0");
        const nis = `2026${nisStr}`;
        const email = `siswa${nisStr}@school.com`;
        const [ur] = await conn.query(
          "INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)",
          [`Siswa ${kelasNama} ${s}`, email, siswaHashed, "siswa"],
        );
        await conn.query(
          "INSERT INTO siswa (user_id, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas) VALUES (?,?,?,?,?)",
          [ur.insertId, nis, kelasId, taId, s === 1 ? 1 : 0],
        );
        siswaCounter++;
      }
    }

    await conn.commit();
    conn.release();

    console.log("\n✅ Seeding selesai!");
    console.log(`   👤 Admin : 1`);
    console.log(`   👨‍🏫 Guru  : ${guruCounter - 1}`);
    console.log(
      `   🏫 Kelas : ${Object.keys(kelasIds).length} (x2 tahun ajaran)`,
    );
    console.log(`   👨‍🎓 Siswa : ${Object.keys(kelasIds).length * 15}`);
    console.log("\n" + "=".repeat(50));
    console.log("🔑 AKUN DEMO LOGIN");
    console.log("=".repeat(50));
    console.log("👤 ADMIN");
    console.log("   Email    : admin1@school.com");
    console.log("   Password : admin123");
    console.log("-".repeat(50));
    console.log("👨‍🏫 GURU (salah satu)");
    console.log("   NIP      : NIP000001");
    console.log("   Password : GuruSmkn1babelan");
    console.log("   (Semua guru: NIP000001 s/d NIP000030)");
    console.log("-".repeat(50));
    console.log("👨‍🎓 SISWA (salah satu)");
    console.log("   NIS      : 202600001");
    console.log("   Password : Smkn1babelan");
    console.log("   (Semua siswa: NIS 202600001 s/d 202600450)");
    console.log("=".repeat(50));
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Seeding gagal:", err.message);
    process.exit(1);
  }
}

seed();
