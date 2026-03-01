const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole, logActivity } = require('../../middlewares/auth');

// GET /api/semester - list semua
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tahun_ajaran ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/semester/active
router.get('/active', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tahun_ajaran WHERE is_active = 1 LIMIT 1');
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tidak ada semester aktif' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/semester - tambah semester baru
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nama, semester, start_date, end_date } = req.body;
    const [result] = await db.query(
      'INSERT INTO tahun_ajaran (nama, semester, is_active, start_date, end_date) VALUES (?,?,0,?,?)',
      [nama, semester, start_date, end_date]
    );
    await logActivity(req.user.id, 'ADD_SEMESTER', `Tambah semester ${nama} ${semester}`, req.ip);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/semester/:id/activate - set aktif
router.put('/:id/activate', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE tahun_ajaran SET is_active = 0');
    await conn.query('UPDATE tahun_ajaran SET is_active = 1 WHERE id = ?', [req.params.id]);
    await conn.commit();
    conn.release();
    await logActivity(req.user.id, 'ACTIVATE_SEMESTER', `Aktifkan semester id=${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Semester diaktifkan' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/semester/:id/duplicate-kelas - duplikasi kelas ke semester baru
router.post('/:id/duplicate-kelas', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { target_semester_id } = req.body;
    await conn.beginTransaction();
    const [kelas] = await conn.query('SELECT * FROM kelas WHERE tahun_ajaran_id = ?', [req.params.id]);
    for (const k of kelas) {
      await conn.query(
        'INSERT IGNORE INTO kelas (nama, tingkat, jurusan_id, tahun_ajaran_id) VALUES (?,?,?,?)',
        [k.nama, k.tingkat, k.jurusan_id, target_semester_id]
      );
    }
    await conn.commit();
    conn.release();
    res.json({ success: true, message: `${kelas.length} kelas berhasil diduplikasi` });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/semester/naik-tingkat - naik kelas otomatis
router.post('/naik-tingkat', auth, requireRole('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { from_ta_id, to_ta_id } = req.body;
    await conn.beginTransaction();

    // Get all siswa from old semester
    const [siswas] = await conn.query(`
      SELECT s.*, k.tingkat, k.jurusan_id, k.nama as kelas_nama
      FROM siswa s JOIN kelas k ON s.kelas_id = k.id
      WHERE s.tahun_ajaran_id = ?`, [from_ta_id]);

    let naik = 0, lulus = 0;
    for (const s of siswas) {
      if (s.tingkat === 'XII') {
        await conn.query('UPDATE siswa SET is_alumni = 1 WHERE id = ?', [s.id]);
        lulus++;
      } else {
        const newTingkat = s.tingkat === 'X' ? 'XI' : 'XII';
        const newKelasNama = s.kelas_nama.replace(/^X(I?) /, newTingkat + ' ');
        // Find new kelas
        const [newKelas] = await conn.query(
          'SELECT id FROM kelas WHERE nama = ? AND tahun_ajaran_id = ?',
          [newKelasNama, to_ta_id]
        );
        if (newKelas.length) {
          await conn.query(
            'INSERT IGNORE INTO siswa (user_id, nis, kelas_id, tahun_ajaran_id, is_ketua_kelas) VALUES (?,?,?,?,0)',
            [s.user_id, s.nis, newKelas[0].id, to_ta_id]
          );
          naik++;
        }
      }
    }

    await conn.commit();
    conn.release();
    await logActivity(req.user.id, 'NAIK_TINGKAT', `Naik tingkat: ${naik} naik, ${lulus} lulus`, req.ip);
    res.json({ success: true, message: `${naik} siswa naik kelas, ${lulus} siswa lulus` });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/semester/:id - edit semester
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nama, semester, start_date, end_date } = req.body;
    await db.query('UPDATE tahun_ajaran SET nama=?, semester=?, start_date=?, end_date=? WHERE id=?',
      [nama, semester, start_date, end_date, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/semester/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const [ta] = await db.query('SELECT is_active FROM tahun_ajaran WHERE id = ?', [req.params.id]);
    if (!ta.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    if (ta[0].is_active) return res.status(400).json({ success: false, message: 'Tidak bisa hapus semester aktif' });
    await db.query('DELETE FROM tahun_ajaran WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
