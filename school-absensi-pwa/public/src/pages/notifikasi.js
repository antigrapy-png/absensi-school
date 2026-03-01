// =============================================
// QR Page
// =============================================
async function renderQRPage() {
  const user = store.get('user');
  setPageTitle('QR Absensi');

  if (user?.role === 'siswa') {
    // Siswa: scan QR
    setContent(`
      <div class="p-page space-y-4 page">
        <div style="background:linear-gradient(135deg,var(--p900),var(--p700));border-radius:var(--radius-xl);padding:32px 20px;text-align:center">
          <i class="fas fa-qrcode" style="font-size:64px;color:rgba(255,255,255,0.6);margin-bottom:16px;display:block"></i>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.2rem;color:white;margin-bottom:6px">Scan QR Absensi</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.6)">Masukkan token dari guru</div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="input-group">
              <label class="input-label">Token QR</label>
              <div style="display:flex;gap:8px">
                <input class="input" id="qr-token" placeholder="Paste token di sini..." style="font-family:monospace;font-size:13px;flex:1" />
                <button onclick="doScanQRPWA()" class="btn btn-primary" style="white-space:nowrap"><i class="fas fa-sign-in-alt"></i> Absen</button>
              </div>
            </div>
          </div>
        </div>

        <div id="sesi-aktif-list"></div>
      </div>`);
    loadSesiAktif();
  } else {
    // Guru/Admin: generate QR
    const taId = store.getActiveTaId();
    const today = new Date().toISOString().slice(0,10);
    const jadwalRes = await api.jadwal(taId).catch(()=>({data:[]}));

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="card">
          <div class="card-header"><div class="card-title">🔲 Generate QR Sesi</div></div>
          <div class="card-body space-y-3">
            ${inputGroup('Jadwal', selectInput('qr-jadwal', [{value:'',label:'— Pilih Jadwal —'},...jadwalRes.data.map(j=>({value:j.id,label:`${j.mapel_naam||j.mapel_nama||'—'} — ${j.kelas_nama||j.kelas||'—'}`}))], ''))}
            ${formRow(inputGroup('Tanggal', textInput('qr-tanggal','date','',today)),
                      inputGroup('Durasi', selectInput('qr-durasi',[{value:'10',label:'10 menit'},{value:'15',label:'15 menit'},{value:'20',label:'20 menit'},{value:'30',label:'30 menit'}],'15')))}
            <button onclick="doGenerateQR()" class="btn btn-primary btn-full"><i class="fas fa-qrcode"></i> Generate QR</button>
          </div>
        </div>

        <div id="qr-result" class="hidden">
          <div class="card" style="border-color:var(--border-2)">
            <div class="card-header"><div class="card-title">QR Code Aktif</div></div>
            <div class="card-body" style="text-align:center">
              <div id="qr-canvas" style="display:flex;justify-content:center;margin-bottom:14px"></div>
              <div style="background:var(--surface-3);border-radius:10px;padding:10px 12px;margin-bottom:10px">
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Token</div>
                <div id="qr-token-display" style="font-family:monospace;font-size:11px;color:var(--p300);word-break:break-all"></div>
              </div>
              <div id="qr-expiry" style="font-size:12px;color:var(--red);font-weight:600;margin-bottom:10px"></div>
              <button onclick="copyQRToken()" class="btn btn-secondary btn-sm"><i class="fas fa-copy"></i> Salin Token</button>
            </div>
          </div>
        </div>
      </div>`);
  }
}

async function loadSesiAktif() {
  const div = document.getElementById('sesi-aktif-list');
  if (!div) return;
  try {
    const res = await api.qrSesiAktif();
    if (!res.data?.length) return;
    div.innerHTML = `
      <div class="card" style="border-color:rgba(16,185,129,0.3)">
        <div class="card-header" style="background:var(--green-bg)">
          <div class="card-title" style="color:var(--green)"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:6px;animation:pulse 1.5s infinite"></span>Sesi Aktif (${res.data.length})</div>
        </div>
        <div class="divide-y">
          ${res.data.map(s=>{
            const minsLeft = Math.max(0, Math.round((new Date(s.expired_at)-Date.now())/60000));
            return `<div class="list-item">
              <div class="list-content"><div class="list-title">${s.mapel_nama}</div><div class="list-sub">Guru: ${s.guru_nama} · Sisa ${minsLeft} menit</div></div>
              <button onclick="useToken('${s.token}')" class="btn btn-primary btn-sm">Gunakan</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  } catch(e) {}
}

function useToken(token) {
  const input = document.getElementById('qr-token');
  if (input) { input.value = token; showToast('Token siap digunakan!','info'); }
}

async function doScanQRPWA() {
  const token = document.getElementById('qr-token')?.value.trim();
  if (!token) { showToast('Masukkan token QR','error'); return; }
  try {
    const r = await api.qrScan({ token });
    showToast(r.message, r.data?.status==='terlambat'?'warning':'success');
    document.getElementById('qr-token').value = '';
  } catch(err) { showToast(err.message,'error'); }
}

let _qrToken = '';
async function doGenerateQR() {
  const jadwalId = document.getElementById('qr-jadwal')?.value;
  const tanggal  = document.getElementById('qr-tanggal')?.value;
  const durasi   = document.getElementById('qr-durasi')?.value;
  if (!jadwalId) { showToast('Pilih jadwal dulu','error'); return; }
  try {
    const r = await api.qrGenerate({ jadwal_id: jadwalId, tanggal, durasi_menit: parseInt(durasi) });
    _qrToken = r.data.token;
    document.getElementById('qr-result')?.classList.remove('hidden');
    document.getElementById('qr-token-display').textContent = _qrToken;
    document.getElementById('qr-expiry').textContent = `Kedaluwarsa: ${new Date(r.data.expired_at).toLocaleTimeString('id-ID')}`;

    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      canvas.innerHTML = '';
      if (window.QRCode) {
        new QRCode(canvas, { text: _qrToken, width: 200, height: 200, colorDark: '#4c1d95', colorLight: '#0f0a1e' });
      }
    }
    showToast('QR berhasil digenerate!','success');
  } catch(err) { showToast(err.message,'error'); }
}

function copyQRToken() {
  if (!_qrToken) return;
  navigator.clipboard?.writeText(_qrToken).then(()=>showToast('Token tersalin!','success')).catch(()=>{
    // fallback
    const ta = document.createElement('textarea'); ta.value = _qrToken;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); showToast('Token tersalin!','success');
  });
}

// =============================================
// Notifikasi Page
// =============================================
async function renderNotifikasi() {
  setPageTitle('Notifikasi');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const [alertRes, izinRes] = await Promise.all([
      api.alerts(taId).catch(()=>({data:[]})),
      api.izin(taId).catch(()=>({data:[]}))
    ]);
    const alerts = alertRes.data || [];
    const pendingIzin = (izinRes.data||[]).filter(i=>i.status==='pending');

    setContent(`
      <div class="p-page space-y-4 page">
        ${pendingIzin.length ? `
        <div class="card" style="border-color:rgba(245,158,11,0.3)">
          <div class="card-header" style="background:var(--yellow-bg)">
            <div class="card-title" style="color:var(--yellow)">⏳ Izin Menunggu (${pendingIzin.length})</div>
          </div>
          <div class="divide-y">
            ${pendingIzin.slice(0,5).map(iz=>`
            <div class="list-item" onclick="navigateTo('izin')">
              <div class="list-avatar" style="background:var(--yellow-bg);color:var(--yellow)"><i class="fas fa-file-medical-alt"></i></div>
              <div class="list-content">
                <div class="list-title">${iz.siswa_nama}</div>
                <div class="list-sub">${iz.jenis} · ${String(iz.tanggal_mulai).slice(0,10)}</div>
              </div>
              <i class="fas fa-chevron-right list-action"></i>
            </div>`).join('')}
          </div>
        </div>` : ''}

        ${alerts.length ? `
        <div class="card" style="border-color:rgba(239,68,68,0.3)">
          <div class="card-header" style="background:var(--red-bg);display:flex;align-items:center;justify-content:space-between">
            <div class="card-title" style="color:var(--red)">⚠️ Alert (${alerts.length})</div>
            <button onclick="markAllNotifsRead()" style="font-size:11px;color:var(--red);background:none;border:none;cursor:pointer;font-weight:600">Baca semua</button>
          </div>
          <div class="divide-y">
            ${alerts.slice(0,10).map(a=>`
            <div class="list-item" onclick="markAlertRead(${a.id});this.style.opacity='0.5';navigateTo('alert')">
              <div class="list-avatar" style="background:var(--red-bg);color:var(--red)"><i class="fas fa-exclamation-triangle"></i></div>
              <div class="list-content">
                <div class="list-title">${a.siswa_nama} · ${a.kelas_nama}</div>
                <div class="list-sub">${a.detail}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${new Date(a.created_at).toLocaleDateString('id-ID')}</div>
              </div>
            </div>`).join('')}
          </div>
        </div>` : ''}

        ${!pendingIzin.length && !alerts.length ? `
        <div class="empty-state" style="padding:60px 20px">
          <div style="font-size:56px">🎉</div>
          <div class="empty-title">Semua beres!</div>
          <div class="empty-sub">Tidak ada notifikasi baru</div>
        </div>` : ''}
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

// =============================================
// Alert Page
// =============================================
async function renderAlertPage() {
  setPageTitle('Alert & Berisiko');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const [alertRes, risikoRes] = await Promise.all([
      api.alerts(taId), api.siswaBerisiko('tahun_ajaran_id=' + taId)
    ]);
    const alerts = alertRes.data || [];
    const berisiko = risikoRes.berisiko || [];
    const jenisLabel = {alpha_beruntun:'Alpha Beruntun',batas_kehadiran:'Bawah Batas Min.'};

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="grid-2">
          <div class="stat-card stat-red"><div class="stat-icon" style="background:rgba(239,68,68,0.2)"><i class="fas fa-bell" style="color:var(--red)"></i></div><div class="stat-val">${alerts.length}</div><div class="stat-label">Alert Baru</div></div>
          <div class="stat-card stat-yellow"><div class="stat-icon" style="background:rgba(245,158,11,0.2)"><i class="fas fa-exclamation-triangle" style="color:var(--yellow)"></i></div><div class="stat-val">${berisiko.length}</div><div class="stat-label">Berisiko</div></div>
        </div>

        <div style="display:flex;gap:8px">
          <button onclick="doAlertCheck()" class="btn btn-danger btn-sm"><i class="fas fa-search"></i> Cek Sekarang</button>
          ${alerts.length?`<button onclick="markAllNotifsRead()" class="btn btn-secondary btn-sm"><i class="fas fa-check-double"></i> Baca Semua</button>`:''}
        </div>

        ${alerts.length ? `
        <div class="card" style="border-color:rgba(239,68,68,0.25)">
          <div class="card-header" style="background:var(--red-bg)"><div class="card-title" style="color:var(--red)">Alert Baru</div></div>
          <div class="divide-y">
            ${alerts.map(a=>`
            <div class="list-item" onclick="markAlertRead(${a.id});this.style.opacity='0.4'">
              <div class="list-avatar" style="background:var(--red-bg);color:var(--red);font-size:18px">⚠️</div>
              <div class="list-content">
                <div class="list-title">${a.siswa_nama}</div>
                <div class="list-sub">${a.kelas_nama} · ${jenisLabel[a.jenis]||a.jenis}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:3px">${a.detail}</div>
              </div>
            </div>`).join('')}
          </div>
        </div>` : `<div class="card"><div style="padding:20px;display:flex;align-items:center;gap:12px"><div style="font-size:28px">✅</div><div><div style="font-weight:700;color:var(--green)">Tidak ada alert baru</div></div></div></div>`}

        ${berisiko.length ? `
        <div class="card">
          <div class="card-header"><div class="card-title">Siswa Berisiko</div></div>
          <div class="divide-y">
            ${berisiko.map(s=>{
              const p=s.pct_hadir||0;
              const c=p<60?'var(--red)':'var(--yellow)';
              return `<div class="list-item">
                <div class="list-avatar" style="background:${c}22;color:${c};font-family:'Syne',sans-serif;font-weight:800;font-size:12px">${p}%</div>
                <div class="list-content">
                  <div class="list-title">${s.nama}</div>
                  <div class="list-sub">${s.kelas_nama} · Alpha: ${s.alpha||0}x</div>
                  <div class="progress-bar" style="margin-top:5px;height:3px"><div style="height:100%;border-radius:3px;background:${c};width:${p}%"></div></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

async function doAlertCheck() {
  try {
    const r = await api.alertCheck({ tahun_ajaran_id: store.getActiveTaId() });
    showToast(r.message, r.data?.alertsCreated > 0 ? 'warning' : 'success');
    renderAlertPage();
  } catch(err) { showToast(err.message,'error'); }
}

// =============================================
// Izin Page
// =============================================
async function renderIzinPage() {
  setPageTitle('Izin & Sakit');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const res = await api.izin(taId);
    const data = res.data || [];
    const pending  = data.filter(d=>d.status==='pending');
    const approved = data.filter(d=>d.status==='approved');
    const rejected = data.filter(d=>d.status==='rejected');
    const user = store.get('user');
    const statusBadge = s => ({pending:`<span class="badge-tag badge-yellow"><i class="fas fa-clock"></i> Menunggu</span>`,approved:`<span class="badge-tag badge-green"><i class="fas fa-check"></i> Disetujui</span>`,rejected:`<span class="badge-tag badge-red"><i class="fas fa-times"></i> Ditolak</span>`}[s]||'');

    setContent(`
      <div class="page">
        <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:6px">
            <span class="badge-tag badge-yellow">${pending.length} menunggu</span>
            <span class="badge-tag badge-green">${approved.length} disetujui</span>
          </div>
          ${user?.role==='siswa' ? `<button onclick="showAjukanIzinModalPWA()" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Ajukan</button>` : ''}
        </div>

        ${pending.length && user?.role!=='siswa' ? `
        <div style="background:rgba(245,158,11,0.08);border-bottom:1px solid rgba(245,158,11,0.2);padding:12px 14px">
          <div style="font-size:11px;font-weight:700;color:var(--yellow);margin-bottom:8px"><i class="fas fa-clock"></i> MENUNGGU PERSETUJUAN</div>
          <div class="space-y-3">
            ${pending.map(iz=>{
              const hari=Math.ceil((new Date(iz.tanggal_selesai)-new Date(iz.tanggal_mulai))/86400000)+1;
              return `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                  <div><div style="font-weight:600;font-size:13px;color:var(--text)">${iz.siswa_nama}</div><div style="font-size:11px;color:var(--text-3)">${iz.kelas_nama} · ${iz.nis}</div></div>
                  <span class="badge-tag ${iz.jenis==='sakit'?'badge-blue':'badge-yellow'}">${iz.jenis}</span>
                </div>
                <div style="font-size:12px;color:var(--text-2);margin-bottom:10px">${String(iz.tanggal_mulai).slice(0,10)} s/d ${String(iz.tanggal_selesai).slice(0,10)} (${hari} hari)<br><span style="color:var(--text-3)">${iz.alasan}</span></div>
                <div style="display:flex;gap:8px">
                  <button onclick="doReviewIzinPWA(${iz.id},'approved')" class="btn btn-success btn-sm btn-full"><i class="fas fa-check"></i> Setuju</button>
                  <button onclick="doReviewIzinPWA(${iz.id},'rejected')" class="btn btn-danger btn-sm btn-full"><i class="fas fa-times"></i> Tolak</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="divide-y">
          ${[...approved,...rejected].map(iz=>{
            const hari=Math.ceil((new Date(iz.tanggal_selesai)-new Date(iz.tanggal_mulai))/86400000)+1;
            return `<div class="list-item">
              <div class="list-avatar" style="background:${iz.jenis==='sakit'?'var(--blue-bg)':'var(--yellow-bg)'};color:${iz.jenis==='sakit'?'var(--blue)':'var(--yellow)'}"><i class="fas ${iz.jenis==='sakit'?'fa-hospital-alt':'fa-calendar-minus'}"></i></div>
              <div class="list-content">
                <div class="list-title">${iz.siswa_nama||user?.nama}</div>
                <div class="list-sub">${String(iz.tanggal_mulai).slice(0,10)} · ${hari} hari · ${iz.jenis}</div>
              </div>
              ${statusBadge(iz.status)}
            </div>`;
          }).join('') || `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-sub">Belum ada pengajuan</div></div>`}
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

function showAjukanIzinModalPWA() {
  const today = new Date().toISOString().slice(0,10);
  openModal('Ajukan Izin / Sakit', `
    <div class="space-y-3">
      ${inputGroup('Jenis', selectInput('iz-jenis',[{value:'izin',label:'📅 Izin'},{value:'sakit',label:'🏥 Sakit'}],'izin'))}
      ${formRow(inputGroup('Mulai', textInput('iz-start','date','',today)), inputGroup('Selesai', textInput('iz-end','date','',today)))}
      ${inputGroup('Alasan', `<textarea class="input" id="iz-alasan" rows="3" placeholder="Tuliskan alasan dengan jelas..."></textarea>`)}
    </div>`,
    { footer: modalFooter('Kirim Pengajuan','doAjukanIzinPWA()') });
}
async function doAjukanIzinPWA() {
  const jenis  = document.getElementById('iz-jenis')?.value;
  const start  = document.getElementById('iz-start')?.value;
  const end    = document.getElementById('iz-end')?.value;
  const alasan = document.getElementById('iz-alasan')?.value.trim();
  if (!start||!end||!alasan) { showToast('Semua field wajib diisi','error'); return; }
  if (end<start) { showToast('Tanggal tidak valid','error'); return; }
  try {
    const r = await api.izinAdd({ jenis, tanggal_mulai:start, tanggal_selesai:end, alasan, tahun_ajaran_id: store.getActiveTaId() });
    showToast(r.message); closeModal(); renderIzinPage();
  } catch(err) { showToast(err.message,'error'); }
}
async function doReviewIzinPWA(id, status) {
  try {
    const r = await api.izinReview(id, { status });
    showToast(r.message, status==='approved'?'success':'info');
    renderIzinPage();
  } catch(err) { showToast(err.message,'error'); }
}

// =============================================
// Tren Page
// =============================================
async function renderTrenPage() {
  setPageTitle('Grafik Tren');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const [trenRes, jurRes] = await Promise.all([
      api.trenKehadiran('tahun_ajaran_id=' + taId),
      api.trenPerbandingan(taId)
    ]);
    const d = trenRes.data, jur = jurRes.data;
    const pct = d.summary?.total ? Math.round(d.summary.hadir/d.summary.total*100) : 0;
    const tc = '#8b7aaa', gc = 'rgba(139,92,246,0.08)';
    const chartOpts = (stacked=false) => ({responsive:true,plugins:{legend:{labels:{color:tc,font:{size:10}}}},scales:{x:{stacked,ticks:{color:tc,font:{size:9}},grid:{color:gc}},y:{stacked,ticks:{color:tc,font:{size:9}},grid:{color:gc}}}});

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="grid-4" style="gap:8px">
          ${[['%',pct,'var(--p400)'],['H',d.summary?.hadir||0,'var(--green)'],['A',d.summary?.alpha||0,'var(--red)'],['∑',d.summary?.total_siswa||0,'var(--blue)']].map(([l,v,c])=>`
          <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px 8px;text-align:center">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:${c}">${v}${l==='%'?'%':''}</div>
            <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${{H:'Hadir',A:'Alpha','∑':'Siswa','%':'Kehadiran'}[l]}</div>
          </div>`).join('')}
        </div>

        ${d.byBulan?.length?`<div class="card"><div class="card-header"><div class="card-title">📈 Tren Bulanan</div></div><div class="card-body"><canvas id="chart-bulan" height="180"></canvas></div></div>`:''}
        ${d.byHari?.length?`<div class="card"><div class="card-header"><div class="card-title">📅 Per Hari</div></div><div class="card-body"><canvas id="chart-hari" height="160"></canvas></div></div>`:''}
        ${jur?.length?`<div class="card"><div class="card-header"><div class="card-title">🏫 Per Jurusan</div></div><div class="card-body"><canvas id="chart-jur" height="180"></canvas></div></div>`:''}

        ${d.topAlpha?.length?`
        <div class="card">
          <div class="card-header"><div class="card-title">🔴 Alpha Terbanyak</div></div>
          <div class="divide-y">
            ${d.topAlpha.map((s,i)=>`<div class="list-item">
              <div style="width:28px;height:28px;border-radius:50%;${i<3?['background:var(--red)','background:var(--yellow)','background:rgba(245,158,11,0.5)'][i]:'background:var(--surface-3)'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
              <div class="list-content"><div class="list-title">${s.nama}</div><div class="list-sub">${s.kelas_nama} · ${s.pct_hadir||0}% hadir</div></div>
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--red)">${s.alpha_count}</div>
            </div>`).join('')}
          </div>
        </div>`:''}
      </div>`);

    requestAnimationFrame(()=>{
      const bulanEl=document.getElementById('chart-bulan');
      if(bulanEl&&d.byBulan?.length) new Chart(bulanEl,{type:'line',data:{labels:d.byBulan.map(b=>b.label),datasets:[{label:'Hadir',data:d.byBulan.map(b=>b.hadir),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',tension:0.4,fill:true,pointRadius:2},{label:'Alpha',data:d.byBulan.map(b=>b.alpha),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',tension:0.4,fill:true,pointRadius:2}]},options:chartOpts()});

      const hariEl=document.getElementById('chart-hari');
      if(hariEl&&d.byHari?.length) new Chart(hariEl,{type:'bar',data:{labels:d.byHari.map(h=>h.hari),datasets:[{label:'% Hadir',data:d.byHari.map(h=>h.pct),backgroundColor:['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316'],borderRadius:6}]},options:{...chartOpts(),scales:{x:{ticks:{color:tc,font:{size:9}},grid:{color:gc}},y:{min:0,max:100,ticks:{color:tc,font:{size:9},callback:v=>v+'%'},grid:{color:gc}}}}});

      const jurEl=document.getElementById('chart-jur');
      if(jurEl&&jur?.length) new Chart(jurEl,{type:'bar',data:{labels:jur.map(j=>`${j.kode||j.jurusan?.slice(0,4)} ${j.tingkat}`),datasets:[{label:'Hadir',data:jur.map(j=>j.hadir),backgroundColor:'#10b981',borderRadius:3,stack:'s'},{label:'Alpha',data:jur.map(j=>j.alpha),backgroundColor:'#ef4444',borderRadius:[0,0,3,3],stack:'s'}]},options:chartOpts(true)});
    });
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}
