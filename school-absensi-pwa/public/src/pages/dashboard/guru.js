// =============================================
// Dashboard Guru
// =============================================
async function renderDashboardGuru() {
  setPageTitle('Dashboard Guru');
  setContent(`<div class="p-page page"><div style="display:flex;justify-content:center;padding:40px 0"><div class="loading-spinner" style="width:32px;height:32px"></div></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const dashRes = await api.dashboard(taId);
    const d = dashRes.data;
    const user = store.get('user');
    const today = new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="hero-card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div class="hero-avatar" style="background:rgba(255,255,255,0.2)">${user?.nama?.charAt(0)||'G'}</div>
            <div>
              <div class="hero-name">Halo, ${user?.nama?.split(' ')[0]||'Guru'}!</div>
              <div class="hero-sub">Guru · ${today}</div>
            </div>
          </div>
          ${d.isWalas ? `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.15);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:white"><i class="fas fa-crown" style="color:#fbbf24"></i> Wali Kelas ${d.kelasNama||''}</div>` : ''}
        </div>

        ${d.isWalas ? `
        <div class="grid-2">
          ${[['fa-users','Total Siswa',d.totalSiswa||0,'stat-purple'],['fa-check-circle','Hadir',d.hadirHariIni||0,'stat-green'],['fa-times-circle','Alpha',d.alphaHariIni||0,'stat-red'],['fa-clock','Belum Absen',d.belumAbsen||0,'stat-yellow']].map(([icon,label,val,cls])=>`
          <div class="stat-card ${cls}">
            <div class="stat-icon" style="background:rgba(255,255,255,0.1)"><i class="fas ${icon}"></i></div>
            <div class="stat-val">${val}</div>
            <div class="stat-label">${label}</div>
          </div>`).join('')}
        </div>` : ''}

        <div class="card">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">📅 Jadwal Hari Ini</div>
            <button onclick="navigateTo('jadwal')" class="btn btn-ghost btn-sm" style="font-size:11px">Semua →</button>
          </div>
          <div class="divide-y">
            ${(d.jadwal||[]).length ? d.jadwal.slice(0,5).map(j=>`
            <div class="list-item" onclick="navigateTo('absensi-mapel')">
              <div style="width:44px;height:44px;border-radius:13px;background:rgba(139,92,246,0.15);color:var(--p400);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;text-align:center;line-height:1.2">${(j.jam_mulai||'').slice(0,5)}</div>
              <div class="list-content">
                <div class="list-title">${j.mapel_nama||j.mapel||'—'}</div>
                <div class="list-sub">${j.kelas_nama||j.kelas||'—'} · ${j.hari||'—'}</div>
              </div>
              <span class="badge-tag badge-purple" style="font-size:10px">${j.tipe_sesi||'teori'}</span>
            </div>`).join('') : `<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><div class="empty-sub">Tidak ada jadwal hari ini</div></div>`}
          </div>
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="navigateTo('absensi')" class="btn btn-primary btn-full"><i class="fas fa-clipboard-check"></i> Input Absensi</button>
          <button onclick="navigateTo('izin')" class="btn btn-secondary btn-full"><i class="fas fa-file-medical-alt"></i> Lihat Izin</button>
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}
