const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole, logActivity } = require('../../middlewares/auth');

// GET /api/kalender
router.get('/', auth, async (req, res) => {
  try {
    const { tahun_ajaran_id, bulan } = req.query;
    let where = [], params = [];
    if (tahun_ajaran_id) { where.push('tahun_ajaran_id=?'); params.push(tahun_ajaran_id); }
    if (bulan) { where.push("DATE_FORMAT(tanggal,'%Y-%m')=?"); params.push(bulan); }
    const [rows] = await db.query(
      `SELECT * FROM kalender_akademik ${where.length?'WHERE '+where.join(' AND '):''}  ORDER BY tanggal ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/kalender
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nama, tanggal, jenis, tahun_ajaran_id } = req.body;
    if (!nama || !tanggal || !tahun_ajaran_id) return res.status(400).json({ success:false, message:'nama, tanggal, tahun_ajaran_id wajib' });
    const [r] = await db.query(
      'INSERT INTO kalender_akademik (nama,tanggal,jenis,tahun_ajaran_id) VALUES (?,?,?,?)',
      [nama, tanggal, jenis||'libur', tahun_ajaran_id]
    );
    await logActivity(req.user.id, 'KALENDER_ADD', `${jenis||'libur'}: ${nama} (${tanggal})`, req.ip);
    res.json({ success:true, data:{ id: r.insertId }, message:'Tanggal ditambahkan' });
  } catch(err) { res.status(500).json({ success:false, message: err.message }); }
});

// DELETE /api/kalender/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM kalender_akademik WHERE id=?', [req.params.id]);
    await logActivity(req.user.id, 'KALENDER_DELETE', `Hapus kalender #${req.params.id}`, req.ip);
    res.json({ success:true, message:'Dihapus' });
  } catch(err) { res.status(500).json({ success:false, message: err.message }); }
});

// GET /api/kalender/libur-check - cek apakah tanggal libur
router.get('/libur-check', auth, async (req, res) => {
  try {
    const { tanggal, tahun_ajaran_id } = req.query;
    const [rows] = await db.query(
      "SELECT * FROM kalender_akademik WHERE tanggal=? AND tahun_ajaran_id=? AND jenis='libur'",
      [tanggal, tahun_ajaran_id]
    );
    res.json({ success:true, isLibur: rows.length > 0, data: rows[0] || null });
  } catch(err) { res.status(500).json({ success:false, message: err.message }); }
});

module.exports = router;
