// =============================================
// AbsensiKu PWA — API Service
// =============================================
const API_BASE = window.API_BASE || 'http://localhost:3000/api';

const api = {
  getToken: () => localStorage.getItem('pwa_token'),

  async fetch(path, opts = {}) {
    const token = api.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {})
    };
    try {
      const res = await fetch(API_BASE + path, { ...opts, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request gagal (' + res.status + ')');
      return data;
    } catch (err) {
      if (!navigator.onLine) throw new Error('Tidak ada koneksi internet');
      throw err;
    }
  },

  get:    (p)    => api.fetch(p),
  post:   (p, b) => api.fetch(p, { method: 'POST',   body: JSON.stringify(b) }),
  put:    (p, b) => api.fetch(p, { method: 'PUT',    body: JSON.stringify(b) }),
  patch:  (p, b) => api.fetch(p, { method: 'PATCH',  body: JSON.stringify(b) }),
  delete: (p)    => api.fetch(p, { method: 'DELETE' }),

  // Auth
  login:    (body) => api.post('/auth/login', body),
  me:       ()     => api.get('/auth/me'),
  logout:   ()     => { localStorage.removeItem('pwa_token'); localStorage.removeItem('pwa_user'); },

  // Semester
  semesters:  ()   => api.get('/semester'),
  semesterActivate: (id) => api.put('/semester/' + id + '/activate', {}),

  // Kelas
  kelas:      (taId) => api.get('/kelas?tahun_ajaran_id=' + taId),
  kelasDetail:(id)   => api.get('/kelas/' + id),
  kelasSiswa: (id, taId) => api.get('/kelas/' + id + '/siswa?tahun_ajaran_id=' + taId),

  // Siswa
  siswa:      (taId, params) => api.get('/siswa?tahun_ajaran_id=' + taId + (params || '')),
  siswaDetail:(id)   => api.get('/siswa/' + id),
  siswaAdd:   (body) => api.post('/siswa', body),
  siswaBulk:  (body) => api.post('/siswa/bulk', body),
  siswaBulkAction: (body) => api.post('/siswa/bulk-action', body),

  // Guru
  guru:       ()     => api.get('/guru'),
  guruDetail: (id)   => api.get('/guru/' + id),

  // Jadwal
  jadwal:     (taId, extra) => api.get('/jadwal?tahun_ajaran_id=' + taId + (extra || '')),
  jadwalMingguInfo: (tgl)   => api.get('/jadwal/minggu-info?tanggal=' + tgl),

  // Absensi Harian
  absensiHarianGet: (kelasId, tgl, taId) =>
    api.get('/absensi/harian?kelas_id=' + kelasId + '&tanggal=' + tgl + '&tahun_ajaran_id=' + taId),
  absensiHarianBulk: (body) => api.post('/absensi/harian/bulk', body),
  absensiHarianRekap: (params) => api.get('/absensi/harian/rekap?' + params),
  absensiSiswa: (siswaId, taId) => api.get('/absensi/siswa/' + siswaId + '?tahun_ajaran_id=' + taId),

  // Absensi Mapel
  absensiMapelGet:  (jadwalId, tgl, taId) =>
    api.get('/absensi/mapel?jadwal_id=' + jadwalId + '&tanggal=' + tgl + '&tahun_ajaran_id=' + taId),
  absensiMapelBulk: (body) => api.post('/absensi/mapel/bulk', body),

  // Rekap / Dashboard
  dashboard: (taId) => api.get('/rekap/dashboard?tahun_ajaran_id=' + taId),

  // Alert
  alerts:       (taId) => api.get('/alert?tahun_ajaran_id=' + taId + '&is_read=0'),
  alertCount:   ()     => api.get('/alert/count-unread'),
  alertCheck:   (body) => api.post('/alert/check', body),
  alertRead:    (id)   => api.fetch('/alert/' + id + '/read', { method: 'PUT', body: '{}' }),
  alertReadAll: (body) => api.fetch('/alert/read-all', { method: 'PUT', body: JSON.stringify(body) }),
  siswaBerisiko:(params) => api.get('/alert/siswa-berisiko?' + params),

  // Izin
  izin:         (taId) => api.get('/izin?tahun_ajaran_id=' + taId),
  izinCount:    ()     => api.get('/izin/count-pending'),
  izinAdd:      (body) => api.post('/izin', body),
  izinReview:   (id, body) => api.put('/izin/' + id + '/review', body),

  // QR
  qrGenerate:   (body) => api.post('/qr/generate', body),
  qrScan:       (body) => api.post('/qr/scan', body),
  qrSesiAktif:  ()     => api.get('/qr/sesi-aktif'),

  // Tren
  trenKehadiran:    (params) => api.get('/tren/kehadiran?' + params),
  trenPerbandingan: (taId)   => api.get('/tren/perbandingan-jurusan?tahun_ajaran_id=' + taId),

  // Kalender Akademik
  kalender:      (taId) => api.get('/kalender?tahun_ajaran_id=' + taId),
  kalenderAdd:   (body) => api.post('/kalender', body),
  kalenderDelete:(id)   => api.delete('/kalender/' + id),

  // Logs
  logs: (params) => api.get('/logs?' + (params || '')),

  // Export
  exportExcel: (params) => {
    const token = api.getToken();
    const url = API_BASE + '/export/excel?' + params + '&token=' + token;
    window.open(url, '_blank');
  }
};
