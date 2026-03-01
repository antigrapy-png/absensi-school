const express = require("express");
const router = express.Router();
const db = require("../../config/database");
const { auth, requireRole, logActivity } = require("../../middlewares/auth");

// POST /api/alert/check - jalankan pengecekan alert (admin/guru)
router.post("/check", auth, requireRole("admin", "guru"), async (req, res) => {
  try {
    const { tahun_ajaran_id, kelas_id } = req.body;
    let kelasWhere = "",
      params = [tahun_ajaran_id];
    if (kelas_id) {
      kelasWhere = "AND k.id = ?";
      params.push(kelas_id);
    }

    // 1. Alert alpha beruntun (3+ hari)
    const [siswas] = await db.query(
      `
      SELECT s.id as siswa_id, u.nama as siswa_nama, k.id as kelas_id, k.nama as kelas_nama, k.batas_kehadiran
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      WHERE s.tahun_ajaran_id = ? AND u.is_active = 1 ${kelasWhere}`,
      params,
    );

    let alertsCreated = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const siswa of siswas) {
      // Cek alpha beruntun - ambil 10 hari terakhir
      const [recent] = await db.query(
        `
        SELECT tanggal, status FROM absensi_harian
        WHERE siswa_id=? AND tahun_ajaran_id=? AND tanggal <= ?
        ORDER BY tanggal DESC LIMIT 10`,
        [siswa.siswa_id, tahun_ajaran_id, today],
      );

      let beruntun = 0;
      for (const r of recent) {
        if (r.status === "alpha") beruntun++;
        else break;
      }

      if (beruntun >= 3) {
        // Cek apakah alert sudah ada hari ini
        const [existing] = await db.query(
          `
          SELECT id FROM alert_siswa WHERE siswa_id=? AND jenis='alpha_beruntun'
          AND DATE(created_at) = CURDATE()`,
          [siswa.siswa_id],
        );
        if (!existing.length) {
          await db.query(
            `
            INSERT INTO alert_siswa (siswa_id, kelas_id, tahun_ajaran_id, jenis, detail)
            VALUES (?,?,?,'alpha_beruntun',?)`,
            [
              siswa.siswa_id,
              siswa.kelas_id,
              tahun_ajaran_id,
              `${siswa.siswa_nama} alpha ${beruntun} hari beruntun`,
            ],
          );
          alertsCreated++;
        }
      }

      // 2. Cek batas kehadiran minimum
      const [stat] = await db.query(
        `
        SELECT COUNT(*) as total,
               SUM(status='hadir') as hadir
        FROM absensi_harian WHERE siswa_id=? AND tahun_ajaran_id=?`,
        [siswa.siswa_id, tahun_ajaran_id],
      );

      if (stat[0].total >= 10) {
        const pct = Math.round((stat[0].hadir / stat[0].total) * 100);
        const batas = siswa.batas_kehadiran || 75;
        if (pct < batas) {
          const [ex2] = await db.query(
            `
            SELECT id FROM alert_siswa WHERE siswa_id=? AND jenis='batas_kehadiran'
            AND DATE(created_at) = CURDATE()`,
            [siswa.siswa_id],
          );
          if (!ex2.length) {
            await db.query(
              `
              INSERT INTO alert_siswa (siswa_id, kelas_id, tahun_ajaran_id, jenis, detail)
              VALUES (?,?,?,'batas_kehadiran',?)`,
              [
                siswa.siswa_id,
                siswa.kelas_id,
                tahun_ajaran_id,
                `Kehadiran ${pct}% di bawah batas ${batas}% (${stat[0].hadir}/${stat[0].total} hari)`,
              ],
            );
            alertsCreated++;
          }
        }
      }
    }

    await logActivity(
      req.user.id,
      "ALERT_CHECK",
      `Pengecekan alert: ${alertsCreated} alert baru`,
      req.ip,
    );
    res.json({
      success: true,
      message: `Pengecekan selesai. ${alertsCreated} alert baru dibuat.`,
      data: { alertsCreated },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/alert - daftar alert
router.get("/", auth, async (req, res) => {
  try {
    const { tahun_ajaran_id, kelas_id, is_read, jenis } = req.query;
    let where = [],
      params = [];

    if (req.user.role === "guru") {
      const [g] = await db.query("SELECT kelas_id FROM guru WHERE user_id=?", [
        req.user.id,
      ]);
      if (g.length && g[0].kelas_id) {
        where.push("a.kelas_id=?");
        params.push(g[0].kelas_id);
      } else return res.json({ success: true, data: [] });
    }
    if (tahun_ajaran_id) {
      where.push("a.tahun_ajaran_id=?");
      params.push(tahun_ajaran_id);
    }
    if (kelas_id) {
      where.push("a.kelas_id=?");
      params.push(kelas_id);
    }
    if (is_read !== undefined) {
      where.push("a.is_read=?");
      params.push(is_read);
    }
    if (jenis) {
      where.push("a.jenis=?");
      params.push(jenis);
    }

    const [rows] = await db.query(
      `
      SELECT a.*, u.nama as siswa_nama, s.nis, k.nama as kelas_nama
      FROM alert_siswa a
      JOIN siswa s ON a.siswa_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON a.kelas_id = k.id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY a.created_at DESC LIMIT 200`,
      params,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/alert/siswa-berisiko - daftar siswa di bawah batas kehadiran
router.get(
  "/siswa-berisiko",
  auth,
  requireRole("admin", "guru"),
  async (req, res) => {
    try {
      const { tahun_ajaran_id, kelas_id } = req.query;
      let where = ["s.is_active=1"],
        params = [];
      if (tahun_ajaran_id) {
        where.push("s.tahun_ajaran_id=?");
        params.push(tahun_ajaran_id);
      }
      if (kelas_id) {
        where.push("s.kelas_id=?");
        params.push(kelas_id);
      }

      const [rows] = await db.query(
        `
      SELECT u.nama, s.nis, k.nama as kelas_nama, k.batas_kehadiran,
             COUNT(ah.id) as total,
             SUM(ah.status='hadir') as hadir,
             SUM(ah.status='alpha') as alpha,
             SUM(ah.status='sakit') as sakit,
             SUM(ah.status='izin') as izin,
             ROUND(SUM(ah.status='hadir') / NULLIF(COUNT(ah.id),0) * 100) as pct_hadir,
             s.id as siswa_id
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN absensi_harian ah ON ah.siswa_id=s.id AND ah.tahun_ajaran_id=s.tahun_ajaran_id
      WHERE ${where.join(" AND ")}
      GROUP BY s.id
      HAVING total >= 5
      ORDER BY pct_hadir ASC`,
        params,
      );

      const berisiko = rows.filter(
        (r) => r.pct_hadir < (r.batas_kehadiran || 75),
      );
      res.json({ success: true, data: rows, berisiko });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// PUT /api/alert/:id/read - tandai sudah dibaca
router.put("/:id/read", auth, async (req, res) => {
  try {
    await db.query(
      "UPDATE alert_siswa SET is_read=1, dibaca_oleh=? WHERE id=?",
      [req.user.id, req.params.id],
    );
    res.json({ success: true, message: "Alert ditandai dibaca" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/alert/read-all - tandai semua dibaca
router.put("/read-all", auth, async (req, res) => {
  try {
    const { kelas_id, tahun_ajaran_id } = req.body;
    let where = ["is_read=0"],
      params = [];
    if (kelas_id) {
      where.push("kelas_id=?");
      params.push(kelas_id);
    }
    if (tahun_ajaran_id) {
      where.push("tahun_ajaran_id=?");
      params.push(tahun_ajaran_id);
    }
    await db.query(
      `UPDATE alert_siswa SET is_read=1, dibaca_oleh=? WHERE ${where.join(" AND ")}`,
      [req.user.id, ...params],
    );
    res.json({ success: true, message: "Semua alert ditandai dibaca" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/alert/count-unread
router.get("/count-unread", auth, async (req, res) => {
  try {
    let where = ["a.is_read=0"],
      params = [];
    if (req.user.role === "guru") {
      const [g] = await db.query("SELECT kelas_id FROM guru WHERE user_id=?", [
        req.user.id,
      ]);
      if (g.length && g[0].kelas_id) {
        where.push("a.kelas_id=?");
        params.push(g[0].kelas_id);
      }
    }
    const [r] = await db.query(
      `SELECT COUNT(*) as count FROM alert_siswa a WHERE ${where.join(" AND ")}`,
      params,
    );
    res.json({ success: true, count: r[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
