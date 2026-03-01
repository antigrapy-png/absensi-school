// =============================================
// Absensi Harian — Mobile Optimized
// =============================================
let _absensiData = {};

async function renderAbsensiHarian() {
  setPageTitle('Absensi Harian');
  const taId = store.getActiveTaId();
  const [krRes, semRes] = await Promise.all([api.kelas(taId), Promise.resolve()]);
  const today = new Date().toISOString().slice(0,10);

  setContent(`
    <div class="page">
      <!-- Filter Bar (sticky) -->
      <div class="sticky-top" style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px">
        <div style="flex:1">
          <select class="input" id="ab-kelas" style="font-size:13px;padding:9px 12px" onchange="loadAbsensiHarian()">
            <option value="">— Pilih Kelas —</option>
            ${krRes.data.map(k=>`<option value="${k.id}">${k.nama}</option>`).join('')}
          </select>
        </div>
        <input type="date" id="ab-tanggal" class="input" value="${today}" style="width:130px;font-size:13px;padding:9px 10px" onchange="loadAbsensiHarian()" />
      </div>

      <div id="absensi-content">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">Pilih kelas</div>
          <div class="empty-sub">Pilih kelas dan tanggal untuk mulai input absensi</div>
        </div>
      </div>
    </div>`);
}

async function loadAbsensiHarian() {
  const kelasId = document.getElementById('ab-kelas')?.value;
  const tanggal  = document.getElementById('ab-tanggal')?.value;
  if (!kelasId) return;
  const taId = store.getActiveTaId();
  const div = document.getElementById('absensi-content');
  div.innerHTML = `<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner"></div></div>`;

  try {
    const res = await api.absensiHarianGet(kelasId, tanggal, taId);
    const siswaList = res.data || [];
    _absensiData = {};
    siswaList.forEach(s => { _absensiData[s.siswa_id] = s.status || 'hadir'; });

    const totalSiswa = siswaList.length;
    const sudahAbsen = siswaList.filter(s=>s.status).length;

    div.innerHTML = `
      <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-bottom:1px solid var(--border)">
        <div>
          <span style="font-size:13px;font-weight:700;color:var(--text)">${totalSiswa} siswa</span>
          <span style="font-size:11px;color:var(--text-muted);margin-left:6px">${sudahAbsen} sudah terabsen</span>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="setAllStatus('hadir')" class="btn btn-sm" style="background:var(--green-bg);color:var(--green);border:1px solid rgba(16,185,129,0.3);padding:5px 10px">✓ Semua Hadir</button>
        </div>
      </div>

      <div id="siswa-absen-list">
        ${siswaList.map((s,i) => absenRow(s, i+1)).join('')}
      </div>

      <div style="padding:14px;border-top:1px solid var(--border)">
        <button onclick="submitAbsensi('${kelasId}','${tanggal}')" class="btn btn-primary btn-full btn-lg">
          <i class="fas fa-save"></i> Simpan Absensi
        </button>
      </div>`;
  } catch(err) { div.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`; }
}

function absenRow(s, num) {
  const cur = _absensiData[s.siswa_id] || 'hadir';
  return `
    <div class="absen-row" id="row-${s.siswa_id}">
      <div class="absen-num">${num}</div>
      <div style="flex:1;min-width:0">
        <div class="absen-name truncate">${s.nama}</div>
        <div class="absen-nis">${s.nis}</div>
      </div>
      <div class="absen-options">
        ${['hadir','sakit','izin','alpha'].map(st=>`
        <div class="absen-opt">
          <input type="radio" name="ab-${s.siswa_id}" id="ab-${s.siswa_id}-${st}" value="${st}" ${cur===st?'checked':''} onchange="setStatus(${s.siswa_id},'${st}')" />
          <label for="ab-${s.siswa_id}-${st}" class="${st}">${st==='hadir'?'H':st==='sakit'?'S':st==='izin'?'I':'A'}</label>
        </div>`).join('')}
      </div>
    </div>`;
}

function setStatus(siswaId, status) {
  _absensiData[siswaId] = status;
  const row = document.getElementById('row-' + siswaId);
  if (row) {
    const colors = {hadir:'rgba(16,185,129,0.06)',sakit:'rgba(59,130,246,0.06)',izin:'rgba(245,158,11,0.06)',alpha:'rgba(239,68,68,0.06)'};
    row.style.background = colors[status] || '';
    setTimeout(()=>{ if(row) row.style.background=''; }, 500);
  }
}

function setAllStatus(status) {
  Object.keys(_absensiData).forEach(id => {
    _absensiData[id] = status;
    const radios = document.querySelectorAll(`input[name="ab-${id}"]`);
    radios.forEach(r => { r.checked = r.value === status; });
  });
  showToast(`Semua ${Object.keys(_absensiData).length} siswa set ke ${status}`, 'success');
}

async function submitAbsensi(kelasId, tanggal) {
  const taId = store.getActiveTaId();
  const bulk = Object.entries(_absensiData).map(([siswa_id, status]) => ({
    siswa_id: parseInt(siswa_id), kelas_id: parseInt(kelasId),
    tahun_ajaran_id: parseInt(taId), tanggal, status
  }));
  if (!bulk.length) { showToast('Tidak ada data', 'error'); return; }

  const btn = document.querySelector('button[onclick^="submitAbsensi"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  try {
    await api.absensiHarianBulk({ data: bulk });
    showToast(`Absensi ${tanggal} berhasil disimpan! ✅`, 'success');
    // Visual feedback
    document.querySelectorAll('.absen-row').forEach(r => {
      r.style.transition = 'background 0.3s';
      r.style.background = 'rgba(16,185,129,0.06)';
      setTimeout(()=>{ r.style.background=''; }, 800);
    });
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Tersimpan!'; setTimeout(()=>{ btn.innerHTML = '<i class="fas fa-save"></i> Simpan Absensi'; }, 2000); }
  } catch(err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan Absensi'; }
  }
}

// ── Absensi Mapel ──
async function renderAbsensiMapelPage() {
  setPageTitle('Absensi Mata Pelajaran');
  const taId = store.getActiveTaId();
  const today = new Date().toISOString().slice(0,10);
  const jadwalRes = await api.jadwal(taId);

  setContent(`
    <div class="page">
      <div class="sticky-top" style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px">
        <div style="flex:1">
          <select class="input" id="am-jadwal" style="font-size:13px;padding:9px 12px" onchange="loadAbsensiMapel()">
            <option value="">— Pilih Jadwal —</option>
            ${jadwalRes.data.map(j=>`<option value="${j.id}">${j.mapel_naam||j.mapel_nama||'—'} — ${j.kelas_nama||j.kelas||'—'} (${(j.jam_mulai||'').slice(0,5)})</option>`).join('')}
          </select>
        </div>
        <input type="date" id="am-tanggal" class="input" value="${today}" style="width:130px;font-size:13px;padding:9px 10px" onchange="loadAbsensiMapel()" />
      </div>
      <div id="mapel-absensi-content">
        <div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">Pilih jadwal</div><div class="empty-sub">Pilih jadwal mata pelajaran</div></div>
      </div>
    </div>`);
}

async function loadAbsensiMapel() {
  const jadwalId = document.getElementById('am-jadwal')?.value;
  const tanggal  = document.getElementById('am-tanggal')?.value;
  if (!jadwalId) return;
  const taId = store.getActiveTaId();
  const div = document.getElementById('mapel-absensi-content');
  div.innerHTML = `<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner"></div></div>`;
  try {
    const res = await api.absensiMapelGet(jadwalId, tanggal, taId);
    const siswaList = res.data || [];
    _absensiData = {};
    siswaList.forEach(s => { _absensiData[s.siswa_id] = s.status || 'hadir'; });

    div.innerHTML = `
      <div style="padding:10px 14px;background:var(--surface-2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;font-weight:700;color:var(--text)">${siswaList.length} siswa</span>
        <button onclick="setAllMapelStatus('hadir')" class="btn btn-sm" style="background:var(--green-bg);color:var(--green);border:1px solid rgba(16,185,129,0.3)">✓ Semua Hadir</button>
      </div>
      <div>${siswaList.map((s,i)=>absenRow(s,i+1)).join('')}</div>
      <div style="padding:14px;border-top:1px solid var(--border)">
        <button onclick="submitAbsensiMapel('${jadwalId}','${tanggal}')" class="btn btn-primary btn-full btn-lg"><i class="fas fa-save"></i> Simpan</button>
      </div>`;
  } catch(err) { div.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`; }
}

function setAllMapelStatus(status) { setAllStatus(status); }

async function submitAbsensiMapel(jadwalId, tanggal) {
  const taId = store.getActiveTaId();
  const bulk = Object.entries(_absensiData).map(([siswa_id,status])=>({siswa_id:parseInt(siswa_id),jadwal_id:parseInt(jadwalId),tahun_ajaran_id:parseInt(taId),tanggal,status}));
  if (!bulk.length) { showToast('Tidak ada data','error'); return; }
  try {
    await api.absensiMapelBulk({ data: bulk });
    showToast('Absensi mapel tersimpan! ✅','success');
  } catch(err) { showToast(err.message,'error'); }
}

// ── Absensi Siswa View ──
async function renderAbsensiSiswaView() {
  setPageTitle('Absensi Saya');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:32px;height:32px"></div></div>`);
  try {
    const taId = store.getActiveTaId();
    const user = store.get('user');
    // siswaId dari user
    const meRes = await api.me();
    const siswaId = meRes.data?.siswa_id;
    if (!siswaId) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">Data siswa tidak ditemukan</div></div>`); return; }
    const res = await api.absensiSiswa(siswaId, taId);
    const data = res.data || [];
    const statusMap={hadir:['badge-green','Hadir'],sakit:['badge-blue','Sakit'],izin:['badge-yellow','Izin'],alpha:['badge-red','Alpha']};

    setContent(`
      <div class="p-page space-y-4 page">
        <div class="grid-4" style="gap:8px">
          ${['hadir','sakit','izin','alpha'].map(st=>{
            const count=data.filter(r=>r.status===st).length;
            const colors={hadir:'var(--green)',sakit:'var(--blue)',izin:'var(--yellow)',alpha:'var(--red)'};
            return `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px 8px;text-align:center">
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:${colors[st]}">${count}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:capitalize">${st}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Riwayat Absensi</div></div>
          <div class="divide-y">
            ${data.slice(0,50).map(r=>{
              const [sc,sl]=statusMap[r.status]||['badge-gray',r.status];
              return `<div class="list-item">
                <div style="width:40px;text-align:center;flex-shrink:0">
                  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--text)">${new Date(r.tanggal).getDate()}</div>
                  <div style="font-size:9px;color:var(--text-muted)">${new Date(r.tanggal).toLocaleDateString('id-ID',{month:'short'})}</div>
                </div>
                <div class="list-content">
                  <div class="list-title">${new Date(r.tanggal).toLocaleDateString('id-ID',{weekday:'long'})}</div>
                  <div class="list-sub">${r.keterangan||'—'}</div>
                </div>
                <span class="badge-tag ${sc}">${sl}</span>
              </div>`;
            }).join('') || `<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><div class="empty-sub">Belum ada data</div></div>`}
          </div>
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}
