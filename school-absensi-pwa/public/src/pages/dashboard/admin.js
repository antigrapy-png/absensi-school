// =============================================
// Dashboard Admin
// =============================================
async function renderDashboardAdmin() {
  setPageTitle('Dashboard Admin');
  setContent(`<div class="p-page page"><div style="display:flex;justify-content:center;padding:40px 0"><div class="loading-spinner" style="width:32px;height:32px"></div></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const [dashRes, trenRes] = await Promise.all([
      api.dashboard(taId),
      api.trenKehadiran('tahun_ajaran_id=' + taId)
    ]);
    const d = dashRes.data;
    const tren = trenRes.data;
    const pct = tren.summary?.total ? Math.round(tren.summary.hadir / tren.summary.total * 100) : 0;
    const user = store.get('user');

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="hero-card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div class="hero-avatar">${user?.nama?.charAt(0)||'A'}</div>
            <div>
              <div class="hero-name">Halo, ${user?.nama?.split(' ')[0] || 'Admin'}! 👋</div>
              <div class="hero-sub">Administrator Sistem</div>
            </div>
          </div>
          <div class="grid-2" style="gap:8px">
            <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:10px 14px">
              <div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.05em">Kehadiran</div>
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;color:white">${pct}%</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:10px 14px">
              <div style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.05em">Hari Ini</div>
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;color:white">${d.absensiSummary?.hadir||0}</div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          ${[
            ['fa-user-graduate','Siswa Aktif', d.jumlahSiswa||0, 'stat-blue'],
            ['fa-chalkboard-teacher','Guru', d.jumlahGuru||0, 'stat-green'],
            ['fa-door-open','Kelas', d.jumlahKelas||0, 'stat-purple'],
            ['fa-exclamation-triangle','Alpha Hari Ini', d.absensiSummary?.alpha||0, 'stat-red'],
          ].map(([icon,label,val,cls]) => `
            <div class="stat-card ${cls}">
              <div class="stat-icon" style="background:rgba(255,255,255,0.1)"><i class="fas ${icon}"></i></div>
              <div class="stat-val">${val}</div>
              <div class="stat-label">${label}</div>
            </div>`).join('')}
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">📊 Absensi Hari Ini</div></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr)">
            ${[['Hadir',d.absensiSummary?.hadir||0,'var(--green)'],['Sakit',d.absensiSummary?.sakit||0,'var(--blue)'],['Izin',d.absensiSummary?.izin||0,'var(--yellow)'],['Alpha',d.absensiSummary?.alpha||0,'var(--red)']].map(([l,v,c],i)=>`
            <div style="padding:14px 8px;text-align:center;${i<3?'border-right:1px solid var(--border)':''}">
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;color:${c}">${v}</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${l}</div>
            </div>`).join('')}
          </div>
        </div>

        ${tren.byBulan?.length ? `
        <div class="card">
          <div class="card-header"><div class="card-title">📈 Tren Bulanan</div></div>
          <div class="card-body"><canvas id="chart-admin-tren" height="160"></canvas></div>
        </div>` : ''}

        <div>
          <div class="section-header"><div class="section-title">Aksi Cepat</div></div>
          <div class="grid-2">
            ${[['fa-clipboard-check','Input Absensi','absensi','var(--p700)'],['fa-file-import','Import Siswa','import','var(--green)'],['fa-bell','Alert','alert','var(--red)'],['fa-calendar-alt','Kalender','kalender','var(--blue)']].map(([icon,label,page,color])=>`
            <button onclick="navigateTo('${page}')" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 0.15s">
              <div style="width:36px;height:36px;border-radius:12px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas ${icon}"></i></div>
              <span style="font-size:13px;font-weight:600;color:var(--text)">${label}</span>
            </button>`).join('')}
          </div>
        </div>
      </div>`);

    requestAnimationFrame(() => {
      const el = document.getElementById('chart-admin-tren');
      if (el && tren.byBulan?.length) {
        const tc = '#8b7aaa', gc = 'rgba(139,92,246,0.08)';
        new Chart(el, {
          type: 'line',
          data: { labels: tren.byBulan.map(b=>b.label), datasets: [
            {label:'Hadir',data:tren.byBulan.map(b=>b.hadir),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',tension:0.4,fill:true,pointRadius:3},
            {label:'Alpha',data:tren.byBulan.map(b=>b.alpha),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',tension:0.4,fill:true,pointRadius:3},
          ]},
          options:{responsive:true,plugins:{legend:{labels:{color:tc,font:{size:10}}}},scales:{x:{ticks:{color:tc,font:{size:9}},grid:{color:gc}},y:{ticks:{color:tc,font:{size:9}},grid:{color:gc}}}}
        });
      }
    });
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Gagal memuat</div><div class="empty-sub">${err.message}</div></div>`); }
}
