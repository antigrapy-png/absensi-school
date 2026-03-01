require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const db = require("../config/database");

async function cleanup() {
  const conn = await db.getConnection();
  await conn.query("SET FOREIGN_KEY_CHECKS=0");
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
  conn.release();
  console.log("✅ Database bersih!");
  process.exit(0);
}
cleanup();
