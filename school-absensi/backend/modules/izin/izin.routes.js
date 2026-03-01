const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole, logActivity } = require('../../middlewares/auth');

// GET /api/izin - daftar pengajuan izin
router.get('/', auth, async (req, res) => {
  try {
    const { status, kelas_id, tahun_ajaran_id, siswa_id } = req.query;
    let where = [], params = [];

    if (req.user.role === 'siswa') {
      // Siswa hanya lihat punya sendiri
      const [s] = await db.query('SELECT id FROM siswa WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
      if (!s.length) return res.json({ success: true, data: [] });
      where.push('pi.siswa_id = ?'); params.push(s[0].id);
    } else if (req.user.role === 'guru') {
      // Guru walas hanya lihat kelasnya
      const [g] = await db.query('SELECT kelas_id, is_walas FROM guru WHERE user_id = ?', [req.user.id]);
      if (g.length && g[0].is_walas && g[0].kelas_id) {
        where.push('pi.kelas_id = ?'); params.push(g[0].kelas_id);
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    if (status)           { where.push('pi.status = ?');           params.push(status); }
    if (kelas_id)         { where.push('pi.kelas_id = ?');         params.push(kelas_id); }
    if (tahun_ajaran_id)  { where.push('pi.tahun_ajaran_id = ?');  params.push(tahun_ajaran_id); }
    if (siswa_id)         { where.push('pi.siswa_id = ?');         params.push(siswa_id); }

    const [rows] = await db.query(`
      SELECT pi.*, u.nama as siswa_nama, s.nis, k.nama as kelas_nama,
             ta.nama as ta_nama, ur.nama as reviewer_nama
      FROM pengajuan_izin pi
      JOIN siswa s ON pi.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON pi.kelas_id = k.id
      JOIN tahun_ajaran ta ON pi.tahun_ajaran_id = ta.id
      LEFT JOIN users ur ON pi.reviewed_by = ur.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY pi.created_at DESC`, params);

    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/izin - ajukan izin/sakit
router.post('/', auth, async (req, res) => {
  try {
    const { jenis, tanggal_mulai, tanggal_selesai, alasan, kelas_id, tahun_ajaran_id } = req.body;
    if (!jenis || !tanggal_mulai || !tanggal_selesai || !alasan) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    let siswaId;
    if (req.user.role === 'siswa') {
      const [s] = await db.query('SELECT id, kelas_id, tahun_ajaran_id FROM siswa WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
      if (!s.length) return res.status(400).json({ success: false, message: 'Data siswa tidak ditemukan' });
      siswaId = s[0].id;
    } else if (req.user.role === 'admin' || req.user.role === 'guru') {
      siswaId = req.body.siswa_id;
    }

    // Hitung jumlah hari
    const start = new Date(tanggal_mulai), end = new Date(tanggal_selesai);
    const days = Math.ceil((end - start) / 86400000) + 1;
    if (days < 1) return res.status(400).json({ success: false, message: 'Tanggal tidak valid' });

    // Cek siswa info jika tidak ada
    let finalKelasId = kelas_id, finalTaId = tahun_ajaran_id;
    if (!finalKelasId || !finalTaId) {
      const [s] = await db.query('SELECT kelas_id, tahun_ajaran_id FROM siswa WHERE id = ?', [siswaId]);
      if (s.length) { finalKelasId = s[0].kelas_id; finalTaId = s[0].tahun_ajaran_id; }
    }

    const [result] = await db.query(
      'INSERT INTO pengajuan_izin (siswa_id, kelas_id, tahun_ajaran_id, jenis, tanggal_mulai, tanggal_selesai, alasan) VALUES (?,?,?,?,?,?,?)',
      [siswaId, finalKelasId, finalTaId, jenis, tanggal_mulai, tanggal_selesai, alasan]
    );

    await logActivity(req.user.id, 'IZIN_AJUKAN', `Pengajuan ${jenis} ${days} hari (${tanggal_mulai} s/d ${tanggal_selesai})`, req.ip);
    res.json({ success: true, data: { id: result.insertId }, message: 'Pengajuan berhasil dikirim' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/izin/:id/review - approve/reject oleh guru/admin
router.put('/:id/review', auth, requireRole('admin', 'guru'), async (req, res) => {
  try {
    const { status, catatan_reviewer } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const [izin] = await db.query('SELECT * FROM pengajuan_izin WHERE id = ?', [req.params.id]);
    if (!izin.length) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    const iz = izin[0];

    await db.query(
      'UPDATE pengajuan_izin SET status=?, reviewed_by=?, reviewed_at=NOW(), catatan_reviewer=? WHERE id=?',
      [status, req.user.id, catatan_reviewer || null, req.params.id]
    );

    // Jika approved, update absensi harian otomatis
    if (status === 'approved') {
      const start = new Date(iz.tanggal_mulai);
      const end   = new Date(iz.tanggal_selesai);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const tgl = d.toISOString().slice(0, 10);
        await db.query(`
          INSERT INTO absensi_harian (siswa_id, kelas_id, tahun_ajaran_id, tanggal, status, keterangan, dicatat_oleh)
          VALUES (?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan)`,
          [iz.siswa_id, iz.kelas_id, iz.tahun_ajaran_id, tgl, iz.jenis, `Auto: ${iz.jenis} disetujui`, req.user.id]
        );
      }
    }

    await logActivity(req.user.id, 'IZIN_REVIEW', `${status.toUpperCase()} pengajuan izin #${req.params.id}`, req.ip);
    res.json({ success: true, message: `Pengajuan ${status === 'approved' ? 'disetujui' : 'ditolak'}${status === 'approved' ? ' dan absensi diupdate otomatis' : ''}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/izin/count-pending - jumlah pending untuk badge notif
router.get('/count-pending', auth, async (req, res) => {
  try {
    let where = "status = 'pending'", params = [];
    if (req.user.role === 'guru') {
      const [g] = await db.query('SELECT kelas_id FROM guru WHERE user_id = ?', [req.user.id]);
      if (g.length && g[0].kelas_id) { where += ' AND kelas_id = ?'; params.push(g[0].kelas_id); }
    }
    const [r] = await db.query(`SELECT COUNT(*) as count FROM pengajuan_izin WHERE ${where}`, params);
    res.json({ success: true, count: r[0].count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
