const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

// GET /api/kelas?tahun_ajaran_id=&jurusan_id=&tingkat=
router.get('/', auth, async (req, res) => {
  try {
    let where = [];
    let params = [];
    if (req.query.tahun_ajaran_id) { where.push('k.tahun_ajaran_id = ?'); params.push(req.query.tahun_ajaran_id); }
    if (req.query.jurusan_id) { where.push('k.jurusan_id = ?'); params.push(req.query.jurusan_id); }
    if (req.query.tingkat) { where.push('k.tingkat = ?'); params.push(req.query.tingkat); }
    const sql = `SELECT k.*, j.kode as jurusan_kode, j.nama as jurusan_nama, 
                        u.nama as walas_nama, ta.nama as ta_nama, ta.semester
                 FROM kelas k 
                 JOIN jurusan j ON k.jurusan_id = j.id
                 JOIN tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
                 LEFT JOIN users u ON k.wali_kelas_id = u.id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY k.tingkat, j.kode, k.nama`;
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/kelas/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT k.*, j.kode as jurusan_kode, j.nama as jurusan_nama, u.nama as walas_nama
      FROM kelas k JOIN jurusan j ON k.jurusan_id = j.id
      LEFT JOIN users u ON k.wali_kelas_id = u.id
      WHERE k.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/kelas/:id/siswa
router.get('/:id/siswa', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id } = req.query;
    let taWhere = '';
    let params = [req.params.id];
    if (tahun_ajaran_id) { taWhere = 'AND s.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
    const [rows] = await db.query(`
      SELECT s.*, u.nama, u.email
      FROM siswa s JOIN users u ON s.user_id = u.id
      WHERE s.kelas_id = ? ${taWhere}
      ORDER BY u.nama`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nama, tingkat, jurusan_id, tahun_ajaran_id, wali_kelas_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id, wali_kelas_id) VALUES (?,?,?,?,?)',
      [nama, tingkat, jurusan_id, tahun_ajaran_id, wali_kelas_id || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nama, tingkat, jurusan_id, wali_kelas_id } = req.body;
    await db.query('UPDATE kelas SET nama=?, tingkat=?, jurusan_id=?, wali_kelas_id=? WHERE id=?',
      [nama, tingkat, jurusan_id, wali_kelas_id || null, req.params.id]);
    // Update guru walas flag
    if (wali_kelas_id) {
      const [g] = await db.query('SELECT id FROM guru WHERE user_id = ?', [wali_kelas_id]);
      if (g.length) {
        await db.query('UPDATE guru SET is_walas=1, kelas_id=? WHERE id=?', [req.params.id, g[0].id]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
