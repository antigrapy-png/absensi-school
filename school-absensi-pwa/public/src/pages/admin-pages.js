// =============================================
// HALAMAN ADMIN — Manajemen Data
// Siswa, Guru, Kelas, Mapel, Jadwal,
// Semester, Rekap, Logs, Export, Batas
// =============================================

// ── Utility helpers ──
function skelRow(cols) {
  return `<tr>${Array(cols).fill('<td><div class="skeleton" style="height:14px;width:80%"></div></td>').join('')}</tr>`;
}
function skeletonTable(cols, rows=5) {
  return `<div class="tbl-wrap"><table class="tbl"><tbody>${Array(rows).fill(skelRow(cols)).join('')}</tbody></table></div>`;
}

// =============================================
// SISWA — CRUD Lengkap
// =============================================
let _siswaList = [];
let _siswaFilter = { search: '', kelas_id: '', is_alumni: '0' };

async function renderSiswaPage() {
  setPageTitle('Manajemen Siswa');
  const taId = store.getActiveTaId();
  const krRes = await api.kelas(taId).catch(() => ({ data: [] }));

  setContent(`
    <div class="page">
      <!-- Filter Bar -->
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px;flex-wrap:wrap" class="sticky-top">
        <div class="input-icon-wrap" style="flex:1;min-width:160px">
          <i class="fas fa-search input-icon"></i>
          <input class="input" id="siswa-search" placeholder="Cari nama / NIS..." style="padding-left:38px;font-size:13px;padding-top:9px;padding-bottom:9px" oninput="filterSiswa()" />
        </div>
        <select class="input" id="siswa-kelas-filter" style="width:auto;font-size:13px;padding:9px 10px" onchange="filterSiswa()">
          <option value="">Semua Kelas</option>
          ${krRes.data.map(k => `<option value="${k.id}">${k.nama}</option>`).join('')}
        </select>
        <button onclick="showTambahSiswaModal(${JSON.stringify(krRes.data).replace(/"/g, '&quot;')})" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Tambah</button>
      </div>

      <!-- Stats strip -->
      <div style="display:flex;gap:0;background:var(--surface-2);border-bottom:1px solid var(--border)">
        <div style="flex:1;padding:10px;text-align:center;border-right:1px solid var(--border)">
          <div id="stat-total" style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:var(--p400)">—</div>
          <div style="font-size:10px;color:var(--text-muted)">Total</div>
        </div>
        <div style="flex:1;padding:10px;text-align:center;border-right:1px solid var(--border)">
          <div id="stat-aktif" style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:var(--green)">—</div>
          <div style="font-size:10px;color:var(--text-muted)">Aktif</div>
        </div>
        <div style="flex:1;padding:10px;text-align:center">
          <div id="stat-ketua" style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:var(--yellow)">—</div>
          <div style="font-size:10px;color:var(--text-muted)">Ketua Kelas</div>
        </div>
      </div>

      <div id="siswa-table-wrap">${skeletonTable(5)}</div>
    </div>`);

  await loadSiswaData();
}

async function loadSiswaData() {
  try {
    const taId = store.getActiveTaId();
    const res = await api.siswa(taId);
    _siswaList = res.data || [];

    // Stats
    const aktif = _siswaList.filter(s => s.is_active);
    const ketua = _siswaList.filter(s => s.is_ketua_kelas);
    document.getElementById('stat-total').textContent = _siswaList.length;
    document.getElementById('stat-aktif').textContent = aktif.length;
    document.getElementById('stat-ketua').textContent = ketua.length;

    renderSiswaTable(_siswaList);
  } catch (err) {
    document.getElementById('siswa-table-wrap').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`;
  }
}

function filterSiswa() {
  const search = document.getElementById('siswa-search')?.value.toLowerCase() || '';
  const kelasId = document.getElementById('siswa-kelas-filter')?.value || '';
  let filtered = _siswaList;
  if (search) filtered = filtered.filter(s => s.nama?.toLowerCase().includes(search) || s.nis?.includes(search));
  if (kelasId) filtered = filtered.filter(s => String(s.kelas_id) === kelasId);
  renderSiswaTable(filtered);
}

function renderSiswaTable(list) {
  const wrap = document.getElementById('siswa-table-wrap');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Tidak ada siswa</div><div class="empty-sub">Tambah siswa atau ubah filter</div></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${list.map((s, i) => `
          <tr>
            <td style="color:var(--text-muted)">${i+1}</td>
            <td>
              <div style="font-weight:600;color:var(--text);font-size:13px">${s.nama}</div>
              <div style="font-size:11px;color:var(--text-3)">${s.email}</div>
              ${s.is_ketua_kelas ? '<span class="badge-tag badge-yellow" style="font-size:9px;margin-top:2px"><i class="fas fa-crown"></i> Ketua</span>' : ''}
            </td>
            <td style="font-family:monospace;font-size:12px;color:var(--p300)">${s.nis}</td>
            <td style="font-size:12px">${s.kelas_nama || '—'}</td>
            <td>${s.is_active ? '<span class="badge-tag badge-green">Aktif</span>' : '<span class="badge-tag badge-gray">Nonaktif</span>'}</td>
            <td>
              <div style="display:flex;gap:6px">
                <button onclick="showEditSiswaModal(${s.id})" class="btn btn-sm btn-secondary" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="resetPasswordSiswa(${s.id},'${s.nama}')" class="btn btn-sm btn-secondary" title="Reset PW"><i class="fas fa-key"></i></button>
                <button onclick="toggleAktifSiswa(${s.id},${s.is_active},'${s.nama}')" class="btn btn-sm ${s.is_active?'btn-danger':'btn-success'}" title="${s.is_active?'Nonaktifkan':'Aktifkan'}">
                  <i class="fas ${s.is_active?'fa-ban':'fa-check'}"></i>
                </button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:10px 14px;font-size:11px;color:var(--text-muted);text-align:right">${list.length} siswa ditampilkan</div>`;
}

async function showTambahSiswaModal(kelasData) {
  const taId = store.getActiveTaId();
  let kelas = kelasData;
  if (!kelas) {
    const res = await api.kelas(taId).catch(() => ({ data: [] }));
    kelas = res.data;
  }
  openModal('Tambah Siswa Baru', `
    <div class="space-y-3">
      ${inputGroup('Nama Lengkap', textInput('ts-nama','text','Budi Santoso'))}
      ${inputGroup('Email', textInput('ts-email','email','siswa@sekolah.com'))}
      ${formRow(
        inputGroup('NIS', textInput('ts-nis','text','2026XXXXX')),
        inputGroup('Password', textInput('ts-pw','text','siswa123'))
      )}
      ${inputGroup('Kelas', `<select class="input" id="ts-kelas">
        <option value="">— Pilih Kelas —</option>
        ${kelas.map(k=>`<option value="${k.id}">${k.nama}</option>`).join('')}
      </select>`)}
    </div>`,
    { footer: modalFooter('Simpan', 'doTambahSiswa()') });
}

async function doTambahSiswa() {
  const nama = document.getElementById('ts-nama')?.value.trim();
  const email = document.getElementById('ts-email')?.value.trim();
  const nis = document.getElementById('ts-nis')?.value.trim();
  const pw = document.getElementById('ts-pw')?.value.trim();
  const kelasId = document.getElementById('ts-kelas')?.value;
  if (!nama||!email||!nis||!pw||!kelasId) { showToast('Semua field wajib diisi','error'); return; }
  try {
    await api.post('/siswa', { nama, email, nis, password: pw, kelas_id: kelasId, tahun_ajaran_id: store.getActiveTaId() });
    showToast('Siswa berhasil ditambahkan'); closeModal(); loadSiswaData();
  } catch(err) { showToast(err.message,'error'); }
}

async function showEditSiswaModal(id) {
  try {
    const [sRes, taId] = [await api.siswaDetail(id), store.getActiveTaId()];
    const s = sRes.data;
    const krRes = await api.kelas(taId);
    openModal('Edit Siswa', `
      <div class="space-y-3">
        ${inputGroup('Nama Lengkap', textInput('es-nama','text','',s.nama))}
        ${inputGroup('Email', textInput('es-email','email','',s.email))}
        ${formRow(
          inputGroup('NIS', textInput('es-nis','text','',s.nis)),
          inputGroup('Kelas', `<select class="input" id="es-kelas">
            ${krRes.data.map(k=>`<option value="${k.id}" ${k.id==s.kelas_id?'selected':''}>${k.nama}</option>`).join('')}
          </select>`)
        )}
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="es-ketua" ${s.is_ketua_kelas?'checked':''} />
          <span style="font-size:13px;color:var(--text-2)">Ketua Kelas</span>
        </label>
      </div>`,
      { footer: modalFooter('Simpan Perubahan', `doEditSiswa(${id})`) });
  } catch(err) { showToast(err.message,'error'); }
}

async function doEditSiswa(id) {
  const nama = document.getElementById('es-nama')?.value.trim();
  const email = document.getElementById('es-email')?.value.trim();
  const nis = document.getElementById('es-nis')?.value.trim();
  const kelasId = document.getElementById('es-kelas')?.value;
  const isKetua = document.getElementById('es-ketua')?.checked ? 1 : 0;
  if (!nama||!email||!nis||!kelasId) { showToast('Semua field wajib','error'); return; }
  try {
    await api.put(`/siswa/${id}`, { nama, email, nis, kelas_id: kelasId, is_ketua_kelas: isKetua });
    showToast('Siswa diperbarui'); closeModal(); loadSiswaData();
  } catch(err) { showToast(err.message,'error'); }
}

async function resetPasswordSiswa(id, nama) {
  openModal('Reset Password', `
    <div class="space-y-3">
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:32px;margin-bottom:8px">🔑</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:4px">${nama}</div>
      </div>
      ${inputGroup('Password Baru', textInput('rp-pw','text','siswa123'))}
    </div>`,
    { footer: modalFooter('Reset Password', `doResetPw('siswa',${id})`) });
}

async function doResetPw(tipe, id) {
  const pw = document.getElementById('rp-pw')?.value.trim();
  if (!pw||pw.length<4) { showToast('Password minimal 4 karakter','error'); return; }
  try {
    await api.put(`/${tipe}/${id}/reset-password`, { password: pw });
    showToast('Password berhasil direset'); closeModal();
  } catch(err) { showToast(err.message,'error'); }
}

async function toggleAktifSiswa(id, isAktif, nama) {
  const action = isAktif ? 'nonaktifkan' : 'aktifkan';
  confirmDialog(`${action.charAt(0).toUpperCase()+action.slice(1)} siswa <b>${nama}</b>?`, async () => {
    try {
      await api.put(`/siswa/${id}`, { is_active: isAktif ? 0 : 1 });
      showToast(`Siswa ${action}kan`); loadSiswaData();
    } catch(err) { showToast(err.message,'error'); }
  }, { icon: isAktif ? '🚫' : '✅', confirmText: action.charAt(0).toUpperCase()+action.slice(1), dangerClass: isAktif ? 'btn-danger' : 'btn-success' });
}

// =============================================
// GURU — CRUD
// =============================================
let _guruList = [];

async function renderGuruPage() {
  setPageTitle('Manajemen Guru');
  setContent(`
    <div class="page">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center" class="sticky-top">
        <div class="input-icon-wrap" style="flex:1">
          <i class="fas fa-search input-icon"></i>
          <input class="input" id="guru-search" placeholder="Cari nama / NIP..." style="padding-left:38px;font-size:13px;padding-top:9px;padding-bottom:9px" oninput="filterGuru()" />
        </div>
        <button onclick="showTambahGuruModal()" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Tambah</button>
      </div>
      <div id="guru-table-wrap">${skeletonTable(5)}</div>
    </div>`);
  await loadGuruData();
}

async function loadGuruData() {
  try {
    const res = await api.guru();
    _guruList = res.data || [];
    renderGuruTable(_guruList);
  } catch(err) {
    document.getElementById('guru-table-wrap').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`;
  }
}

function filterGuru() {
  const q = document.getElementById('guru-search')?.value.toLowerCase()||'';
  renderGuruTable(q ? _guruList.filter(g=>g.nama?.toLowerCase().includes(q)||g.nip?.toLowerCase().includes(q)) : _guruList);
}

function renderGuruTable(list) {
  const wrap = document.getElementById('guru-table-wrap');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">👨‍🏫</div><div class="empty-title">Tidak ada guru</div></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>#</th><th>Nama</th><th>NIP</th><th>Status</th><th>Wali Kelas</th><th>Aksi</th></tr></thead>
      <tbody>
        ${list.map((g,i)=>`<tr>
          <td style="color:var(--text-muted)">${i+1}</td>
          <td>
            <div style="font-weight:600;font-size:13px;color:var(--text)">${g.nama}</div>
            <div style="font-size:11px;color:var(--text-3)">${g.email}</div>
          </td>
          <td style="font-family:monospace;font-size:12px;color:var(--p300)">${g.nip||'<span style="color:var(--text-muted)">—</span>'}</td>
          <td>${g.is_active?'<span class="badge-tag badge-green">Aktif</span>':'<span class="badge-tag badge-gray">Nonaktif</span>'}</td>
          <td>${g.is_walas?`<span class="badge-tag badge-purple"><i class="fas fa-crown"></i> ${g.kelas_nama||'—'}</span>`:'<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
          <td><div style="display:flex;gap:6px">
            <button onclick="showEditGuruModal(${g.id})" class="btn btn-sm btn-secondary"><i class="fas fa-edit"></i></button>
            <button onclick="resetPasswordGuru(${g.user_id},'${g.nama}')" class="btn btn-sm btn-secondary"><i class="fas fa-key"></i></button>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table></div>
    <div style="padding:10px 14px;font-size:11px;color:var(--text-muted);text-align:right">${list.length} guru</div>`;
}

function showTambahGuruModal() {
  openModal('Tambah Guru Baru', `
    <div class="space-y-3">
      ${inputGroup('Nama Lengkap', textInput('tg-nama','text','Nama Guru'))}
      ${inputGroup('Email', textInput('tg-email','email','guru@sekolah.com'))}
      ${formRow(
        inputGroup('NIP', textInput('tg-nip','text','NIP000001')),
        inputGroup('Password', textInput('tg-pw','text','guru123'))
      )}
    </div>`,
    { footer: modalFooter('Simpan','doTambahGuru()') });
}

async function doTambahGuru() {
  const nama=document.getElementById('tg-nama')?.value.trim();
  const email=document.getElementById('tg-email')?.value.trim();
  const nip=document.getElementById('tg-nip')?.value.trim();
  const pw=document.getElementById('tg-pw')?.value.trim();
  if (!nama||!email||!pw) { showToast('Nama, email, dan password wajib','error'); return; }
  try {
    await api.post('/guru', { nama, email, nip, password: pw });
    showToast('Guru ditambahkan'); closeModal(); loadGuruData();
  } catch(err) { showToast(err.message,'error'); }
}

async function showEditGuruModal(guruId) {
  try {
    const res = await api.guruDetail(guruId);
    const g = res.data;
    openModal('Edit Guru', `
      <div class="space-y-3">
        ${inputGroup('Nama', textInput('eg-nama','text','',g.nama))}
        ${inputGroup('Email', textInput('eg-email','email','',g.email))}
        ${inputGroup('NIP', textInput('eg-nip','text','',g.nip||''))}
      </div>`,
      { footer: modalFooter('Simpan',`doEditGuru(${guruId})`) });
  } catch(err) { showToast(err.message,'error'); }
}

async function doEditGuru(id) {
  const nama=document.getElementById('eg-nama')?.value.trim();
  const email=document.getElementById('eg-email')?.value.trim();
  const nip=document.getElementById('eg-nip')?.value.trim();
  if(!nama||!email) { showToast('Nama dan email wajib','error'); return; }
  try {
    await api.put(`/guru/${id}`, { nama, email, nip });
    showToast('Guru diperbarui'); closeModal(); loadGuruData();
  } catch(err) { showToast(err.message,'error'); }
}

async function resetPasswordGuru(userId, nama) {
  openModal('Reset Password Guru', `
    <div class="space-y-3">
      <div style="text-align:center;padding:8px 0"><div style="font-size:28px">🔑</div><div style="font-weight:600;margin-top:6px">${nama}</div></div>
      ${inputGroup('Password Baru', textInput('rp-pw','text','guru123'))}
    </div>`,
    { footer: modalFooter('Reset','doResetPwGuru('+userId+')') });
}
async function doResetPwGuru(userId) {
  const pw=document.getElementById('rp-pw')?.value.trim();
  if(!pw||pw.length<4) { showToast('Min. 4 karakter','error'); return; }
  try {
    await api.put(`/guru/user/${userId}/reset-password`, { password: pw });
    showToast('Password direset'); closeModal();
  } catch(err) { showToast(err.message,'error'); }
}

// =============================================
// KELAS
// =============================================
async function renderKelasPage() {
  setPageTitle('Manajemen Kelas');
  const taId = store.getActiveTaId();
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const [krRes, jrRes] = await Promise.all([api.kelas(taId), api.get('/jurusan')]);
    const kelas = krRes.data || [];
    // Group by jurusan
    const byJurusan = {};
    kelas.forEach(k => {
      const key = k.jurusan_nama || k.nama.split(' ')[1] || 'Lain';
      if (!byJurusan[key]) byJurusan[key] = [];
      byJurusan[key].push(k);
    });

    setContent(`
      <div class="p-page space-y-4 page">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:13px;color:var(--text-3)">${kelas.length} kelas ditemukan</div>
        </div>
        ${Object.entries(byJurusan).map(([jur, list]) => `
        <div>
          <div class="section-header"><div class="section-title">${jur}</div></div>
          <div class="card">
            <div class="divide-y">
              ${list.map(k => `
              <div class="list-item">
                <div style="width:44px;height:44px;border-radius:13px;background:rgba(139,92,246,0.15);color:var(--p400);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;flex-shrink:0">${k.tingkat}</div>
                <div class="list-content">
                  <div class="list-title">${k.nama}</div>
                  <div class="list-sub">Walas: ${k.walas_nama||'—'} · Batas: ${k.batas_kehadiran||75}%</div>
                </div>
                <button onclick="showEditBatasKelas(${k.id},'${k.nama}',${k.batas_kehadiran||75})" class="btn btn-ghost btn-sm" style="font-size:11px">
                  <i class="fas fa-percent"></i>
                </button>
              </div>`).join('')}
            </div>
          </div>
        </div>`).join('')}
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

function showEditBatasKelas(kelasId, namaKelas, currentBatas) {
  openModal(`Batas Kehadiran — ${namaKelas}`, `
    <div class="space-y-3">
      <div style="background:var(--surface-3);border-radius:12px;padding:16px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:2.5rem;color:var(--p400)" id="batas-display">${currentBatas}%</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:4px">Kehadiran minimum wajib</div>
      </div>
      <input type="range" id="batas-slider" min="50" max="100" step="5" value="${currentBatas}"
        style="width:100%;accent-color:var(--p600)"
        oninput="document.getElementById('batas-display').textContent=this.value+'%'" />
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)"><span>50%</span><span>75%</span><span>100%</span></div>
    </div>`,
    { footer: modalFooter('Simpan Batas', `doSaveBatas(${kelasId})`) });
}

async function doSaveBatas(kelasId) {
  const batas = parseInt(document.getElementById('batas-slider')?.value);
  try {
    await api.put(`/kelas/${kelasId}/batas-kehadiran`, { batas });
    showToast(`Batas kehadiran diset ${batas}%`); closeModal(); renderKelasPage();
  } catch(err) { showToast(err.message,'error'); }
}

// =============================================
// MAPEL
// =============================================
async function renderMapelPage() {
  setPageTitle('Mata Pelajaran');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const res = await api.get('/mapel');
    const list = res.data || [];
    setContent(`
      <div class="p-page space-y-4 page">
        <div style="display:flex;justify-content:flex-end">
          <button onclick="showTambahMapelModal()" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Tambah Mapel</button>
        </div>
        <div class="card">
          <div class="divide-y">
            ${list.map(m => `
            <div class="list-item">
              <div style="width:44px;height:44px;border-radius:13px;background:rgba(59,130,246,0.15);color:var(--blue);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;flex-shrink:0">${m.kode}</div>
              <div class="list-content"><div class="list-title">${m.nama}</div><div class="list-sub">Kode: ${m.kode}</div></div>
              <button onclick="showEditMapelModal(${m.id},'${m.kode}','${m.nama}')" class="btn btn-ghost btn-sm"><i class="fas fa-edit"></i></button>
            </div>`).join('') || `<div class="empty-state" style="padding:24px"><div class="empty-icon">📚</div><div class="empty-sub">Belum ada mata pelajaran</div></div>`}
          </div>
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

function showTambahMapelModal() {
  openModal('Tambah Mata Pelajaran', `
    <div class="space-y-3">
      ${inputGroup('Kode (maks 10 huruf)', textInput('tm-kode','text','MAT'))}
      ${inputGroup('Nama Mata Pelajaran', textInput('tm-nama','text','Matematika'))}
    </div>`,
    { footer: modalFooter('Tambah','doTambahMapel()') });
}
async function doTambahMapel() {
  const kode=document.getElementById('tm-kode')?.value.trim().toUpperCase();
  const nama=document.getElementById('tm-nama')?.value.trim();
  if(!kode||!nama) { showToast('Kode dan nama wajib','error'); return; }
  try {
    await api.post('/mapel', { kode, nama });
    showToast('Mapel ditambahkan'); closeModal(); renderMapelPage();
  } catch(err) { showToast(err.message,'error'); }
}
function showEditMapelModal(id, kode, nama) {
  openModal('Edit Mata Pelajaran', `
    <div class="space-y-3">
      ${inputGroup('Kode', textInput('em-kode','text','',kode))}
      ${inputGroup('Nama', textInput('em-nama','text','',nama))}
    </div>`,
    { footer: modalFooter('Simpan',`doEditMapel(${id})`) });
}
async function doEditMapel(id) {
  const kode=document.getElementById('em-kode')?.value.trim().toUpperCase();
  const nama=document.getElementById('em-nama')?.value.trim();
  if(!kode||!nama) { showToast('Kode dan nama wajib','error'); return; }
  try {
    await api.put(`/mapel/${id}`, { kode, nama });
    showToast('Mapel diperbarui'); closeModal(); renderMapelPage();
  } catch(err) { showToast(err.message,'error'); }
}

// =============================================
// JADWAL
// =============================================
async function renderJadwalPage() {
  setPageTitle('Jadwal Mengajar');
  const taId = store.getActiveTaId();
  const user = store.get('user');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    let params = `tahun_ajaran_id=${taId}`;
    if (user?.role === 'guru') params += `&guru_id=${user.guru_id}`;
    const res = await api.jadwal(taId, user?.role==='guru'?`&guru_user_id=${user.id}`:'');
    const list = res.data || [];

    // Group by hari
    const hariOrder = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const byHari = {};
    list.forEach(j => {
      if (!byHari[j.hari]) byHari[j.hari] = [];
      byHari[j.hari].push(j);
    });

    setContent(`
      <div class="p-page space-y-4 page">
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;display:flex;align-items:center;gap:10px">
          <i class="fas fa-info-circle" style="color:var(--p400)"></i>
          <span style="font-size:12px;color:var(--text-3)">${list.length} jadwal · Jadwal dapat diinput melalui panel admin desktop</span>
        </div>
        ${hariOrder.filter(h=>byHari[h]).map(hari => `
        <div>
          <div class="section-header"><div class="section-title">${hari}</div><span class="badge-tag badge-purple">${byHari[hari].length} jadwal</span></div>
          <div class="card">
            <div class="divide-y">
              ${byHari[hari].sort((a,b)=>a.jam_mulai>b.jam_mulai?1:-1).map(j=>`
              <div class="list-item">
                <div style="width:52px;text-align:center;flex-shrink:0">
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--p300)">${(j.jam_mulai||'').slice(0,5)}</div>
                  <div style="font-size:9px;color:var(--text-muted)">${(j.jam_selesai||'').slice(0,5)}</div>
                </div>
                <div class="list-content">
                  <div class="list-title">${j.mapel_naam||j.mapel_nama||j.mapel||'—'}</div>
                  <div class="list-sub">${j.kelas_nama||j.kelas||'—'} · ${j.guru_nama||'—'}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">
                  <span class="badge-tag ${j.tipe_sesi==='praktek'?'badge-blue':'badge-purple'}" style="font-size:9px">${j.tipe_sesi||'teori'}</span>
                  ${j.pola_minggu&&j.pola_minggu!=='semua'?`<span class="badge-tag badge-gray" style="font-size:9px">${j.pola_minggu}</span>`:''}
                </div>
              </div>`).join('')}
            </div>
          </div>
        </div>`).join('') || `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Belum ada jadwal</div><div class="empty-sub">Tambah jadwal melalui panel admin</div></div>`}
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

// =============================================
// SEMESTER
// =============================================
async function renderSemesterPage() {
  setPageTitle('Tahun Ajaran');
  setContent(`<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner" style="width:28px;height:28px"></div></div>`);
  try {
    const res = await api.semesters();
    const list = res.data || [];
    setContent(`
      <div class="p-page space-y-4 page">
        <div class="card">
          <div class="divide-y">
            ${list.map(s => `
            <div class="list-item">
              <div style="width:44px;height:44px;border-radius:13px;${s.is_active?'background:var(--p700);':'background:var(--surface-3);'}color:white;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
                ${s.is_active?'🔵':'⚪'}
              </div>
              <div class="list-content">
                <div class="list-title">${s.nama} <span class="badge-tag ${s.semester==='ganjil'?'badge-blue':'badge-green'}" style="font-size:9px">${s.semester}</span></div>
                <div class="list-sub">${String(s.start_date).slice(0,10)} s/d ${String(s.end_date).slice(0,10)}</div>
              </div>
              ${s.is_active
                ? `<span class="badge-tag badge-green"><i class="fas fa-check-circle"></i> Aktif</span>`
                : `<button onclick="doAktifkanSemester(${s.id},'${s.nama} ${s.semester}')" class="btn btn-sm btn-secondary">Aktifkan</button>`
              }
            </div>`).join('')}
          </div>
        </div>
        <div style="background:var(--yellow-bg);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius);padding:12px 14px;font-size:12px;color:var(--yellow)">
          <i class="fas fa-exclamation-triangle"></i> Mengaktifkan semester akan mempengaruhi tampilan data seluruh pengguna.
        </div>
      </div>`);
  } catch(err) { setContent(`<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`); }
}

async function doAktifkanSemester(id, nama) {
  confirmDialog(`Aktifkan tahun ajaran <b>${nama}</b>?`, async () => {
    try {
      await api.semesterActivate(id);
      store.set('activeSemesterId', String(id));
      store.set('selectedSemesterId', String(id));
      showToast(`Semester ${nama} diaktifkan`);
      renderSemesterPage();
    } catch(err) { showToast(err.message,'error'); }
  }, { icon:'📅', confirmText:'Aktifkan', dangerClass:'btn-primary' });
}

// =============================================
// REKAP / LAPORAN
// =============================================
async function renderRekapPage() {
  setPageTitle('Rekap Kehadiran');
  const taId = store.getActiveTaId();
  const user = store.get('user');
  const today = new Date().toISOString().slice(0,10);
  const krRes = await api.kelas(taId).catch(()=>({data:[]}));

  setContent(`
    <div class="page">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px;flex-wrap:wrap" class="sticky-top">
        ${user?.role !== 'siswa' ? `
        <select class="input" id="rekap-kelas" style="flex:1;font-size:13px;padding:9px 10px" onchange="loadRekap()">
          <option value="">— Semua Kelas —</option>
          ${krRes.data.map(k=>`<option value="${k.id}">${k.nama}</option>`).join('')}
        </select>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input type="date" id="rekap-dari" class="input" value="${today.slice(0,8)}01" style="font-size:12px;padding:9px 10px" onchange="loadRekap()" />
          <input type="date" id="rekap-sampai" class="input" value="${today}" style="font-size:12px;padding:9px 10px" onchange="loadRekap()" />
        </div>
        <button onclick="exportRekap()" class="btn btn-success btn-sm"><i class="fas fa-file-excel"></i> Export</button>
      </div>
      <div id="rekap-content">
        <div class="empty-state"><div class="empty-icon">📊</div><div class="empty-sub">Pilih kelas dan tanggal, lalu data akan muncul</div></div>
      </div>
    </div>`);

  loadRekap();
}

async function loadRekap() {
  const kelasId = document.getElementById('rekap-kelas')?.value || '';
  const dari    = document.getElementById('rekap-dari')?.value || '';
  const sampai  = document.getElementById('rekap-sampai')?.value || '';
  const taId    = store.getActiveTaId();
  const div     = document.getElementById('rekap-content');
  if (!div) return;
  div.innerHTML = `<div style="display:flex;justify-content:center;padding:40px"><div class="loading-spinner"></div></div>`;

  try {
    const params = new URLSearchParams({ tahun_ajaran_id: taId });
    if (kelasId) params.append('kelas_id', kelasId);
    if (dari) params.append('dari', dari);
    if (sampai) params.append('sampai', sampai);
    const res = await api.absensiHarianRekap(params.toString());
    const list = res.data || [];

    if (!list.length) {
      div.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-sub">Tidak ada data untuk filter ini</div></div>`;
      return;
    }

    div.innerHTML = `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>#</th><th>Nama</th><th>Kelas</th>
            <th style="color:var(--green)">H</th>
            <th style="color:var(--blue)">S</th>
            <th style="color:var(--yellow)">I</th>
            <th style="color:var(--red)">A</th>
            <th>%</th>
          </tr></thead>
          <tbody>
            ${list.map((r,i) => {
              const total = (r.hadir||0)+(r.sakit||0)+(r.izin||0)+(r.alpha||0);
              const pct = total ? Math.round((r.hadir||0)/total*100) : 0;
              const c = pct>=75?'var(--green)':pct>=60?'var(--yellow)':'var(--red)';
              return `<tr>
                <td style="color:var(--text-muted)">${i+1}</td>
                <td style="font-weight:600;font-size:13px;color:var(--text)">${r.nama}</td>
                <td style="font-size:12px;color:var(--text-3)">${r.kelas_nama||'—'}</td>
                <td style="color:var(--green);font-weight:700">${r.hadir||0}</td>
                <td style="color:var(--blue)">${r.sakit||0}</td>
                <td style="color:var(--yellow)">${r.izin||0}</td>
                <td style="color:var(--red);font-weight:700">${r.alpha||0}</td>
                <td style="font-weight:700;color:${c}">${pct}%</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:10px 14px;font-size:11px;color:var(--text-muted);text-align:right">${list.length} siswa</div>`;
  } catch(err) {
    div.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`;
  }
}

function exportRekap() {
  const kelasId = document.getElementById('rekap-kelas')?.value || '';
  const dari    = document.getElementById('rekap-dari')?.value || '';
  const sampai  = document.getElementById('rekap-sampai')?.value || '';
  const taId    = store.getActiveTaId();
  const params  = new URLSearchParams({ tahun_ajaran_id: taId });
  if (kelasId) params.append('kelas_id', kelasId);
  if (dari) params.append('dari', dari);
  if (sampai) params.append('sampai', sampai);
  api.exportExcel(params.toString());
  showToast('Mengunduh Excel...','info');
}

// =============================================
// LOGS — Audit Trail
// =============================================
async function renderLogsPage() {
  setPageTitle('Audit Trail');
  const today = new Date().toISOString().slice(0,10);
  setContent(`
    <div class="page">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px;flex-wrap:wrap" class="sticky-top">
        <input class="input" id="log-action" placeholder="Filter aksi..." style="flex:1;font-size:13px;padding:9px 10px" oninput="debounceLoadLogs()" />
        <input type="date" id="log-date" class="input" value="${today}" style="width:130px;font-size:13px;padding:9px 10px" onchange="loadLogs()" />
        <button onclick="loadLogs()" class="btn btn-primary btn-sm"><i class="fas fa-search"></i></button>
      </div>
      <div id="logs-content">${skeletonTable(4)}</div>
    </div>`);
  loadLogs();
}

let _logDebounce;
function debounceLoadLogs() { clearTimeout(_logDebounce); _logDebounce = setTimeout(loadLogs, 400); }

async function loadLogs() {
  const action = document.getElementById('log-action')?.value.trim()||'';
  const date   = document.getElementById('log-date')?.value||'';
  const div    = document.getElementById('logs-content');
  if (!div) return;
  try {
    const params = new URLSearchParams({ limit: 200 });
    if (action) params.append('action', action);
    if (date)   params.append('tanggal', date);
    const res = await api.logs(params.toString());
    const list = res.data || [];

    const actionColor = a => {
      a = a||'';
      if (a.includes('LOGIN')) return 'badge-green';
      if (a.includes('DELETE')||a.includes('REJECT')) return 'badge-red';
      if (a.includes('ADD')||a.includes('CREATE')||a.includes('APPROVED')) return 'badge-blue';
      if (a.includes('UPDATE')||a.includes('SET')||a.includes('EDIT')) return 'badge-yellow';
      return 'badge-purple';
    };

    if (!list.length) {
      div.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-sub">Tidak ada log</div></div>`;
      return;
    }
    div.innerHTML = `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Detail</th></tr></thead>
          <tbody>
            ${list.map(l=>{
              const dt = new Date(l.created_at);
              return `<tr>
                <td style="white-space:nowrap;font-size:11px;color:var(--text-muted)">
                  ${dt.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}<br>
                  <span style="font-family:monospace">${dt.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
                </td>
                <td>
                  <div style="font-size:12px;font-weight:600;color:var(--text)">${l.nama||'—'}</div>
                  <span class="badge-tag ${l.role==='admin'?'badge-purple':l.role==='guru'?'badge-blue':'badge-gray'}" style="font-size:9px">${l.role||'—'}</span>
                </td>
                <td><span class="badge-tag ${actionColor(l.action)}" style="font-size:10px;white-space:nowrap">${l.action}</span></td>
                <td style="font-size:11px;color:var(--text-3);max-width:180px;overflow:hidden;text-overflow:ellipsis">${l.detail||'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:10px 14px;font-size:11px;color:var(--text-muted);text-align:right">${list.length} log terakhir</div>`;
  } catch(err) {
    div.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-sub">${err.message}</div></div>`;
  }
}

// =============================================
// EXPORT EXCEL
// =============================================
async function renderExportPage() {
  setPageTitle('Export Data');
  const taId = store.getActiveTaId();
  const krRes = await api.kelas(taId).catch(()=>({data:[]}));
  const today = new Date().toISOString().slice(0,10);
  const firstDay = today.slice(0,8)+'01';

  setContent(`
    <div class="p-page space-y-4 page">
      <div class="card">
        <div class="card-header"><div class="card-title">📥 Export Rekap Absensi</div></div>
        <div class="card-body space-y-3">
          ${inputGroup('Kelas', `<select class="input" id="exp-kelas">
            <option value="">Semua Kelas</option>
            ${krRes.data.map(k=>`<option value="${k.id}">${k.nama}</option>`).join('')}
          </select>`)}
          ${formRow(
            inputGroup('Dari Tanggal', textInput('exp-dari','date','',firstDay)),
            inputGroup('Sampai Tanggal', textInput('exp-sampai','date','',today))
          )}
          <button onclick="doExport()" class="btn btn-success btn-full btn-lg">
            <i class="fas fa-file-excel"></i> Download Excel
          </button>
        </div>
      </div>

      <div class="card" style="border-color:rgba(16,185,129,0.25)">
        <div class="card-body">
          <div style="font-size:12px;color:var(--text-2);font-weight:600;margin-bottom:8px">📋 Isi file Excel:</div>
          <div style="font-size:12px;color:var(--text-3);line-height:1.8">
            • Daftar hadir per siswa (Hadir / Sakit / Izin / Alpha)<br>
            • Persentase kehadiran setiap siswa<br>
            • Dikelompokkan per kelas<br>
            • Tanggal sesuai rentang yang dipilih
          </div>
        </div>
      </div>
    </div>`);
}

function doExport() {
  const kelasId = document.getElementById('exp-kelas')?.value||'';
  const dari    = document.getElementById('exp-dari')?.value||'';
  const sampai  = document.getElementById('exp-sampai')?.value||'';
  const taId    = store.getActiveTaId();
  const params  = new URLSearchParams({ tahun_ajaran_id: taId });
  if (kelasId) params.append('kelas_id', kelasId);
  if (dari) params.append('dari', dari);
  if (sampai) params.append('sampai', sampai);
  api.exportExcel(params.toString());
  showToast('Mengunduh file Excel...','success');
}

// =============================================
// BATAS KEHADIRAN (shortcut dari menu)
// =============================================
async function renderBatasPage() {
  setPageTitle('Batas Kehadiran');
  return renderKelasPage(); // Sama dengan halaman kelas, sudah ada fitur batas
}
