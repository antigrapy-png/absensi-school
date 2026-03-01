const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole, logActivity } = require('../../middlewares/auth');
const moment = require('moment');

// Check if semester is active and absensi is editable (within 24 hours)
async function checkEditable(tahunAjaranId, tanggal) {
  const [ta] = await db.query('SELECT is_active FROM tahun_ajaran WHERE id = ?', [tahunAjaranId]);
  if (!ta.length || !ta[0].is_active) return { ok: false, msg: 'Semester tidak aktif, absensi read-only' };
  const absenDate = moment(tanggal);
  const diff = moment().diff(absenDate, 'hours');
  if (diff > 24) return { ok: false, msg: 'Absensi terkunci setelah 24 jam' };
  return { ok: true };
}

// === ABSENSI HARIAN ===

// GET /api/absensi/harian
router.get('/harian', auth, async (req, res) => {
  try {
    const { kelas_id, tanggal, tahun_ajaran_id } = req.query;
    let where = [];
    let params = [];
    if (kelas_id) { where.push('ah.kelas_id = ?'); params.push(kelas_id); }
    if (tanggal) { where.push('ah.tanggal = ?'); params.push(tanggal); }
    if (tahun_ajaran_id) { where.push('ah.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
    const [rows] = await db.query(`
      SELECT ah.*, u.nama as siswa_nama, s.nis
      FROM absensi_harian ah
      JOIN siswa s ON ah.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.nama`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/absensi/harian/bulk - isi absensi harian (1 kelas)
router.post('/harian/bulk', auth, requireRole('admin','guru'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { kelas_id, tanggal, tahun_ajaran_id, data } = req.body;
    // data = [{ siswa_id, status, keterangan }, ...]

    // Check active semester
    const [ta] = await conn.query('SELECT is_active FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);
    if (!ta.length || !ta[0].is_active) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Semester tidak aktif' });
    }

    await conn.beginTransaction();
    let inserted = 0;
    for (const item of data) {
      await conn.query(`
        INSERT INTO absensi_harian (siswa_id, kelas_id, tahun_ajaran_id, tanggal, status, keterangan, dicatat_oleh)
        VALUES (?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan)`,
        [item.siswa_id, kelas_id, tahun_ajaran_id, tanggal, item.status, item.keterangan || null, req.user.id]);
      inserted++;
    }
    await conn.commit();
    conn.release();
    await logActivity(req.user.id, 'INPUT_ABSENSI_HARIAN', `Kelas ${kelas_id}, tanggal ${tanggal}, ${inserted} siswa`, req.ip);
    res.json({ success: true, message: `${inserted} absensi berhasil disimpan` });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/absensi/harian/rekap?kelas_id=&tahun_ajaran_id=&bulan=&dari=&sampai=
router.get('/harian/rekap', auth, async (req, res) => {
  try {
    const { kelas_id, tahun_ajaran_id, bulan, dari, sampai } = req.query;
    let ahWhere = ['1=1'];
    let params = [];
    if (tahun_ajaran_id) { ahWhere.push('ah.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
    if (kelas_id)         { ahWhere.push('ah.kelas_id = ?');         params.push(kelas_id); }
    if (bulan)            { ahWhere.push('DATE_FORMAT(ah.tanggal, "%Y-%m") = ?'); params.push(bulan); }
    if (dari)             { ahWhere.push('ah.tanggal >= ?');          params.push(dari); }
    if (sampai)           { ahWhere.push('ah.tanggal <= ?');          params.push(sampai); }

    let siswaWhere = [];
    let siswaParams = [];
    if (kelas_id)         { siswaWhere.push('s.kelas_id = ?');         siswaParams.push(kelas_id); }
    if (tahun_ajaran_id)  { siswaWhere.push('s.tahun_ajaran_id = ?');  siswaParams.push(tahun_ajaran_id); }

    const [rows] = await db.query(`
      SELECT s.id as siswa_id, u.nama, s.nis, k.nama as kelas_nama,
        SUM(ah.status='hadir') as hadir,
        SUM(ah.status='sakit') as sakit,
        SUM(ah.status='izin') as izin,
        SUM(ah.status='alpha') as alpha,
        COUNT(ah.id) as total
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN absensi_harian ah ON ah.siswa_id = s.id AND ${ahWhere.join(' AND ')}
      ${siswaWhere.length ? 'WHERE ' + siswaWhere.join(' AND ') : ''}
      GROUP BY s.id, u.nama, s.nis, k.nama
      ORDER BY k.nama, u.nama`, [...params, ...siswaParams]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// === ABSENSI MAPEL ===

router.get('/mapel', auth, async (req, res) => {
  try {
    const { jadwal_id, tanggal, tahun_ajaran_id } = req.query;
    let where = [];
    let params = [];
    if (jadwal_id) { where.push('am.jadwal_id = ?'); params.push(jadwal_id); }
    if (tanggal) { where.push('am.tanggal = ?'); params.push(tanggal); }
    if (tahun_ajaran_id) { where.push('am.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
    const [rows] = await db.query(`
      SELECT am.*, u.nama as siswa_nama, s.nis
      FROM absensi_mapel am
      JOIN siswa s ON am.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.nama`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/mapel/bulk', auth, requireRole('admin','guru'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { jadwal_id, tanggal, tahun_ajaran_id, data } = req.body;
    const [ta] = await conn.query('SELECT is_active FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);
    if (!ta.length || !ta[0].is_active) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Semester tidak aktif' });
    }
    await conn.beginTransaction();
    for (const item of data) {
      await conn.query(`
        INSERT INTO absensi_mapel (siswa_id, jadwal_id, tahun_ajaran_id, tanggal, status, keterangan)
        VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan)`,
        [item.siswa_id, jadwal_id, tahun_ajaran_id, tanggal, item.status, item.keterangan || null]);
    }
    await conn.commit();
    conn.release();
    res.json({ success: true, message: 'Absensi mapel tersimpan' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/absensi/siswa/:siswa_id - riwayat absensi siswa
router.get('/siswa/:siswa_id', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;
    let params = [req.params.siswa_id];
    let taWhere = '';
    if (tahun_ajaran_id) { taWhere = 'AND ah.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
    const [rows] = await db.query(`
      SELECT ah.*, ta.nama as ta_nama, ta.semester
      FROM absensi_harian ah
      JOIN tahun_ajaran ta ON ah.tahun_ajaran_id = ta.id
      WHERE ah.siswa_id = ? ${taWhere}
      ORDER BY ah.tanggal DESC`, params);

    // Stats
    const stats = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, data: rows, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/absensi/statistik - statistik global
router.get('/statistik', auth, requireRole('admin'), async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;
    let taWhere = '';
    let params = [];
    if (tahun_ajaran_id) { taWhere = 'WHERE ah.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }

    const [byJurusan] = await db.query(`
      SELECT j.nama as jurusan, 
        SUM(ah.status='hadir') as hadir, SUM(ah.status='alpha') as alpha,
        COUNT(ah.id) as total
      FROM absensi_harian ah
      JOIN kelas k ON ah.kelas_id = k.id
      JOIN jurusan j ON k.jurusan_id = j.id
      ${taWhere} GROUP BY j.id, j.nama`, params);

    const [byTingkat] = await db.query(`
      SELECT k.tingkat,
        SUM(ah.status='hadir') as hadir, SUM(ah.status='alpha') as alpha,
        COUNT(ah.id) as total
      FROM absensi_harian ah
      JOIN kelas k ON ah.kelas_id = k.id
      ${taWhere} GROUP BY k.tingkat`, params);

    const [summary] = await db.query(`
      SELECT SUM(status='hadir') as hadir, SUM(status='sakit') as sakit,
             SUM(status='izin') as izin, SUM(status='alpha') as alpha,
             COUNT(*) as total
      FROM absensi_harian ah ${taWhere}`, params);

    res.json({ success: true, data: { summary: summary[0], byJurusan, byTingkat } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
