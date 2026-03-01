const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM mapel ORDER BY nama');
  res.json({ success: true, data: rows });
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { kode, nama } = req.body;
    const [result] = await db.query('INSERT INTO mapel (kode, nama) VALUES (?,?)', [kode, nama]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { kode, nama } = req.body;
    await db.query('UPDATE mapel SET kode=?, nama=? WHERE id=?', [kode, nama, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM mapel WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
