const express = require('express');
const router = express.Router();
const { auth, requireRole, logActivity } = require('./middlewares/auth');
const { generateAbsensiExcel } = require('./utils/excelGenerator');
const db = require('./config/database');

router.use('/auth',     require('./modules/auth/auth.routes'));
router.use('/semester', require('./modules/semester/semester.routes'));
router.use('/jurusan',  require('./modules/jurusan/jurusan.routes'));
router.use('/kelas',    require('./modules/kelas/kelas.routes'));
router.use('/guru',     require('./modules/guru/guru.routes'));
router.use('/siswa',    require('./modules/siswa/siswa.routes'));
router.use('/mapel',    require('./modules/mapel/mapel.routes'));
router.use('/jadwal',   require('./modules/jadwal/jadwal.routes'));
router.use('/absensi',  require('./modules/absensi/absensi.routes'));
router.use('/rekap',    require('./modules/rekap/rekap.routes'));
router.use('/izin',     require('./modules/izin/izin.routes'));
router.use('/qr',       require('./modules/qr/qr.routes'));
router.use('/alert',    require('./modules/alert/alert.routes'));
router.use('/kalender', require('./modules/kalender/kalender.routes'));
router.use('/tren',     require('./modules/tren/tren.routes'));

// GET /api/export/excel
router.get('/export/excel', auth, async (req, res) => {
  try {
    const wb = await generateAbsensiExcel(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=absensi_export.xlsx');
    await wb.writeToBuffer().then(buf => res.end(buf));
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/logs - audit trail lengkap
router.get('/logs', auth, requireRole('admin'), async (req, res) => {
  try {
    const { action, user_id, tanggal, limit } = req.query;
    let where = [], params = [];
    if (action)   { where.push('al.action LIKE ?');            params.push('%' + action + '%'); }
    if (user_id)  { where.push('al.user_id = ?');             params.push(user_id); }
    if (tanggal)  { where.push('DATE(al.created_at) = ?');    params.push(tanggal); }
    const lim = Math.min(parseInt(limit) || 300, 500);
    const [rows] = await db.query(`
      SELECT al.*, u.nama, u.role, u.email FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY al.created_at DESC LIMIT ?`, [...params, lim]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/kelas/:id/batas-kehadiran - set batas minimum per kelas
router.put('/kelas/:id/batas-kehadiran', auth, requireRole('admin'), async (req, res) => {
  try {
    const { batas } = req.body;
    if (!batas || batas < 1 || batas > 100) return res.status(400).json({ success: false, message: 'Batas harus 1-100' });
    await db.query('UPDATE kelas SET batas_kehadiran=? WHERE id=?', [batas, req.params.id]);
    await logActivity(req.user.id, 'BATAS_KEHADIRAN_SET', `Kelas #${req.params.id} batas kehadiran ${batas}%`, req.ip);
    res.json({ success: true, message: `Batas kehadiran diset ke ${batas}%` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
