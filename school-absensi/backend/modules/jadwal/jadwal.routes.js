const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

// Helper: get current week number since epoch (untuk menentukan minggu ganjil/genap)
function getWeekParity(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return weekNum % 2 === 1 ? 'ganjil' : 'genap'; // odd=ganjil, even=genap
}

// GET /api/jadwal - with optional date filter for week parity
router.get('/', auth, async (req, res) => {
  try {
    const { kelas_id, guru_id, tahun_ajaran_id, tanggal, jurusan_id } = req.query;
    let where = [];
    let params = [];
    if (kelas_id) { where.push('j.kelas_id = ?'); params.push(kelas_id); }
    if (guru_id) { where.push('j.guru_id = ?'); params.push(guru_id); }
    if (tahun_ajaran_id) { where.push('j.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
    if (jurusan_id) { where.push('k.jurusan_id = ?'); params.push(jurusan_id); }

    const [rows] = await db.query(`
      SELECT j.*, u.nama as guru_nama, k.nama as kelas_nama, k.tingkat, k.jurusan_id,
             jr.nama as jurusan_nama, jr.kode as jurusan_kode, m.nama as mapel_nama, m.kode as mapel_kode
      FROM jadwal_mengajar j
      JOIN guru g ON j.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      JOIN kelas k ON j.kelas_id = k.id
      JOIN jurusan jr ON k.jurusan_id = jr.id
      JOIN mapel m ON j.mapel_id = m.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY FIELD(j.hari,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'), j.jam_mulai`, params);

    // If tanggal provided, filter by pola_minggu
    let filtered = rows;
    if (tanggal) {
      const parity = getWeekParity(tanggal);
      filtered = rows.filter(r => r.pola_minggu === 'semua' || r.pola_minggu === parity);
    }

    res.json({ success: true, data: filtered, weekParity: tanggal ? getWeekParity(tanggal) : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jadwal/minggu-info - info minggu saat ini
router.get('/minggu-info', auth, async (req, res) => {
  try {
    const { tanggal } = req.query;
    const d = tanggal ? new Date(tanggal) : new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const parity = weekNum % 2 === 1 ? 'ganjil' : 'genap';
    res.json({ success: true, data: { weekNum, parity, tanggal: d.toISOString().slice(0,10) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jadwal
router.post('/', auth, requireRole('admin', 'guru'), async (req, res) => {
  try {
    const { guru_id, kelas_id, mapel_id, tahun_ajaran_id, hari, jam_mulai, jam_selesai, tipe_sesi, pola_minggu, jurusan_urutan } = req.body;
    const [result] = await db.query(
      'INSERT INTO jadwal_mengajar (guru_id, kelas_id, mapel_id, tahun_ajaran_id, hari, jam_mulai, jam_selesai, tipe_sesi, pola_minggu, jurusan_urutan) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [guru_id, kelas_id, mapel_id, tahun_ajaran_id, hari, jam_mulai, jam_selesai, tipe_sesi || 'teori', pola_minggu || 'semua', jurusan_urutan || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/jadwal/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { guru_id, kelas_id, mapel_id, hari, jam_mulai, jam_selesai, tipe_sesi, pola_minggu, jurusan_urutan } = req.body;
    await db.query('UPDATE jadwal_mengajar SET guru_id=?, kelas_id=?, mapel_id=?, hari=?, jam_mulai=?, jam_selesai=?, tipe_sesi=?, pola_minggu=?, jurusan_urutan=? WHERE id=?',
      [guru_id, kelas_id, mapel_id, hari, jam_mulai, jam_selesai, tipe_sesi || 'teori', pola_minggu || 'semua', jurusan_urutan || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/jadwal/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM jadwal_mengajar WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
