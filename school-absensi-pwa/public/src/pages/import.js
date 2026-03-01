// =============================================
// Import Siswa via Excel
// =============================================
let _importData = [];
let _importErrors = [];

async function renderImport() {
  setPageTitle('Import Siswa');
  const krRes = await api.kelas(store.getActiveTaId());

  setContent(`
    <div class="p-page space-y-4 page">
      <!-- Step indicator -->
      <div style="display:flex;align-items:center;gap:0" id="import-steps">
        ${['Upload File','Preview','Import'].map((s,i) => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div id="step-circle-${i}" style="width:28px;height:28px;border-radius:50%;${i===0?'background:var(--p700);color:white':'background:var(--surface-3);color:var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid ${i===0?'var(--p600)':'var(--border)'};">${i+1}</div>
            <span style="font-size:10px;color:${i===0?'var(--p400)':'var(--text-muted)'};font-weight:600">${s}</span>
          </div>
          ${i<2?'<div style="flex:none;width:40px;height:2px;background:var(--border);margin-bottom:14px"></div>':''}`
        ).join('')}
      </div>

      <!-- Step 1: Upload -->
      <div id="import-step-1">
        <div class="card-glass" style="padding:0">
          <div style="padding:16px 18px;border-bottom:1px solid var(--border)">
            <div class="card-title">Pilih Kelas Tujuan</div>
          </div>
          <div style="padding:16px 18px">
            ${inputGroup('Kelas', selectInput('import-kelas',
              [{value:'', label:'— Pilih Kelas —'}, ...krRes.data.map(k => ({ value: k.id, label: k.nama }))],
              ''))}
          </div>
        </div>

        <div class="card-glass" style="margin-top:12px">
          <div class="card-body">
            <div class="dropzone" id="dropzone" onclick="document.getElementById('file-input').click()">
              <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleFileSelect(event)" />
              <div class="dropzone-icon"><i class="fas fa-file-excel"></i></div>
              <div class="dropzone-text">Ketuk atau seret file Excel / CSV</div>
              <div class="dropzone-hint">.xlsx, .xls, .csv · Maks 5MB</div>
            </div>

            <div style="margin-top:16px;padding:14px;background:var(--surface-3);border-radius:var(--radius-sm)">
              <div style="font-size:12px;font-weight:700;color:var(--text-2);margin-bottom:8px">📋 Format Kolom yang Diperlukan:</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:var(--text-3)">
                <div>• <strong>nama</strong> — Nama lengkap</div>
                <div>• <strong>email</strong> — Email siswa</div>
                <div>• <strong>nis</strong> — Nomor Induk Siswa</div>
                <div>• <strong>password</strong> — (opsional)</div>
              </div>
              <button onclick="downloadTemplate()" style="margin-top:10px;background:none;border:none;color:var(--p400);font-size:12px;font-weight:600;cursor:pointer;padding:0">
                <i class="fas fa-download"></i> Download Template Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Preview (hidden) -->
      <div id="import-step-2" class="hidden">
        <div class="card">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div class="card-title" id="preview-title">Preview Data</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px" id="preview-sub"></div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="resetImport()"><i class="fas fa-redo"></i> Ulang</button>
          </div>
          <div id="preview-errors" class="hidden" style="padding:12px 16px;background:var(--red-bg);border-bottom:1px solid rgba(239,68,68,0.2)">
            <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px"><i class="fas fa-exclamation-triangle"></i> Ada Baris Bermasalah:</div>
            <div id="error-list" style="font-size:11px;color:var(--red)"></div>
          </div>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead><tr>
                <th>#</th><th>Nama</th><th>Email</th><th>NIS</th><th>Status</th>
              </tr></thead>
              <tbody id="preview-tbody"></tbody>
            </table>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:12px">
          <button class="btn btn-secondary btn-full" onclick="resetImport()">Batal</button>
          <button class="btn btn-primary btn-full" id="do-import-btn" onclick="doImport()">
            <i class="fas fa-upload"></i> Import Sekarang
          </button>
        </div>
      </div>

      <!-- Step 3: Result (hidden) -->
      <div id="import-step-3" class="hidden">
        <div class="card-glass" style="padding:32px 20px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px" id="result-icon">✅</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;margin-bottom:6px" id="result-title">Berhasil!</div>
          <div style="font-size:13px;color:var(--text-3)" id="result-sub"></div>
          <button class="btn btn-primary" style="margin-top:20px" onclick="resetImport()">Import Lagi</button>
        </div>
      </div>
    </div>`);

  // Drag and drop
  const dz = document.getElementById('dropzone');
  if (dz) {
    dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
    dz.addEventListener('drop',      e  => { e.preventDefault(); dz.classList.remove('drag-over'); handleFileSelect({ target: { files: e.dataTransfer.files } }); });
  }
}

function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar (maks 5MB)', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      processImportData(rows);
    } catch(err) { showToast('Gagal membaca file: ' + err.message, 'error'); }
  };
  reader.readAsBinaryString(file);
}

function processImportData(rows) {
  _importData = []; _importErrors = [];

  rows.forEach((row, i) => {
    const nama  = String(row.nama || row.Nama || row.NAMA || '').trim();
    const email = String(row.email || row.Email || row.EMAIL || '').trim();
    const nis   = String(row.nis || row.NIS || row.Nis || '').trim();
    const pass  = String(row.password || row.Password || '').trim();
    const errors = [];

    if (!nama)  errors.push('nama kosong');
    if (!email || !email.includes('@')) errors.push('email tidak valid');
    if (!nis)   errors.push('NIS kosong');

    _importData.push({ nama, email, nis, password: pass || 'siswa123', errors, rowNum: i + 2 });
    if (errors.length) _importErrors.push({ rowNum: i + 2, nama, errors });
  });

  renderPreview();
}

function renderPreview() {
  document.getElementById('import-step-1').classList.add('hidden');
  document.getElementById('import-step-2').classList.remove('hidden');
  setImportStep(2);

  const valid = _importData.filter(r => !r.errors.length);
  const invalid = _importData.filter(r => r.errors.length);
  document.getElementById('preview-title').textContent = `Preview (${_importData.length} baris)`;
  document.getElementById('preview-sub').textContent = `${valid.length} valid · ${invalid.length} bermasalah`;

  if (invalid.length) {
    document.getElementById('preview-errors').classList.remove('hidden');
    document.getElementById('error-list').innerHTML = _importErrors.slice(0,5).map(e =>
      `<div>Baris ${e.rowNum}: <b>${e.nama||'—'}</b> — ${e.errors.join(', ')}</div>`
    ).join('') + (invalid.length > 5 ? `<div>...dan ${invalid.length - 5} baris lainnya</div>` : '');
  }

  document.getElementById('preview-tbody').innerHTML = _importData.map((r, i) => `
    <tr style="${r.errors.length ? 'opacity:0.5' : ''}">
      <td style="color:var(--text-muted)">${i+1}</td>
      <td style="color:var(--text)">${r.nama || '<i style="color:var(--red)">—</i>'}</td>
      <td style="font-size:11px;color:var(--text-3)">${r.email || '<i style="color:var(--red)">—</i>'}</td>
      <td style="font-family:monospace;font-size:11px">${r.nis || '<i style="color:var(--red)">—</i>'}</td>
      <td>${r.errors.length
        ? `<span class="badge-tag badge-red"><i class="fas fa-times"></i> ${r.errors[0]}</span>`
        : `<span class="badge-tag badge-green"><i class="fas fa-check"></i> OK</span>`}</td>
    </tr>`).join('');

  const importBtn = document.getElementById('do-import-btn');
  if (importBtn) {
    const validCount = _importData.filter(r => !r.errors.length).length;
    importBtn.textContent = `Import ${validCount} Siswa Valid`;
    importBtn.disabled = validCount === 0;
  }
}

async function doImport() {
  const kelasId = document.getElementById('import-kelas')?.value;
  if (!kelasId) { showToast('Pilih kelas tujuan dulu', 'error'); return; }

  const validData = _importData.filter(r => !r.errors.length).map(r => ({
    nama: r.nama, email: r.email, nis: r.nis, password: r.password,
    kelas_id: kelasId, tahun_ajaran_id: store.getActiveTaId()
  }));

  if (!validData.length) { showToast('Tidak ada data valid untuk diimport', 'error'); return; }

  const btn = document.getElementById('do-import-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengimport...'; }

  try {
    const res = await api.siswaBulk({ data: validData });
    showImportResult(true, res);
  } catch(err) {
    showImportResult(false, null, err.message);
  }
}

function showImportResult(success, res, errMsg) {
  document.getElementById('import-step-2').classList.add('hidden');
  document.getElementById('import-step-3').classList.remove('hidden');
  setImportStep(3);
  document.getElementById('result-icon').textContent = success ? '✅' : '❌';
  document.getElementById('result-title').textContent = success ? 'Import Berhasil!' : 'Import Gagal';
  document.getElementById('result-sub').textContent = success
    ? `${res?.data?.inserted || validData?.length || 0} siswa berhasil ditambahkan ke sistem.`
    : (errMsg || 'Terjadi kesalahan saat import.');
}

function resetImport() {
  _importData = []; _importErrors = [];
  document.getElementById('import-step-2')?.classList.add('hidden');
  document.getElementById('import-step-3')?.classList.add('hidden');
  document.getElementById('import-step-1')?.classList.remove('hidden');
  setImportStep(1);
  const fi = document.getElementById('file-input');
  if (fi) fi.value = '';
}

function setImportStep(step) {
  for (let i = 0; i < 3; i++) {
    const circle = document.getElementById('step-circle-' + i);
    if (!circle) continue;
    if (i < step) {
      circle.style.background = 'var(--p700)'; circle.style.color = 'white';
      circle.style.borderColor = 'var(--p600)';
    } else {
      circle.style.background = 'var(--surface-3)'; circle.style.color = 'var(--text-muted)';
      circle.style.borderColor = 'var(--border)';
    }
  }
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['nama', 'email', 'nis', 'password'],
    ['Budi Santoso', 'budi@sekolah.com', '1234567890', 'siswa123'],
    ['Siti Rahayu', 'siti@sekolah.com', '1234567891', 'siswa123'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'template_import_siswa.xlsx');
  showToast('Template diunduh!', 'success');
}
