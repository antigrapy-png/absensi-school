// =============================================
// Kalender Akademik Page
// =============================================
async function renderKalender() {
  setPageTitle('Kalender Akademik');
  setContent(`
    <div class="p-page space-y-4 page">
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">
        <button class="chip active" id="chip-semua" onclick="filterKalender('semua',this)">Semua</button>
        <button class="chip" id="chip-libur" onclick="filterKalender('libur',this)">🔴 Hari Libur</button>
        <button class="chip" id="chip-event" onclick="filterKalender('event',this)">🟢 Event</button>
        <button class="chip" id="chip-ujian" onclick="filterKalender('ujian',this)">📝 Ujian</button>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="kalender-widget" data-calendar></div>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title">Tanggal Ditandai</div>
        ${store.get('user')?.role === 'admin' ? `<button class="btn btn-primary btn-sm" onclick="showTambahTanggalModal()"><i class="fas fa-plus"></i> Tambah</button>` : ''}
      </div>

      <div id="kalender-list" class="card"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-sub">Memuat kalender...</div></div></div>

      <div class="card" style="padding:14px 16px">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Keterangan</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12px">
          <span><span style="color:var(--green)">●</span> Hadir data</span>
          <span><span style="color:var(--red)">●</span> Hari libur (tidak dihitung absen)</span>
          <span style="background:var(--p700);color:white;padding:1px 6px;border-radius:6px">Hari ini</span>
        </div>
      </div>
    </div>`);

  await loadKalender();
}

let _kalenderData = [];
let _kalenderFilter = 'semua';

async function loadKalender() {
  try {
    const taId = store.getActiveTaId();
    const res = await api.kalender(taId);
    _kalenderData = res.data || [];

    const marked = {};
    _kalenderData.forEach(k => {
      const d = String(k.tanggal).slice(0,10);
      marked[d] = { type: k.jenis, label: k.nama };
    });

    Calendar.setMarked(marked);
    Calendar.onSelect((dateStr, mark) => {
      if (mark) {
        showToast(`${dateStr}: ${mark.label}`, 'info');
      }
    });
    Calendar.render('kalender-widget');
    renderKalenderList(_kalenderData);
  } catch(err) { showToast(err.message, 'error'); }
}

function filterKalender(type, el) {
  _kalenderFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const filtered = type === 'semua' ? _kalenderData : _kalenderData.filter(k => k.jenis === type);
  renderKalenderList(filtered);
}

function renderKalenderList(items) {
  const list = document.getElementById('kalender-list');
  if (!list) return;
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Belum ada tanggal</div><div class="empty-sub">Tambah hari libur atau event sekolah</div></div>`;
    return;
  }

  const jenisIcon = { libur:'🔴', event:'🟢', ujian:'📝', kegiatan:'📌' };
  const jenisColor = { libur:'badge-red', event:'badge-green', ujian:'badge-purple', kegiatan:'badge-blue' };

  list.innerHTML = `<div class="divide-y">${items.sort((a,b) => a.tanggal > b.tanggal ? 1 : -1).map(k => {
    const tgl = new Date(k.tanggal);
    const day = tgl.toLocaleDateString('id-ID', { weekday:'short', day:'2-digit', month:'short' });
    return `
      <div class="list-item">
        <div style="width:42px;height:42px;border-radius:13px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">
          ${jenisIcon[k.jenis] || '📌'}
        </div>
        <div class="list-content">
          <div class="list-title">${k.nama}</div>
          <div class="list-sub">${day} · <span class="badge-tag ${jenisColor[k.jenis]||'badge-gray'}">${k.jenis}</span></div>
        </div>
        ${store.get('user')?.role === 'admin' ? `
        <button onclick="deleteKalender(${k.id})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:6px">
          <i class="fas fa-trash-alt" style="font-size:14px"></i>
        </button>` : ''}
      </div>`;
  }).join('')}</div>`;
}

function showTambahTanggalModal() {
  const today = new Date().toISOString().slice(0,10);
  openModal('Tambah Tanggal Kalender', `
    <div class="space-y-3">
      ${inputGroup('Nama / Keterangan', textInput('kal_nama','text','Libur Idul Fitri, Ujian Tengah Semester...'))}
      ${inputGroup('Tanggal', textInput('kal_tgl','date','', today))}
      ${inputGroup('Jenis', selectInput('kal_jenis', [
        { value:'libur',    label:'🔴 Hari Libur (tidak dihitung absen)' },
        { value:'ujian',    label:'📝 Ujian' },
        { value:'event',    label:'🟢 Event Sekolah' },
        { value:'kegiatan', label:'📌 Kegiatan Lain' },
      ], 'libur'))}
      <div style="background:var(--yellow-bg);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--yellow)">
        <i class="fas fa-info-circle"></i> Hari libur tidak dihitung sebagai alpha secara otomatis.
      </div>
    </div>`,
    { footer: modalFooter('Tambah Tanggal', 'doTambahKalender()') });
}

async function doTambahKalender() {
  const nama  = document.getElementById('kal_nama')?.value.trim();
  const tgl   = document.getElementById('kal_tgl')?.value;
  const jenis = document.getElementById('kal_jenis')?.value;
  if (!nama || !tgl) { showToast('Nama dan tanggal wajib diisi', 'error'); return; }
  try {
    await api.kalenderAdd({ nama, tanggal: tgl, jenis, tahun_ajaran_id: store.getActiveTaId() });
    showToast('Tanggal ditambahkan'); closeModal(); loadKalender();
  } catch(err) { showToast(err.message, 'error'); }
}

async function deleteKalender(id) {
  try {
    await api.kalenderDelete(id);
    showToast('Dihapus'); loadKalender();
  } catch(err) { showToast(err.message, 'error'); }
}
