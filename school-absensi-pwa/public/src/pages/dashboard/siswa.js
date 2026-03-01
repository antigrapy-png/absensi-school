// =============================================
// Dashboard Siswa
// =============================================
async function renderDashboardSiswa() {
  setPageTitle('Dashboard');
  setContent(`<div class="p-page page"><div style="display:flex;justify-content:center;padding:40px 0"><div class="loading-spinner" style="width:32px;height:32px"></div></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const dashRes = await api.dashboard(taId);
    const d = dashRes.data;
    const user = store.get('user');
    const pct = d.persenHadir || 0;
    const batas = d.batasKehadiran || 75;
    const barColor = pct >= batas ? 'var(--green)' : pct >= batas - 10 ? 'var(--yellow)' : 'var(--red)';

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="hero-card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div class="hero-avatar">${user?.nama?.charAt(0)||'S'}</div>
            <div style="flex:1">
              <div class="hero-name">${user?.nama}</div>
              <div class="hero-sub">${d.kelasNama||'—'} · NIS: ${user?.nis||'—'}</div>
            </div>
            ${d.isKetuaKelas ? `<span style="background:rgba(251,191,36,0.25);color:#fbbf24;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap"><i class="fas fa-crown"></i> Ketua</span>` : ''}
          </div>
          <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:12px 16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:11px;color:rgba(255,255,255,0.6)">Kehadiran Semester</span>
              <span style="font-size:11px;font-weight:700;color:white">${pct}% / min ${batas}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
            </div>
          </div>
        </div>

        <div class="grid-4" style="gap:8px">
          ${[['Hadir',d.jumlahHadir||0,'var(--green)'],['Sakit',d.jumlahSakit||0,'var(--blue)'],['Izin',d.jumlahIzin||0,'var(--yellow)'],['Alpha',d.jumlahAlpha||0,'var(--red)']].map(([l,v,c])=>`
          <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px 8px;text-align:center">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;color:${c}">${v}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${l}</div>
          </div>`).join('')}
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">📅 Riwayat Terbaru</div></div>
          <div class="divide-y">
            ${(d.riwayat||[]).slice(0,5).map(r=>{
              const statusMap={hadir:['badge-green','✓'],sakit:['badge-blue','S'],izin:['badge-yellow','I'],alpha:['badge-red','A']};
              const [sc,ic]=statusMap[r.status]||['badge-gray','?'];
              return `<div class="list-item">
                <div style="width:38px;height:38px;border-radius:12px;background:var(--surface-3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:var(--text-2)">
                  ${new Date(r.tanggal).getDate()}
                </div>
                <div class="list-content">
                  <div class="list-title">${new Date(r.tanggal).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'short'})}</div>
                  <div class="list-sub">${r.keterangan||'—'}</div>
                </div>
                <span class="badge-tag ${sc}">${r.status}</span>
              </div>`;
            }).join('') || `<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><div class="empty-sub">Belum ada data absensi</div></div>`}
          </div>
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="navigateTo('qr')" class="btn btn-primary btn-full"><i class="fas fa-qrcode"></i> Scan QR</button>
          <button onclick="navigateTo('izin')" class="btn btn-secondary btn-full"><i class="fas fa-file-medical-alt"></i> Ajukan Izin</button>
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}
