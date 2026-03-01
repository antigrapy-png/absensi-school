// =============================================
// Dashboard Kepala Sekolah
// =============================================
async function renderDashboardKepsek() {
  setPageTitle('Dashboard Kepsek');
  setContent(`<div class="p-page page"><div style="display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;justify-content:center;padding:32px 0"><div class="loading-spinner" style="width:32px;height:32px"></div></div>
  </div></div>`);

  try {
    const taId = store.getActiveTaId();
    const [dashRes, trenRes, jurRes, berisRes] = await Promise.all([
      api.dashboard(taId),
      api.trenKehadiran('tahun_ajaran_id=' + taId),
      api.trenPerbandingan(taId),
      api.siswaBerisiko('tahun_ajaran_id=' + taId)
    ]);
    const d = dashRes.data;
    const tren = trenRes.data;
    const jurs = jurRes.data;
    const beris = berisRes.berisiko || [];
    const pct = tren.summary?.total ? Math.round(tren.summary.hadir / tren.summary.total * 100) : 0;
    const user = store.get('user');

    setContent(`
      <div class="p-page space-y-4 page">
        <!-- Hero -->
        <div class="hero-card">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div class="hero-avatar">${user?.nama?.charAt(0)||'K'}</div>
            <div>
              <div class="hero-name">${user?.nama || 'Kepala Sekolah'}</div>
              <div class="hero-sub">Kepala Sekolah · Overview Sistem</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.1);border-radius:14px;padding:12px 16px">
            <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-bottom:4px">Rata-rata Kehadiran Semester Ini</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:2.2rem;color:white">${pct}%</div>
            <div class="progress-bar" style="margin-top:8px">
              <div class="progress-fill" style="width:${pct}%;background:${pct>=80?'#10b981':pct>=60?'#f59e0b':'#ef4444'}"></div>
            </div>
          </div>
        </div>

        <!-- Grid stats -->
        <div class="grid-2">
          <div class="stat-card stat-blue">
            <div class="stat-icon" style="background:rgba(59,130,246,0.2)"><i class="fas fa-user-graduate" style="color:var(--blue)"></i></div>
            <div class="stat-val">${d.jumlahSiswa || 0}</div>
            <div class="stat-label">Siswa Aktif</div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon" style="background:rgba(16,185,129,0.2)"><i class="fas fa-chalkboard-teacher" style="color:var(--green)"></i></div>
            <div class="stat-val">${d.jumlahGuru || 0}</div>
            <div class="stat-label">Guru</div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon" style="background:rgba(139,92,246,0.2)"><i class="fas fa-door-open" style="color:var(--p400)"></i></div>
            <div class="stat-val">${d.jumlahKelas || 0}</div>
            <div class="stat-label">Kelas</div>
          </div>
          <div class="stat-card stat-red">
            <div class="stat-icon" style="background:var(--red-bg)"><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i></div>
            <div class="stat-val">${beris.length}</div>
            <div class="stat-label">Siswa Berisiko</div>
          </div>
        </div>

        <!-- Kehadiran hari ini -->
        <div class="card">
          <div class="card-header"><div class="card-title">📊 Rekap Hari Ini</div></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0">
            ${[
              ['Hadir', d.absensiSummary?.hadir||0, 'var(--green)'],
              ['Sakit', d.absensiSummary?.sakit||0, 'var(--blue)'],
              ['Izin',  d.absensiSummary?.izin||0,  'var(--yellow)'],
              ['Alpha', d.absensiSummary?.alpha||0, 'var(--red)'],
            ].map(([label, val, color], i) => `
              <div style="padding:14px;text-align:center;${i<3?'border-right:1px solid var(--border)':''}">
                <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;color:${color}">${val}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${label}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Tren Bulanan Chart -->
        ${tren.byBulan?.length ? `
        <div class="card">
          <div class="card-header"><div class="card-title">📈 Tren Kehadiran Bulanan</div></div>
          <div class="card-body"><div class="chart-wrap"><canvas id="chart-tren" height="180"></canvas></div></div>
        </div>` : ''}

        <!-- Perbandingan per Jurusan -->
        ${jurs.length ? `
        <div class="card">
          <div class="card-header"><div class="card-title">🏫 Perbandingan per Jurusan</div></div>
          <div class="card-body"><div class="chart-wrap"><canvas id="chart-jur" height="200"></canvas></div></div>
        </div>` : ''}

        <!-- Siswa Berisiko -->
        ${beris.length ? `
        <div class="card" style="border-color:rgba(239,68,68,0.3)">
          <div class="card-header" style="background:var(--red-bg)">
            <div class="card-title" style="color:var(--red)">⚠️ Siswa Berisiko (${beris.length})</div>
          </div>
          <div class="divide-y">
            ${beris.slice(0,8).map(s => {
              const p = s.pct_hadir || 0;
              const c = p < 60 ? 'var(--red)' : 'var(--yellow)';
              return `<div class="list-item">
                <div class="list-avatar" style="background:var(--red-bg);color:var(--red);font-family:'Syne',sans-serif;font-weight:800;font-size:13px">
                  ${p}%
                </div>
                <div class="list-content">
                  <div class="list-title">${s.nama}</div>
                  <div class="list-sub">${s.kelas_nama} · Alpha: ${s.alpha||0}x · ${s.nis}</div>
                  <div class="progress-bar" style="margin-top:5px;height:4px">
                    <div class="progress-fill" style="width:${p}%;background:${c}"></div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
          ${beris.length > 8 ? `<div style="padding:10px 16px;font-size:12px;color:var(--p400);text-align:center;cursor:pointer" onclick="navigateTo('alert')">Lihat semua ${beris.length} siswa →</div>` : ''}
        </div>` : `
        <div class="card" style="border-color:rgba(16,185,129,0.3)">
          <div style="padding:20px;display:flex;align-items:center;gap:14px">
            <div style="font-size:32px">✅</div>
            <div>
              <div style="font-weight:700;color:var(--green)">Semua Baik-baik Saja</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">Tidak ada siswa di bawah batas kehadiran minimum</div>
            </div>
          </div>
        </div>`}

        <!-- Quick actions -->
        <div>
          <div class="section-header"><div class="section-title">Aksi Cepat</div></div>
          <div class="grid-2" style="gap:10px">
            ${[
              ['fa-chart-line','Tren Lengkap','tren','var(--p700)'],
              ['fa-bell','Alert Siswa','alert','var(--red)'],
              ['fa-calendar-alt','Kalender','kalender','var(--blue)'],
              ['fa-file-excel','Export Data','export','var(--green)'],
            ].map(([icon,label,page,color]) => `
              <button onclick="navigateTo('${page}')" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;text-align:left;transition:all 0.15s">
                <div style="width:38px;height:38px;border-radius:12px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i class="fas ${icon}" style="font-size:15px"></i>
                </div>
                <span style="font-size:13px;font-weight:600;color:var(--text)">${label}</span>
              </button>`).join('')}
          </div>
        </div>
      </div>`);

    // Render charts
    requestAnimationFrame(() => {
      const tc = '#8b7aaa', gc = 'rgba(139,92,246,0.08)';
      const chartOpts = {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { labels: { color: tc, font: { family: 'DM Sans', size: 11 } } } },
        scales: { x: { ticks: { color: tc, font: {size:10} }, grid: { color: gc } }, y: { ticks: { color: tc, font: {size:10} }, grid: { color: gc } } }
      };

      const trenEl = document.getElementById('chart-tren');
      if (trenEl && tren.byBulan?.length) {
        store.get('chartInstances')['tren'] = new Chart(trenEl, {
          type: 'line',
          data: {
            labels: tren.byBulan.map(b => b.label),
            datasets: [
              { label: 'Hadir', data: tren.byBulan.map(b => b.hadir), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, pointRadius: 3 },
              { label: 'Alpha', data: tren.byBulan.map(b => b.alpha), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true, pointRadius: 3 },
            ]
          },
          options: chartOpts
        });
      }

      const jurEl = document.getElementById('chart-jur');
      if (jurEl && jurs.length) {
        store.get('chartInstances')['jur'] = new Chart(jurEl, {
          type: 'bar',
          data: {
            labels: jurs.map(j => `${j.kode||j.jurusan.slice(0,4)} ${j.tingkat}`),
            datasets: [
              { label: 'Hadir', data: jurs.map(j => j.hadir), backgroundColor: '#10b981', borderRadius: 4, stack: 's' },
              { label: 'Sakit', data: jurs.map(j => j.sakit), backgroundColor: '#3b82f6', borderRadius: 0, stack: 's' },
              { label: 'Alpha', data: jurs.map(j => j.alpha), backgroundColor: '#ef4444', borderRadius: [0,0,4,4], stack: 's' },
            ]
          },
          options: { ...chartOpts, scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, stacked: true }, y: { ...chartOpts.scales.y, stacked: true } } }
        });
      }
    });
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Error</div><div class="empty-sub">${err.message}</div></div>`); }
}
