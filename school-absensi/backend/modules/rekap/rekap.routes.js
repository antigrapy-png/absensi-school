const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

// GET /api/rekap/dashboard - dashboard stats per role
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;
    const taFilter = tahun_ajaran_id ? tahun_ajaran_id : null;

    if (req.user.role === 'admin') {
      const taWhere = taFilter ? 'WHERE tahun_ajaran_id = ?' : '';
      const taParams = taFilter ? [taFilter] : [];

      const [jumlahSiswa] = await db.query(`SELECT COUNT(DISTINCT user_id) as total FROM siswa ${taWhere}`, taParams);
      const [jumlahGuru] = await db.query('SELECT COUNT(*) as total FROM guru g JOIN users u ON g.user_id = u.id WHERE u.is_active = 1');
      const [jumlahKelas] = await db.query(`SELECT COUNT(*) as total FROM kelas ${taWhere}`, taParams);

      const ahWhere = taFilter ? 'WHERE ah.tahun_ajaran_id = ?' : '';
      const [absensiSummary] = await db.query(`
        SELECT SUM(status='hadir') as hadir, SUM(status='sakit') as sakit,
               SUM(status='izin') as izin, SUM(status='alpha') as alpha, COUNT(*) as total
        FROM absensi_harian ah ${ahWhere}`, taParams);

      const [byJurusan] = await db.query(`
        SELECT j.nama, SUM(ah.status='hadir') as hadir, SUM(ah.status='alpha') as alpha, COUNT(ah.id) as total
        FROM jurusan j
        LEFT JOIN kelas k ON k.jurusan_id = j.id ${taFilter ? 'AND k.tahun_ajaran_id = ?' : ''}
        LEFT JOIN absensi_harian ah ON ah.kelas_id = k.id ${taFilter ? 'AND ah.tahun_ajaran_id = ?' : ''}
        GROUP BY j.id, j.nama ORDER BY j.nama`,
        taFilter ? [taFilter, taFilter] : []);

      const [byTingkat] = await db.query(`
        SELECT k.tingkat, SUM(ah.status='hadir') as hadir, SUM(ah.status='alpha') as alpha, COUNT(ah.id) as total
        FROM kelas k
        LEFT JOIN absensi_harian ah ON ah.kelas_id = k.id ${taFilter ? 'AND ah.tahun_ajaran_id = ?' : ''}
        ${taFilter ? 'WHERE k.tahun_ajaran_id = ?' : ''}
        GROUP BY k.tingkat ORDER BY k.tingkat`,
        taFilter ? [taFilter, taFilter] : []);

      return res.json({ success: true, data: {
        jumlahSiswa: jumlahSiswa[0].total,
        jumlahGuru: jumlahGuru[0].total,
        jumlahKelas: jumlahKelas[0].total,
        absensiSummary: absensiSummary[0],
        byJurusan, byTingkat
      }});
    }

    if (req.user.role === 'guru') {
      const [g] = await db.query('SELECT id, is_walas, kelas_id FROM guru WHERE user_id = ?', [req.user.id]);
      if (!g.length) return res.json({ success: true, data: {} });
      const guru = g[0];

      const taWhere = taFilter ? 'AND j.tahun_ajaran_id = ?' : '';
      const taParams = taFilter ? [guru.id, taFilter] : [guru.id];

      const [jadwals] = await db.query(`SELECT j.id, m.nama as mapel, k.nama as kelas, j.hari, j.jam_mulai, j.jam_selesai, j.tipe_sesi, j.pola_minggu FROM jadwal_mengajar j
        JOIN mapel m ON j.mapel_id = m.id JOIN kelas k ON j.kelas_id = k.id
        WHERE j.guru_id = ? ${taWhere} ORDER BY FIELD(j.hari,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'), j.jam_mulai`, taParams);

      let kelasStats = null;
      if (guru.is_walas && guru.kelas_id) {
        const kwhere = taFilter ? 'AND ah.tahun_ajaran_id = ?' : '';
        const kparams = taFilter ? [guru.kelas_id, taFilter] : [guru.kelas_id];
        const [ks] = await db.query(`
          SELECT SUM(status='hadir') as hadir, SUM(status='sakit') as sakit,
                 SUM(status='izin') as izin, SUM(status='alpha') as alpha, COUNT(*) as total
          FROM absensi_harian ah WHERE ah.kelas_id = ? ${kwhere}`, kparams);
        kelasStats = ks[0];
      }

      let totalSiswa = 0, kelasNama = null;
      if (guru.is_walas && guru.kelas_id) {
        const [kInfo] = await db.query('SELECT k.nama, COUNT(s.id) as cnt FROM kelas k LEFT JOIN siswa s ON s.kelas_id = k.id AND s.is_active=1 WHERE k.id = ? GROUP BY k.id', [guru.kelas_id]);
        if (kInfo.length) { totalSiswa = kInfo[0].cnt; kelasNama = kInfo[0].nama; }
      }
      return res.json({ success: true, data: { jadwals, kelasStats, isWalas: guru.is_walas, totalSiswa, kelasNama } });
    }

    if (req.user.role === 'siswa') {
      const [s] = await db.query('SELECT s.id, s.kelas_id FROM siswa s JOIN tahun_ajaran ta ON s.tahun_ajaran_id = ta.id WHERE s.user_id = ? ORDER BY s.id DESC LIMIT 1', [req.user.id]);
      if (!s.length) return res.json({ success: true, data: {} });

      const taWhere = taFilter ? 'AND ah.tahun_ajaran_id = ?' : '';
      const taParams = taFilter ? [s[0].id, taFilter] : [s[0].id];

      const [stats] = await db.query(`
        SELECT SUM(status='hadir') as hadir, SUM(status='sakit') as sakit,
               SUM(status='izin') as izin, SUM(status='alpha') as alpha, COUNT(*) as total
        FROM absensi_harian ah WHERE ah.siswa_id = ? ${taWhere}`, taParams);

      const [monthly] = await db.query(`
        SELECT DATE_FORMAT(tanggal,'%Y-%m') as bulan,
               SUM(status='hadir') as hadir, SUM(status='alpha') as alpha, COUNT(*) as total
        FROM absensi_harian WHERE siswa_id = ? ${taWhere}
        GROUP BY bulan ORDER BY bulan DESC LIMIT 6`, taParams);

      return res.json({ success: true, data: { stats: stats[0], monthly } });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
