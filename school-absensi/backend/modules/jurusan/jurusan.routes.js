const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, requireRole } = require('../../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM jurusan ORDER BY kode');
  res.json({ success: true, data: rows });
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { kode, nama } = req.body;
    const [result] = await db.query('INSERT INTO jurusan (kode, nama) VALUES (?,?)', [kode, nama]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { kode, nama } = req.body;
    await db.query('UPDATE jurusan SET kode=?, nama=? WHERE id=?', [kode, nama, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM jurusan WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
