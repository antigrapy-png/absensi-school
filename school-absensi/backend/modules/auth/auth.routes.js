const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { auth, logActivity } = require('../../middlewares/auth');

async function getExtraInfo(db, user) {
  let extra = {};
  if (user.role === 'guru') {
    const [g] = await db.query(
      'SELECT g.*, k.nama as kelas_nama FROM guru g LEFT JOIN kelas k ON g.kelas_id = k.id WHERE g.user_id = ?',
      [user.id]
    );
    if (g.length) extra = { guru_id: g[0].id, is_walas: g[0].is_walas, kelas_id: g[0].kelas_id, kelas_nama: g[0].kelas_nama, nip: g[0].nip };
  } else if (user.role === 'siswa') {
    const [s] = await db.query(`
      SELECT s.*, k.nama as kelas_nama, ta.nama as ta_nama, ta.semester
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN tahun_ajaran ta ON s.tahun_ajaran_id = ta.id
      WHERE s.user_id = ? ORDER BY ta.is_active DESC, s.id DESC LIMIT 1`, [user.id]);
    if (s.length) extra = {
      siswa_id: s[0].id, is_ketua_kelas: s[0].is_ketua_kelas,
      kelas_id: s[0].kelas_id, kelas_nama: s[0].kelas_nama,
      nis: s[0].nis, ta_nama: s[0].ta_nama, semester: s[0].semester
    };
  }
  return extra;
}

// POST /api/auth/login - support email (admin), NIP (guru), NIS (siswa)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier dan password wajib diisi' });
    }

    let user = null;

    if (role === 'guru') {
      // Login pakai NIP
      const [g] = await db.query(
        'SELECT u.* FROM users u JOIN guru g ON g.user_id = u.id WHERE g.nip = ? AND u.is_active = 1',
        [identifier]
      );
      user = g[0] || null;
    } else if (role === 'siswa') {
      // Login pakai NIS
      const [s] = await db.query(
        'SELECT u.* FROM users u JOIN siswa si ON si.user_id = u.id WHERE si.nis = ? AND u.is_active = 1 LIMIT 1',
        [identifier]
      );
      user = s[0] || null;
    } else {
      // Admin login pakai email
      const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1 AND role = ?', [identifier, 'admin']);
      user = rows[0] || null;
      // Fallback: coba email untuk semua role jika tidak ada role spesifik
      if (!user && !role) {
        const [allRows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [identifier]);
        user = allRows[0] || null;
      }
    }

    if (!user) return res.status(401).json({ success: false, message: 'Identitas atau password salah' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Identitas atau password salah' });

    const extra = await getExtraInfo(db, user);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    await logActivity(user.id, 'LOGIN', `Login sebagai ${user.role}`, req.ip);

    res.json({
      success: true,
      data: { token, user: { id: user.id, nama: user.nama, email: user.email, role: user.role, ...extra } }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const extra = await getExtraInfo(db, req.user);
    res.json({ success: true, data: { ...req.user, ...extra } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(old_password, rows[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Password lama salah' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
