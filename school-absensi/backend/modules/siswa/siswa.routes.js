const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { kelas_id, tahun_ajaran_id, is_alumni } = req.query;
    let where = [];
    let params = [];
    if (kelas_id) { where.push('s.kelas_id = ?'); params.push(kelas_id); }
    if (tahun_ajaran_id) { where.push('s.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
    if (is_alumni !== undefined) { where.push('s.is_alumni = ?'); params.push(is_alumni); }
    const [rows] = await db.query(`
      SELECT s.*, u.nama, u.email, u.is_active, k.nama as kelas_nama, ta.nama as ta_nama, ta.semester
      FROM siswa s JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      JOIN tahun_ajaran ta ON s.tahun_ajaran_id = ta.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY k.nama, u.nama`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.nama, u.email, k.nama as kelas_nama, ta.nama as ta_nama, ta.semester
      FROM siswa s JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      JOIN tahun_ajaran ta ON s.tahun_ajaran_id = ta.id
      WHERE s.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { nama, email, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas, password } = req.body;
    await conn.beginTransaction();
    const hashed = await bcrypt.hash(password || 'siswa123', 10);
    const [u] = await conn.query('INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)', [nama, email, hashed, 'siswa']);
    const [s] = await conn.query(
      'INSERT INTO siswa (user_id, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas) VALUES (?,?,?,?,?)',
      [u.insertId, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas ? 1 : 0]
    );
    await conn.commit();
    conn.release();
    res.json({ success: true, data: { user_id: u.insertId, siswa_id: s.insertId } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { nama, email, nis, kelas_id, is_ketua_kelas, is_active } = req.body;
    await conn.beginTransaction();
    const [s] = await conn.query('SELECT user_id FROM siswa WHERE id = ?', [req.params.id]);
    if (!s.length) { await conn.rollback(); conn.release(); return res.status(404).json({ success: false, message: 'Tidak ditemukan' }); }
    // Update users
    const userUpdates = [];
    const userParams = [];
    if (nama !== undefined)      { userUpdates.push('nama=?');      userParams.push(nama); }
    if (email !== undefined)     { userUpdates.push('email=?');     userParams.push(email); }
    if (is_active !== undefined) { userUpdates.push('is_active=?'); userParams.push(is_active ? 1 : 0); }
    if (userUpdates.length) {
      userParams.push(s[0].user_id);
      await conn.query(`UPDATE users SET ${userUpdates.join(',')} WHERE id=?`, userParams);
    }
    // Update siswa
    if (nis !== undefined || kelas_id !== undefined || is_ketua_kelas !== undefined) {
      const siswaUpdates = [], siswaParams = [];
      if (nis !== undefined)            { siswaUpdates.push('nis=?');           siswaParams.push(nis); }
      if (kelas_id !== undefined)       { siswaUpdates.push('kelas_id=?');      siswaParams.push(kelas_id); }
      if (is_ketua_kelas !== undefined) { siswaUpdates.push('is_ketua_kelas=?');siswaParams.push(is_ketua_kelas ? 1 : 0); }
      siswaParams.push(req.params.id);
      await conn.query(`UPDATE siswa SET ${siswaUpdates.join(',')} WHERE id=?`, siswaParams);
    }
    await conn.commit(); conn.release();
    res.json({ success: true, message: 'Siswa diperbarui' });
  } catch (err) {
    await conn.rollback(); conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/siswa/:id/reset-password
router.put('/:id/reset-password', auth, requireRole('admin'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) return res.status(400).json({ success: false, message: 'Password min. 4 karakter' });
    const [s] = await db.query('SELECT user_id FROM siswa WHERE id=?', [req.params.id]);
    if (!s.length) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    const hashed = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, s[0].user_id]);
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/siswa/bulk-action (accessible by admin AND ketua kelas)
router.post('/bulk-action', auth, async (req, res) => {
  try {
    const { action, ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'Tidak ada siswa dipilih' });
    if (action === 'deactivate') {
      const [siswaRows] = await db.query('SELECT user_id FROM siswa WHERE id IN (?)', [ids]);
      const userIds = siswaRows.map(r => r.user_id);
      if (userIds.length) await db.query('UPDATE users SET is_active = 0 WHERE id IN (?)', [userIds]);
    } else if (action === 'set-ketua') {
      const [newKetua] = await db.query('SELECT kelas_id, tahun_ajaran_id FROM siswa WHERE id = ?', [ids[0]]);
      if (newKetua.length) {
        await db.query('UPDATE siswa SET is_ketua_kelas = 0 WHERE kelas_id = ? AND tahun_ajaran_id = ?',
          [newKetua[0].kelas_id, newKetua[0].tahun_ajaran_id]);
        await db.query('UPDATE siswa SET is_ketua_kelas = 1 WHERE id = ?', [ids[0]]);
      }
    } else if (action === 'activate') {
      const [siswaRows] = await db.query('SELECT user_id FROM siswa WHERE id IN (?)', [ids]);
      const userIds = siswaRows.map(r => r.user_id);
      if (userIds.length) await db.query('UPDATE users SET is_active = 1 WHERE id IN (?)', [userIds]);
    }
    res.json({ success: true, message: 'Aksi berhasil' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const [s] = await db.query('SELECT user_id FROM siswa WHERE id = ?', [req.params.id]);
    if (!s.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [s[0].user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
