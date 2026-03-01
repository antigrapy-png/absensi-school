// =============================================
// Modal / Bottom Sheet Component
// =============================================
function openModal(title, bodyHtml, opts = {}) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('show');

  // Optional footer
  const sheet = document.getElementById('modal-sheet');
  const existing = sheet.querySelector('.modal-footer');
  if (existing) existing.remove();
  if (opts.footer) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = opts.footer;
    sheet.appendChild(footer);
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('show');
}

function handleModalBackdrop(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// Confirm dialog
function confirmDialog(msg, onConfirm, opts = {}) {
  openModal(opts.title || 'Konfirmasi', `
    <div style="text-align:center;padding:8px 0 4px">
      <div style="font-size:36px;margin-bottom:12px">${opts.icon || '⚠️'}</div>
      <p style="font-size:14px;color:var(--text-2);line-height:1.5">${msg}</p>
    </div>`,
    { footer: `
      <button class="btn btn-secondary btn-full" onclick="closeModal()">Batal</button>
      <button class="btn ${opts.dangerClass || 'btn-danger'} btn-full" onclick="closeModal();(${onConfirm.toString()})()">
        ${opts.confirmText || 'Ya, Lanjutkan'}
      </button>` }
  );
}

// Form helpers
function inputGroup(label, inputHtml, hint) {
  return `<div class="input-group">
    <label class="input-label">${label}</label>
    ${inputHtml}
    ${hint ? `<span style="font-size:11px;color:var(--text-muted)">${hint}</span>` : ''}
  </div>`;
}
function textInput(id, type, placeholder, value = '') {
  return `<input class="input" id="${id}" type="${type}" placeholder="${placeholder}" value="${value}" />`;
}
function selectInput(id, options, selected) {
  return `<select class="input" id="${id}">${options.map(o =>
    `<option value="${o.value}" ${o.value == selected ? 'selected' : ''}>${o.label}</option>`
  ).join('')}</select>`;
}
function formRow(...fields) {
  return `<div style="display:grid;grid-template-columns:${fields.map(() => '1fr').join(' ')};gap:10px">${fields.join('')}</div>`;
}
function modalFooter(primaryLabel, primaryAction, secondaryLabel = 'Batal') {
  return `
    <button class="btn btn-secondary btn-full" onclick="closeModal()">${secondaryLabel}</button>
    <button class="btn btn-primary btn-full" onclick="${primaryAction}">${primaryLabel}</button>`;
}
