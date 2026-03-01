const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth } = require('../../middlewares/auth');

router.get('/kehadiran', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id, kelas_id, siswa_id } = req.query;
    let where = ['1=1'], params = [];
    if (tahun_ajaran_id) { where.push('ah.tahun_ajaran_id=?'); params.push(tahun_ajaran_id); }
    if (kelas_id)        { where.push('ah.kelas_id=?');        params.push(kelas_id); }
    if (siswa_id)        { where.push('ah.siswa_id=?');        params.push(siswa_id); }
    const w = where.join(' AND ');

    const [byHari] = await db.query(`SELECT DAYOFWEEK(ah.tanggal) as hari_num, COUNT(*) as total, SUM(status='hadir') as hadir, SUM(status='alpha') as alpha, ROUND(SUM(status='hadir')/COUNT(*)*100) as pct FROM absensi_harian ah WHERE ${w} GROUP BY DAYOFWEEK(ah.tanggal) ORDER BY hari_num`, params);
    const hariNames = ['','Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

    const [byBulan] = await db.query(`SELECT DATE_FORMAT(ah.tanggal,'%Y-%m') as bulan, DATE_FORMAT(ah.tanggal,'%b %Y') as label, COUNT(*) as total, SUM(status='hadir') as hadir, SUM(status='sakit') as sakit, SUM(status='izin') as izin, SUM(status='alpha') as alpha, ROUND(SUM(status='hadir')/COUNT(*)*100) as pct FROM absensi_harian ah WHERE ${w} GROUP BY DATE_FORMAT(ah.tanggal,'%Y-%m') ORDER BY bulan`, params);

    const [byMinggu] = await db.query(`SELECT YEARWEEK(ah.tanggal,1) as minggu, MIN(ah.tanggal) as tgl_mulai, COUNT(*) as total, SUM(status='hadir') as hadir, SUM(status='alpha') as alpha, ROUND(SUM(status='hadir')/COUNT(*)*100) as pct FROM absensi_harian ah WHERE ${w} GROUP BY YEARWEEK(ah.tanggal,1) ORDER BY minggu DESC LIMIT 12`, params);

    const [topAlpha] = await db.query(`SELECT u.nama, s.nis, k.nama as kelas_nama, SUM(ah.status='alpha') as alpha_count, COUNT(ah.id) as total, ROUND(SUM(ah.status='hadir')/COUNT(ah.id)*100) as pct_hadir FROM absensi_harian ah JOIN siswa s ON ah.siswa_id=s.id JOIN users u ON s.user_id=u.id JOIN kelas k ON ah.kelas_id=k.id WHERE ${w} GROUP BY ah.siswa_id ORDER BY alpha_count DESC LIMIT 10`, params);

    const [summary] = await db.query(`SELECT COUNT(*) as total, SUM(status='hadir') as hadir, SUM(status='sakit') as sakit, SUM(status='izin') as izin, SUM(status='alpha') as alpha, COUNT(DISTINCT ah.siswa_id) as total_siswa, COUNT(DISTINCT ah.tanggal) as total_hari FROM absensi_harian ah WHERE ${w}`, params);

    res.json({ success: true, data: {
      summary: summary[0],
      byHari: byHari.map(r => ({ ...r, hari: hariNames[r.hari_num] || r.hari_num })),
      byBulan, byMinggu: byMinggu.reverse(), topAlpha
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/perbandingan-jurusan', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;
    const [rows] = await db.query(`SELECT j.nama as jurusan, j.kode, k.tingkat, COUNT(DISTINCT ah.siswa_id) as total_siswa, SUM(ah.status='hadir') as hadir, SUM(ah.status='sakit') as sakit, SUM(ah.status='izin') as izin, SUM(ah.status='alpha') as alpha, COUNT(ah.id) as total, ROUND(SUM(ah.status='hadir')/NULLIF(COUNT(ah.id),0)*100) as pct_hadir FROM absensi_harian ah JOIN kelas k ON ah.kelas_id=k.id JOIN jurusan j ON k.jurusan_id=j.id WHERE ah.tahun_ajaran_id=? GROUP BY j.id, k.tingkat ORDER BY j.nama, k.tingkat`, [tahun_ajaran_id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
