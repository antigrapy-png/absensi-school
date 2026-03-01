const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole, logActivity } = require('../../middlewares/auth');
const crypto = require('crypto');

// POST /api/qr/generate - guru generate QR sesi
router.post('/generate', auth, requireRole('admin','guru'), async (req, res) => {
  try {
    const { jadwal_id, tanggal, durasi_menit } = req.body;
    if (!jadwal_id || !tanggal) return res.status(400).json({ success: false, message: 'jadwal_id dan tanggal wajib' });

    const [j] = await db.query(
      'SELECT j.*, g.id as guru_id_tbl FROM jadwal_mengajar j JOIN guru g ON j.guru_id = g.id WHERE j.id = ?',
      [jadwal_id]
    );
    if (!j.length) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    // Nonaktifkan QR lama untuk sesi ini
    await db.query('UPDATE qr_sesi SET is_active=0 WHERE jadwal_id=? AND tanggal=?', [jadwal_id, tanggal]);

    const token = crypto.randomBytes(32).toString('hex');
    const durasiMin = parseInt(durasi_menit) || 15;
    const expiredAt = new Date(Date.now() + durasiMin * 60 * 1000);

    await db.query(
      'INSERT INTO qr_sesi (token, jadwal_id, guru_id, kelas_id, tanggal, expired_at) VALUES (?,?,?,?,?,?)',
      [token, jadwal_id, j[0].guru_id_tbl, j[0].kelas_id, tanggal, expiredAt]
    );

    await logActivity(req.user.id, 'QR_GENERATE', `QR sesi jadwal #${jadwal_id} tgl ${tanggal}`, req.ip);
    res.json({ success: true, data: { token, expired_at: expiredAt, durasi_menit: durasiMin, kelas_id: j[0].kelas_id } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/qr/scan - siswa scan QR
router.post('/scan', auth, async (req, res) => {
  try {
    if (req.user.role !== 'siswa') return res.status(403).json({ success: false, message: 'Hanya siswa yang bisa scan QR' });

    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token wajib' });

    // Cari sesi QR
    const [sesi] = await db.query(
      'SELECT * FROM qr_sesi WHERE token=? AND is_active=1 AND expired_at > NOW()',
      [token]
    );
    if (!sesi.length) return res.status(400).json({ success: false, message: 'QR Code tidak valid atau sudah kedaluwarsa' });
    const s = sesi[0];

    // Cari siswa
    const [sw] = await db.query(
      'SELECT si.id, si.kelas_id FROM siswa si JOIN tahun_ajaran ta ON si.tahun_ajaran_id = ta.id WHERE si.user_id = ? ORDER BY si.id DESC LIMIT 1',
      [req.user.id]
    );
    if (!sw.length) return res.status(400).json({ success: false, message: 'Data siswa tidak ditemukan' });

    // Validasi kelas
    if (sw[0].kelas_id !== s.kelas_id) {
      return res.status(403).json({ success: false, message: 'QR Code bukan untuk kelas Anda' });
    }

    // Cek sudah scan
    const [existing] = await db.query('SELECT id FROM qr_scan_log WHERE qr_sesi_id=? AND siswa_id=?', [s.id, sw[0].id]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Anda sudah melakukan absensi di sesi ini' });

    // Tentukan status (terlambat jika > 10 menit dari created_at)
    const selisihMenit = (Date.now() - new Date(s.created_at).getTime()) / 60000;
    const scanStatus = selisihMenit > 10 ? 'terlambat' : 'hadir';

    // Insert scan log
    await db.query('INSERT INTO qr_scan_log (qr_sesi_id, siswa_id, status) VALUES (?,?,?)', [s.id, sw[0].id, scanStatus]);

    // Update absensi mapel
    const [jadwal] = await db.query('SELECT * FROM jadwal_mengajar WHERE id=?', [s.jadwal_id]);
    if (jadwal.length) {
      await db.query(`
        INSERT INTO absensi_mapel (jadwal_id, siswa_id, tanggal, tahun_ajaran_id, status, dicatat_oleh)
        VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [s.jadwal_id, sw[0].id, s.tanggal, jadwal[0].tahun_ajaran_id, scanStatus === 'terlambat' ? 'hadir' : 'hadir', sw[0].id]
      );
    }

    await logActivity(req.user.id, 'QR_SCAN', `Scan QR sesi #${s.id} status: ${scanStatus}`, req.ip);
    res.json({ success: true, message: `Absensi berhasil! Status: ${scanStatus === 'terlambat' ? 'Hadir (Terlambat)' : 'Hadir'}`, data: { status: scanStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/qr/sesi-aktif - cek sesi aktif untuk siswa
router.get('/sesi-aktif', auth, async (req, res) => {
  try {
    if (req.user.role !== 'siswa') return res.json({ success: true, data: [] });
    const [sw] = await db.query('SELECT kelas_id FROM siswa WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
    if (!sw.length) return res.json({ success: true, data: [] });

    const [rows] = await db.query(`
      SELECT qs.*, m.nama as mapel_nama, g.user_id as guru_user_id, u.nama as guru_nama
      FROM qr_sesi qs
      JOIN jadwal_mengajar j ON qs.jadwal_id = j.id
      JOIN mapel m ON j.mapel_id = m.id
      JOIN guru g ON qs.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE qs.kelas_id=? AND qs.is_active=1 AND qs.expired_at > NOW()
      ORDER BY qs.created_at DESC`, [sw[0].kelas_id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/qr/scan-list/:sesi_id - list scan untuk guru
router.get('/scan-list/:sesi_id', auth, requireRole('admin','guru'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT qsl.*, u.nama as siswa_nama, s.nis
      FROM qr_scan_log qsl
      JOIN siswa s ON qsl.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE qsl.qr_sesi_id = ?
      ORDER BY qsl.scanned_at ASC`, [req.params.sesi_id]);

    const [sesi] = await db.query('SELECT * FROM qr_sesi WHERE id=?', [req.params.sesi_id]);
    const [allSiswa] = await db.query(
      'SELECT s.id, u.nama, s.nis FROM siswa s JOIN users u ON s.user_id=u.id WHERE s.kelas_id=? AND s.is_active=1',
      [sesi[0]?.kelas_id]
    );

    const scannedIds = new Set(rows.map(r => r.siswa_id));
    const belumScan = allSiswa.filter(s => !scannedIds.has(s.id));

    res.json({ success: true, data: { scanned: rows, belumScan, sesi: sesi[0] } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/qr/:id/nonaktifkan
router.delete('/:id/nonaktifkan', auth, requireRole('admin','guru'), async (req, res) => {
  try {
    await db.query('UPDATE qr_sesi SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'QR sesi dinonaktifkan' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
