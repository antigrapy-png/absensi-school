const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { is_walas } = req.query;
    let where = '';
    let params = [];
    if (is_walas !== undefined) { where = 'WHERE g.is_walas = ?'; params.push(is_walas); }
    const [rows] = await db.query(`
      SELECT g.*, u.nama, u.email, u.is_active, k.nama as kelas_nama
      FROM guru g JOIN users u ON g.user_id = u.id
      LEFT JOIN kelas k ON g.kelas_id = k.id
      ${where} ORDER BY u.nama`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, u.nama, u.email, k.nama as kelas_nama
      FROM guru g JOIN users u ON g.user_id = u.id
      LEFT JOIN kelas k ON g.kelas_id = k.id
      WHERE g.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { nama, email, nip, password, is_walas, kelas_id } = req.body;
    await conn.beginTransaction();
    const hashed = await bcrypt.hash(password || 'guru123', 10);
    const [u] = await conn.query('INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)', [nama, email, hashed, 'guru']);
    const [g] = await conn.query('INSERT INTO guru (user_id, nip, is_walas, kelas_id) VALUES (?,?,?,?)',
      [u.insertId, nip, is_walas ? 1 : 0, kelas_id || null]);
    if (is_walas && kelas_id) {
      await conn.query('UPDATE kelas SET wali_kelas_id = ? WHERE id = ?', [u.insertId, kelas_id]);
    }
    await conn.commit();
    conn.release();
    res.json({ success: true, data: { user_id: u.insertId, guru_id: g.insertId } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { nama, email, nip, is_walas, kelas_id } = req.body;
    await conn.beginTransaction();
    const [g] = await conn.query('SELECT user_id FROM guru WHERE id = ?', [req.params.id]);
    if (!g.length) { await conn.rollback(); conn.release(); return res.status(404).json({ success: false, message: 'Tidak ditemukan' }); }
    await conn.query('UPDATE users SET nama=?, email=? WHERE id=?', [nama, email, g[0].user_id]);
    await conn.query('UPDATE guru SET nip=?, is_walas=?, kelas_id=? WHERE id=?', [nip, is_walas ? 1 : 0, kelas_id || null, req.params.id]);
    if (is_walas && kelas_id) {
      await conn.query('UPDATE kelas SET wali_kelas_id = ? WHERE id = ?', [g[0].user_id, kelas_id]);
    }
    await conn.commit();
    conn.release();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const [g] = await db.query('SELECT user_id FROM guru WHERE id = ?', [req.params.id]);
    if (!g.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [g[0].user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-password', auth, requireRole('admin'), async (req, res) => {
  try {
    const [g] = await db.query('SELECT user_id FROM guru WHERE id = ?', [req.params.id]);
    if (!g.length) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });
    const pw = req.body.password || 'guru123';
    const hashed = await bcrypt.hash(pw, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, g[0].user_id]);
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/guru/user/:userId/reset-password — reset by user_id (dari PWA)
router.put('/user/:userId/reset-password', auth, requireRole('admin'), async (req, res) => {
  try {
    const pw = req.body.password || 'guru123';
    if (pw.length < 4) return res.status(400).json({ success: false, message: 'Password min. 4 karakter' });
    const hashed = await bcrypt.hash(pw, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.userId]);
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
