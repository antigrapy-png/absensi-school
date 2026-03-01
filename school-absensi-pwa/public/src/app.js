// =============================================
// AbsensiKu PWA — App Entry Point
// =============================================

// ── PWA Install ──
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  setTimeout(() => document.getElementById('install-banner')?.classList.remove('hidden'), 3000);
});
window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner')?.classList.add('hidden');
  deferredInstallPrompt = null;
  showToast('AbsensiKu berhasil diinstall! 🎉', 'success');
});
async function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') showToast('Menginstall...', 'info');
  deferredInstallPrompt = null;
  document.getElementById('install-banner')?.classList.add('hidden');
}
function dismissInstall() {
  document.getElementById('install-banner')?.classList.add('hidden');
  sessionStorage.setItem('install-dismissed', '1');
}

// ── Service Worker ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] SW registered:', reg.scope);
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'SYNC_COMPLETE') showToast('Data offline tersinkronisasi', 'success');
      });
    } catch(err) { console.warn('[PWA] SW failed:', err); }
  });
}

// ── Navigation Config per Role ──
const NAV_CONFIG = {
  admin: [
    { id: 'dashboard',   icon: 'fa-home',           label: 'Beranda' },
    { id: 'absensi',     icon: 'fa-clipboard-check', label: 'Absensi' },
    { id: 'qr',          icon: 'fa-qrcode',          label: 'QR',   fab: true },
    { id: 'alert',       icon: 'fa-bell',            label: 'Alert' },
    { id: 'menu',        icon: 'fa-grid-2',          label: 'Menu' },
  ],
  guru: [
    { id: 'dashboard',   icon: 'fa-home',           label: 'Beranda' },
    { id: 'absensi',     icon: 'fa-clipboard-check', label: 'Absensi' },
    { id: 'qr',          icon: 'fa-qrcode',          label: 'QR',   fab: true },
    { id: 'izin',        icon: 'fa-file-medical-alt',label: 'Izin' },
    { id: 'menu',        icon: 'fa-grid-2',          label: 'Menu' },
  ],
  siswa: [
    { id: 'dashboard',   icon: 'fa-home',           label: 'Beranda' },
    { id: 'absensi-siswa',icon:'fa-calendar-check',  label: 'Absensi' },
    { id: 'qr',          icon: 'fa-qrcode',          label: 'Scan',  fab: true },
    { id: 'izin',        icon: 'fa-file-medical-alt',label: 'Izin' },
    { id: 'kalender',    icon: 'fa-calendar-alt',    label: 'Kalender' },
  ],
  kepsek: [
    { id: 'dashboard',   icon: 'fa-home',           label: 'Beranda' },
    { id: 'tren',        icon: 'fa-chart-line',      label: 'Tren' },
    { id: 'alert',       icon: 'fa-bell',            label: 'Alert',  fab: true },
    { id: 'kalender',    icon: 'fa-calendar-alt',    label: 'Kalender' },
    { id: 'menu',        icon: 'fa-grid-2',          label: 'Menu' },
  ],
};

// ── Page → Renderer map ──
const PAGE_RENDERERS = {
  'dashboard': () => {
    const role = store.get('user')?.role;
    if (role === 'kepsek') return renderDashboardKepsek();
    if (role === 'guru')   return renderDashboardGuru?.();
    if (role === 'siswa')  return renderDashboardSiswa?.();
    return renderDashboardAdmin?.();
  },
  // Absensi
  'absensi':       () => renderAbsensiHarian?.(),
  'absensi-siswa': () => renderAbsensiSiswaView?.(),
  'absensi-mapel': () => renderAbsensiMapelPage?.(),
  'qr':            () => renderQRPage?.(),
  // Alert & Izin
  'alert':         () => renderAlertPage?.(),
  'izin':          () => renderIzinPage?.(),
  // Kalender & Tren
  'kalender':      () => renderKalender?.(),
  'tren':          () => renderTrenPage?.(),
  // Import & Notif
  'import':        () => renderImport?.(),
  'notifikasi':    () => renderNotifikasi?.(),
  // Menu
  'menu':          () => renderMenuPage(),
  // Admin pages
  'siswa':         () => renderSiswaPage?.(),
  'guru':          () => renderGuruPage?.(),
  'kelas':         () => renderKelasPage?.(),
  'mapel':         () => renderMapelPage?.(),
  'jadwal':        () => renderJadwalPage?.(),
  'semester':      () => renderSemesterPage?.(),
  'rekap':         () => renderRekapPage?.(),
  'logs':          () => renderLogsPage?.(),
  'export':        () => renderExportPage?.(),
  'batas':         () => renderBatasPage?.(),
};

// ── Navigate ──
let currentPage = 'dashboard';
const history = [];

function navigateTo(page, pushHistory = true) {
  if (page === currentPage) return;
  if (pushHistory && currentPage) history.push(currentPage);
  currentPage = page;

  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.style.display = history.length > 0 && page !== 'dashboard' ? 'flex' : 'none';

  store.destroyCharts();

  // Close notif panel
  document.getElementById('notif-panel')?.classList.remove('show');

  const renderer = PAGE_RENDERERS[page];
  if (renderer) renderer();
  else setContent(`<div class="empty-state"><div class="empty-icon">🚧</div><div class="empty-title">Halaman ${page}</div><div class="empty-sub">Segera hadir</div></div>`);
}

function goBack() {
  if (history.length > 0) {
    const prev = history.pop();
    navigateTo(prev, false);
  }
}

// ── Bottom Nav Builder ──
function buildBottomNav(role) {
  const items = NAV_CONFIG[role] || NAV_CONFIG.admin;
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = items.map(item => `
    <button class="nav-item${item.fab ? ' fab' : ''}" data-page="${item.id}" onclick="navigateTo('${item.id}')">
      <div class="nav-icon-wrap"><i class="fas ${item.icon}"></i></div>
      <span class="nav-label">${item.label}</span>
    </button>`).join('');
}

// ── Menu Page (extra pages list) ──
const MENU_PAGES = {
  admin: [
    { icon:'fa-user-graduate',   label:'Siswa',         page:'siswa' },
    { icon:'fa-chalkboard-teacher',label:'Guru',        page:'guru' },
    { icon:'fa-door-open',       label:'Kelas',         page:'kelas' },
    { icon:'fa-layer-group',     label:'Jurusan',       page:'jurusan' },
    { icon:'fa-book',            label:'Mata Pelajaran',page:'mapel' },
    { icon:'fa-clock',           label:'Jadwal',        page:'jadwal' },
    { icon:'fa-calendar-alt',    label:'Kalender',      page:'kalender' },
    { icon:'fa-chart-line',      label:'Grafik Tren',   page:'tren' },
    { icon:'fa-percent',         label:'Batas Kehadiran',page:'batas' },
    { icon:'fa-file-import',     label:'Import Siswa',  page:'import' },
    { icon:'fa-file-excel',      label:'Export Excel',  page:'export' },
    { icon:'fa-shield-alt',      label:'Audit Trail',   page:'logs' },
    { icon:'fa-calendar-check',  label:'Semester',      page:'semester' },
  ],
  guru: [
    { icon:'fa-calendar-week',   label:'Jadwal Saya',   page:'jadwal' },
    { icon:'fa-chart-bar',       label:'Rekap Kelas',   page:'rekap' },
    { icon:'fa-chart-line',      label:'Grafik Tren',   page:'tren' },
    { icon:'fa-bell',            label:'Alert Siswa',   page:'alert' },
    { icon:'fa-calendar-alt',    label:'Kalender',      page:'kalender' },
  ],
  kepsek: [
    { icon:'fa-user-graduate',   label:'Data Siswa',    page:'siswa' },
    { icon:'fa-chart-bar',       label:'Rekap',         page:'rekap' },
    { icon:'fa-file-excel',      label:'Export',        page:'export' },
    { icon:'fa-shield-alt',      label:'Audit Trail',   page:'logs' },
  ],
};

function renderMenuPage() {
  setPageTitle('Menu Lainnya');
  const role = store.get('user')?.role;
  const menus = MENU_PAGES[role] || [];
  setContent(`
    <div class="p-page page space-y-4">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${menus.map(m => `
          <button onclick="navigateTo('${m.page}')" style="
            background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);
            padding:16px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;
            cursor:pointer;transition:all 0.15s;
          ">
            <div style="width:44px;height:44px;border-radius:14px;background:rgba(139,92,246,0.15);color:var(--p400);display:flex;align-items:center;justify-content:center">
              <i class="fas ${m.icon}" style="font-size:18px"></i>
            </div>
            <span style="font-size:11px;font-weight:600;color:var(--text-2);text-align:center;line-height:1.3">${m.label}</span>
          </button>`).join('')}
      </div>

      <!-- User section -->
      <div class="card">
        <div class="card-body space-y-3">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,var(--p700),var(--p500));color:white;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:18px">
              ${store.get('user')?.nama?.charAt(0)||'U'}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text)">${store.get('user')?.nama||'—'}</div>
              <div style="font-size:12px;color:var(--text-3);text-transform:capitalize">${store.get('user')?.role||'—'}</div>
            </div>
          </div>
          <button onclick="showChangePasswordModal()" class="btn btn-secondary btn-full"><i class="fas fa-key"></i> Ubah Password</button>
          <button onclick="doLogout()" class="btn btn-danger btn-full"><i class="fas fa-sign-out-alt"></i> Keluar</button>
        </div>
      </div>

      <div style="text-align:center;font-size:11px;color:var(--text-muted);padding-bottom:8px">
        AbsensiKu PWA v5.0 · ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}
      </div>
    </div>`);
}

// ── Profile Menu ──
function showProfileMenu() {
  const user = store.get('user');
  openModal('Profil', `
    <div class="space-y-3">
      <div style="text-align:center;padding:8px 0">
        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,var(--p700),var(--p500));color:white;font-family:'Syne',sans-serif;font-weight:800;font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
          ${user?.nama?.charAt(0)||'U'}
        </div>
        <div style="font-weight:700;font-size:1.1rem">${user?.nama}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;text-transform:capitalize">${user?.role} · ${user?.email}</div>
        ${user?.nip ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">NIP: ${user.nip}</div>` : ''}
        ${user?.nis ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">NIS: ${user.nis}</div>` : ''}
      </div>
      <button onclick="closeModal();showChangePasswordModal()" class="btn btn-secondary btn-full"><i class="fas fa-key"></i> Ubah Password</button>
      <button onclick="closeModal();doLogout()" class="btn btn-danger btn-full"><i class="fas fa-sign-out-alt"></i> Keluar</button>
    </div>`);
}

function showChangePasswordModal() {
  openModal('Ubah Password', `
    <div class="space-y-3">
      ${inputGroup('Password Lama', `<input class="input" id="cp-old" type="password" placeholder="••••••" />`)}
      ${inputGroup('Password Baru', `<input class="input" id="cp-new" type="password" placeholder="Min. 6 karakter" />`)}
      ${inputGroup('Konfirmasi', `<input class="input" id="cp-conf" type="password" placeholder="Ulangi password baru" />`)}
    </div>`,
    { footer: modalFooter('Ubah Password', 'doChangePassword()') });
}
async function doChangePassword() {
  const old = document.getElementById('cp-old')?.value;
  const nw  = document.getElementById('cp-new')?.value;
  const conf= document.getElementById('cp-conf')?.value;
  if (!old||!nw) { showToast('Semua field wajib','error'); return; }
  if (nw !== conf) { showToast('Password baru tidak cocok','error'); return; }
  if (nw.length < 6) { showToast('Min. 6 karakter','error'); return; }
  try { await api.post('/auth/change-password',{old_password:old,new_password:nw}); showToast('Password diubah'); closeModal(); }
  catch(err) { showToast(err.message,'error'); }
}

// ── Notif Panel ──
function toggleNotifPanel() {
  const p = document.getElementById('notif-panel');
  p?.classList.toggle('show');
  if (p?.classList.contains('show')) loadNotifs();
}
document.addEventListener('click', e => {
  const p = document.getElementById('notif-panel');
  const btn = document.getElementById('notif-btn');
  if (p?.classList.contains('show') && !p.contains(e.target) && !btn?.contains(e.target)) {
    p.classList.remove('show');
  }
});

async function loadNotifs() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  try {
    const [alertRes, izinRes] = await Promise.all([
      api.alerts(store.getActiveTaId()).catch(() => ({ data: [] })),
      api.izinCount().catch(() => ({ count: 0 }))
    ]);
    const alerts = alertRes.data || [];
    const izinPending = izinRes.count || 0;
    const total = alerts.length + izinPending;

    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = total; badge.classList.toggle('hidden', total === 0); }
    store.set('notifCount', total);

    if (!total) {
      list.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon">🔔</div><div class="empty-sub">Semua sudah dibaca</div></div>`;
      return;
    }

    let html = '';
    if (izinPending > 0) html += `
      <div class="notif-item unread" onclick="closePanel();navigateTo('izin')">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div class="notif-dot" style="margin-top:5px;background:var(--yellow);flex-shrink:0"></div>
          <div><div class="notif-title">${izinPending} Pengajuan Izin Menunggu</div><div class="notif-sub">Perlu persetujuan Anda</div></div>
        </div>
      </div>`;
    alerts.slice(0,5).forEach(a => {
      html += `<div class="notif-item unread" onclick="closePanel();markAlertRead(${a.id});navigateTo('alert')">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div class="notif-dot" style="margin-top:5px;flex-shrink:0"></div>
          <div>
            <div class="notif-title">${a.jenis === 'alpha_beruntun' ? '⚠️ Alpha Beruntun' : '📉 Bawah Batas Hadir'}</div>
            <div class="notif-sub">${a.siswa_nama} · ${a.kelas_nama}</div>
            <div class="notif-time">${new Date(a.created_at).toLocaleDateString('id-ID')}</div>
          </div>
        </div>
      </div>`;
    });
    list.innerHTML = html;
  } catch(err) { list.innerHTML = `<div style="padding:16px;font-size:12px;color:var(--text-muted)">${err.message}</div>`; }
}
function closePanel() { document.getElementById('notif-panel')?.classList.remove('show'); }
async function markAllNotifsRead() {
  try {
    await api.alertReadAll({ tahun_ajaran_id: store.getActiveTaId() });
    showToast('Semua dibaca'); loadNotifs();
  } catch(err) { showToast(err.message,'error'); }
}
async function markAlertRead(id) {
  try { await api.alertRead(id); } catch(e) {}
}

// ── Helpers ──
function setContent(html) { store.destroyCharts(); const el = document.getElementById('page-content'); if(el) el.innerHTML = html; }
function setPageTitle(t) { const el = document.getElementById('topbar-title'); if(el) el.textContent = t; }

// ── Login logic ──
let loginRole = 'admin';
function setLoginRole(role) {
  loginRole = role;
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.login-tab[data-role="${role}"]`)?.classList.add('active');
  const label = document.getElementById('login-id-label');
  const icon  = document.getElementById('login-id-icon');
  const input = document.getElementById('login-identifier');
  const hint  = document.getElementById('login-hint');
  const map   = { admin:['Email','fa-envelope','email','admin@sekolah.com','Login admin menggunakan email'], guru:['NIP Guru','fa-id-card','text','Masukkan NIP','Login guru menggunakan NIP'], siswa:['NIS Siswa','fa-id-badge','text','Masukkan NIS','Login siswa menggunakan NIS'], kepsek:['Email','fa-envelope','email','kepsek@sekolah.com','Login kepala sekolah menggunakan email'] };
  const c = map[role] || map.admin;
  if (label) label.textContent = c[0];
  if (icon)  icon.className = `fas ${c[1]} input-icon`;
  if (input) { input.type = c[2]; input.placeholder = c[3]; input.value = ''; }
  if (hint)  hint.textContent = c[4];
}
function togglePwVis() {
  const inp = document.getElementById('login-password'), ic = document.getElementById('pw-eye-icon');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  ic.className = inp.type === 'text' ? 'fas fa-eye-slash' : 'fas fa-eye';
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn-text');
  const err = document.getElementById('login-error');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
  err?.classList.add('hidden');
  try {
    const res = await api.login({ identifier, password, role: loginRole });
    store.saveUser(res.data.user, res.data.token);
    initApp(res.data.user);
  } catch(ex) {
    document.getElementById('login-error-msg').textContent = ex.message;
    err?.classList.remove('hidden');
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
  }
}

function initApp(user) {
  document.getElementById('login-page').style.display = 'none';
  const app = document.getElementById('app');
  app.classList.remove('hidden');

  // Set avatar
  const avatarBtn = document.getElementById('profile-btn');
  if (avatarBtn) avatarBtn.textContent = user.nama?.charAt(0)?.toUpperCase() || 'U';

  buildBottomNav(user.role);
  loadSemesters();
  loadNotifs();
  // Refresh notifs every 60s
  setInterval(loadNotifs, 60000);
  navigateTo('dashboard', false);
}

async function loadSemesters() {
  try {
    const res = await api.semesters();
    store.set('semesters', res.data);
    const active = res.data.find(s => s.is_active);
    if (active) {
      store.set('activeSemesterId', String(active.id));
      store.set('selectedSemesterId', String(active.id));
    }
  } catch(err) { console.error('Gagal load semester:', err); }
}

function doLogout() {
  api.logout();
  store.clearUser();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-page').style.display = '';
  showToast('Berhasil keluar', 'info');
  setLoginRole('admin');
}

// ── Auto restore session ──
(async () => {
  const token = localStorage.getItem('pwa_token');
  const rawUser = localStorage.getItem('pwa_user');
  if (token && rawUser) {
    try {
      const res = await api.me();
      initApp({ ...JSON.parse(rawUser), ...res.data });
    } catch(e) {
      localStorage.removeItem('pwa_token');
      localStorage.removeItem('pwa_user');
    }
  }

  // Handle URL shortcuts
  const urlPage = new URLSearchParams(window.location.search).get('page');
  if (urlPage && store.get('user')) navigateTo(urlPage, false);
})();
