// ============================================================
// AbsensiKu SPA — v3.0
// ============================================================

const API = "/api";
let currentUser = null;
let activeSemesterId = null;
let allSemesters = [];
let selectedSemesterId = null;
let currentLoginRole = "admin";
let chartInstances = {};

// ============================================================
// API
// ============================================================
const getToken = () => localStorage.getItem("token");

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
}
const apiGet = (p) => apiFetch(p);
const apiPost = (p, b) =>
  apiFetch(p, { method: "POST", body: JSON.stringify(b) });
const apiPut = (p, b) =>
  apiFetch(p, { method: "PUT", body: JSON.stringify(b) });
const apiDelete = (p) => apiFetch(p, { method: "DELETE" });

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  const cont = document.getElementById("toastContent");
  const icon = document.getElementById("toastIcon");
  const msgEl = document.getElementById("toastMsg");
  const cfg =
    {
      success: {
        border: "border-green-200 dark:border-green-800",
        bg: "bg-green-50 dark:bg-green-950",
        icon: "fas fa-check-circle text-green-500",
      },
      error: {
        border: "border-red-200 dark:border-red-800",
        bg: "bg-red-50 dark:bg-red-950",
        icon: "fas fa-times-circle text-red-500",
      },
      info: {
        border: "border-blue-200 dark:border-blue-800",
        bg: "bg-blue-50 dark:bg-blue-950",
        icon: "fas fa-info-circle text-blue-500",
      },
    }[type] || {};
  cont.className = `rounded-2xl shadow-2xl border px-5 py-3.5 flex items-center gap-3 min-w-72 max-w-sm ${cfg.border} ${cfg.bg}`;
  icon.className = `text-xl flex-shrink-0 ${cfg.icon}`;
  msgEl.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 3500);
}

// ============================================================
// MODAL
// ============================================================
function openModal(title, bodyHtml, size = "max-w-2xl") {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("modalBox").className =
    `bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${size} max-h-[90vh] overflow-y-auto mx-4`;
  const m = document.getElementById("modal");
  m.classList.remove("hidden");
  m.style.display = "flex";
}
function closeModal() {
  const m = document.getElementById("modal");
  m.classList.add("hidden");
  m.style.display = "none";
}
function handleModalBg(e) {
  if (e.target === document.getElementById("modal")) closeModal();
}

// ============================================================
// FORM HELPERS
// ============================================================
const IC = () =>
  "w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const LB = (t) =>
  `<label class="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">${t}</label>`;
const FW = (label, inp) => `<div>${LB(label)}${inp}</div>`;
const btnPri = (t, fn) =>
  `<button type="button" onclick="${fn}" class="flex-1 bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all">${t}</button>`;
const btnGrn = (t, fn) =>
  `<button type="button" onclick="${fn}" class="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all">${t}</button>`;
const btnRed = (t, fn) =>
  `<button type="button" onclick="${fn}" class="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 active:scale-95 transition-all">${t}</button>`;
const btnSec = (t, fn) =>
  `<button type="button" onclick="${fn}" class="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">${t}</button>`;
const btnRow = (...btns) =>
  `<div class="flex gap-3 pt-2">${btns.join("")}</div>`;

// ============================================================
// DARK MODE
// ============================================================
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle("dark");
  document.getElementById("darkIcon").className = isDark
    ? "fas fa-sun text-xs"
    : "fas fa-moon text-xs";
  localStorage.setItem("darkMode", isDark ? "1" : "0");
}
function initDarkMode() {
  const saved = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "1" || (saved === null && prefersDark)) {
    document.documentElement.classList.add("dark");
    const icon = document.getElementById("darkIcon");
    if (icon) icon.className = "fas fa-sun text-xs";
  }
}
initDarkMode();

// ============================================================
// WEEK INFO
// ============================================================
function updateWeekInfo(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
  const isGanjil = weekNum % 2 === 1;
  const el = document.getElementById("weekInfoText");
  const bar = document.getElementById("weekInfoBar");
  if (el) {
    el.textContent = `Minggu ke-${weekNum} (${isGanjil ? "Ganjil - Blok Praktek/Teori" : "Genap - Blok Teori/Praktek"})`;
    bar.classList.remove("hidden");
  }
  return { weekNum, isGanjil, parity: isGanjil ? "ganjil" : "genap" };
}

// ============================================================
// LOGIN — ROLE SWITCH
// ============================================================
function switchLoginRole(role) {
  currentLoginRole = role;
  ["admin", "guru", "siswa"].forEach((r) => {
    const tab = document.getElementById(
      `tab${r.charAt(0).toUpperCase() + r.slice(1)}`,
    );
    if (tab) tab.classList.toggle("active", r === role);
  });
  const cfgs = {
    admin: {
      label: "Email Admin",
      icon: "fa-envelope",
      placeholder: "admin@school.com",
      hint: "Login admin menggunakan email dan password. Default: admin1@school.com / admin123",
    },
    guru: {
      label: "NIP Guru",
      icon: "fa-id-card",
      placeholder: "Masukkan NIP",
      hint: "Guru login menggunakan NIP. Default password: GuruSmkn1babelan",
    },
    siswa: {
      label: "NIS Siswa",
      icon: "fa-id-badge",
      placeholder: "Masukkan NIS",
      hint: "Siswa login menggunakan NIS. Default password: Smkn1babelan",
    },
  };
  const c = cfgs[role];
  document.getElementById("loginIdentLabel").textContent = c.label;
  document.getElementById("loginIdentIcon").className =
    `fas ${c.icon} absolute left-4 top-1/2 -translate-y-1/2 text-white/45 text-sm`;
  document.getElementById("loginIdentifier").placeholder = c.placeholder;
  document.getElementById("loginHint").textContent = c.hint;
  document.getElementById("loginError").classList.add("hidden");
}

function togglePasswordVis() {
  const inp = document.getElementById("loginPassword");
  const ico = document.getElementById("eyeIcon");
  if (inp.type === "password") {
    inp.type = "text";
    ico.className = "fas fa-eye-slash text-sm";
  } else {
    inp.type = "password";
    ico.className = "fas fa-eye text-sm";
  }
}

// ============================================================
// LOGIN
// ============================================================
async function doLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById("loginIdentifier").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  const btnText = document.getElementById("loginBtnText");
  errEl.classList.add("hidden");
  btnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memeriksa...';
  try {
    const data = await apiPost("/auth/login", {
      identifier,
      password,
      role: currentLoginRole,
    });
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    await initApp(data.data.user);
  } catch (err) {
    document.getElementById("loginErrMsg").textContent = err.message;
    errEl.classList.remove("hidden");
  } finally {
    btnText.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>MASUK';
  }
}
document.getElementById("loginForm").addEventListener("submit", doLogin);

// ============================================================
// INIT APP
// ============================================================
async function initApp(user) {
  currentUser = user;
  document.getElementById("loginPage").classList.add("hidden");
  const appPage = document.getElementById("appPage");
  appPage.classList.remove("hidden");

  // Apply role theme
  const root = document.body;
  root.classList.remove("theme-admin", "theme-guru", "theme-siswa");
  root.classList.add(`theme-${user.role}`);

  // User info in sidebar
  document.getElementById("userName").textContent = user.nama;
  document.getElementById("userAvatar").textContent = user.nama
    .charAt(0)
    .toUpperCase();

  const roleLabels = { admin: "Administrator", guru: "Guru", siswa: "Siswa" };
  document.getElementById("userRoleTag").textContent =
    roleLabels[user.role] || user.role;

  // Extra info (NIP/NIS)
  const extraEl = document.getElementById("userExtraInfo");
  if (user.role === "guru" && user.nip) {
    extraEl.innerHTML = `<p class="text-xs text-white/45">NIP: <span class="text-white/70 font-mono">${user.nip}</span></p>`;
    extraEl.classList.remove("hidden");
  } else if (user.role === "siswa" && user.nis) {
    extraEl.innerHTML = `<p class="text-xs text-white/45">NIS: <span class="text-white/70 font-mono">${user.nis}</span></p>${user.kelas_nama ? `<p class="text-xs text-white/45">Kelas: <span class="text-white/70">${user.kelas_nama}</span></p>` : ""}`;
    extraEl.classList.remove("hidden");
  } else {
    extraEl.classList.add("hidden");
  }

  // Role badge in topbar
  const badgeCfg =
    {
      admin: {
        cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        icon: "fa-user-shield",
        label: "Administrator",
      },
      guru: {
        cls: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        icon: "fa-chalkboard-teacher",
        label: "Guru",
      },
      siswa: {
        cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
        icon: "fa-user-graduate",
        label: "Siswa",
      },
    }[user.role] || {};
  const badge = document.getElementById("roleBadge");
  badge.className = `hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${badgeCfg.cls}`;
  badge.innerHTML = `<i class="fas ${badgeCfg.icon}"></i>${badgeCfg.label}`;

  // Load semesters
  try {
    const semRes = await apiGet("/semester");
    allSemesters = semRes.data;
    const active = allSemesters.find((s) => s.is_active);
    activeSemesterId = active ? String(active.id) : String(allSemesters[0]?.id);
    selectedSemesterId = activeSemesterId;
    const semSel = document.getElementById("globalSemesterFilter");
    semSel.innerHTML = allSemesters
      .map(
        (s) =>
          `<option value="${s.id}" ${s.is_active ? "selected" : ""}>${s.nama} ${s.semester.toUpperCase()}</option>`,
      )
      .join("");
    if (active)
      document.getElementById("semesterLabel").textContent =
        `${active.nama} ${active.semester}`;
  } catch (e) {
    console.error("Semester load:", e);
  }

  updateWeekInfo();
  buildSidebar(user.role);
  navigateTo("dashboard");

  // Auto-set default login hint
  switchLoginRole("admin");
}

// ============================================================
// SIDEBAR
// ============================================================
const NAV_CFG = {
  admin: [
    { icon: "fa-tachometer-alt", label: "Dashboard", page: "dashboard" },
    { icon: "fa-calendar-alt", label: "Semester", page: "semester" },
    { icon: "fa-layer-group", label: "Jurusan", page: "jurusan" },
    { icon: "fa-door-open", label: "Kelas", page: "kelas" },
    { icon: "fa-chalkboard-teacher", label: "Guru", page: "guru" },
    { icon: "fa-user-graduate", label: "Siswa", page: "siswa" },
    { icon: "fa-book", label: "Mata Pelajaran", page: "mapel" },
    { icon: "fa-calendar-week", label: "Jadwal Blok", page: "jadwal" },
    {
      icon: "fa-clipboard-check",
      label: "Absensi Harian",
      page: "absensi-harian",
    },
    {
      icon: "fa-clipboard-list",
      label: "Absensi Mapel",
      page: "absensi-mapel",
    },
    { icon: "fa-chart-bar", label: "Rekap", page: "rekap" },
    { icon: "fa-file-excel", label: "Export Excel", page: "export" },
    { icon: "fa-history", label: "Activity Log", page: "logs" },
  ],
  guru: [
    { icon: "fa-tachometer-alt", label: "Dashboard", page: "dashboard" },
    { icon: "fa-calendar-week", label: "Jadwal Saya", page: "jadwal" },
    {
      icon: "fa-clipboard-check",
      label: "Absensi Harian",
      page: "absensi-harian",
    },
    {
      icon: "fa-clipboard-list",
      label: "Absensi Mapel",
      page: "absensi-mapel",
    },
    { icon: "fa-chart-bar", label: "Rekap Kelas", page: "rekap" },
    { icon: "fa-file-excel", label: "Export Excel", page: "export" },
  ],
  siswa: [
    { icon: "fa-tachometer-alt", label: "Dashboard", page: "dashboard" },
    { icon: "fa-history", label: "Riwayat Absensi", page: "absensi-siswa" },
    { icon: "fa-users", label: "Kelola Kelas", page: "ketua-kelas" },
    { icon: "fa-chart-pie", label: "Statistik Saya", page: "rekap-siswa" },
  ],
};

function buildSidebar(role) {
  const nav = document.getElementById("sidebarNav");
  nav.innerHTML = (NAV_CFG[role] || [])
    .map(
      (item) => `
    <a href="#" onclick="navigateTo('${item.page}');return false;" id="nav-${item.page}"
       class="sidebar-link">
      <i class="fas ${item.icon} w-5 text-center flex-shrink-0"></i>
      <span>${item.label}</span>
    </a>`,
    )
    .join("");
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page) {
  document
    .querySelectorAll(".sidebar-link")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`nav-${page}`)?.classList.add("active");
  const pages = {
    dashboard: renderDashboard,
    semester: renderSemester,
    jurusan: renderJurusan,
    kelas: renderKelas,
    guru: renderGuru,
    siswa: renderSiswa,
    mapel: renderMapel,
    jadwal: renderJadwal,
    "absensi-harian": renderAbsensiHarian,
    "absensi-mapel": renderAbsensiMapel,
    "absensi-siswa": renderAbsensiSiswa,
    "ketua-kelas": renderKetuaKelas,
    rekap: renderRekap,
    "rekap-siswa": renderRekapSiswa,
    export: renderExport,
    logs: renderLogs,
  };
  pages[page]?.();
}

function onSemesterFilterChange() {
  selectedSemesterId = document.getElementById("globalSemesterFilter").value;
  const active = document.querySelector(".sidebar-link.active");
  if (active) navigateTo(active.id.replace("nav-", ""));
}

function setContent(html) {
  Object.values(chartInstances).forEach((c) => {
    try {
      c.destroy();
    } catch (e) {}
  });
  chartInstances = {};
  document.getElementById("mainContent").innerHTML = `<div>${html}</div>`;
}
function setTitle(t, s = "") {
  document.getElementById("pageTitle").textContent = t;
  document.getElementById("pageSubtitle").textContent = s;
}
function loadingUI() {
  document.getElementById("mainContent").innerHTML = `
    <div class="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
      <div class="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      <span class="text-sm">Memuat data...</span>
    </div>`;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  document.getElementById("appPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
  document.body.classList.remove("theme-admin", "theme-guru", "theme-siswa");
  document.getElementById("loginIdentifier").value = "";
  document.getElementById("loginPassword").value = "";
  switchLoginRole("admin");
}

// ============================================================
// CHANGE PASSWORD
// ============================================================
function showChangePassword() {
  openModal(
    "Ubah Password",
    `
    <div class="space-y-4">
      ${FW("Password Lama", `<input id="cp_old" type="password" class="${IC()}" />`)}
      ${FW("Password Baru", `<input id="cp_new" type="password" class="${IC()}" />`)}
      ${FW("Konfirmasi Password", `<input id="cp_cfm" type="password" class="${IC()}" />`)}
      ${btnRow(btnPri("Ubah Password", "doChangePassword()"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doChangePassword() {
  const old_p = document.getElementById("cp_old").value;
  const new_p = document.getElementById("cp_new").value;
  const cfm = document.getElementById("cp_cfm").value;
  if (new_p !== cfm) {
    showToast("Konfirmasi password tidak cocok", "error");
    return;
  }
  if (new_p.length < 6) {
    showToast("Password minimal 6 karakter", "error");
    return;
  }
  try {
    await apiPost("/auth/change-password", {
      old_password: old_p,
      new_password: new_p,
    });
    showToast("Password berhasil diubah");
    closeModal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard() {
  setTitle("Dashboard", `Selamat datang, ${currentUser.nama}`);
  loadingUI();
  try {
    const data = await apiGet(
      `/rekap/dashboard?tahun_ajaran_id=${selectedSemesterId || ""}`,
    );
    const d = data.data;

    if (currentUser.role === "admin") {
      const total = d.absensiSummary?.total || 0;
      const hadir = d.absensiSummary?.hadir || 0;
      const pct = total ? Math.round((hadir / total) * 100) : 0;
      setContent(`
        <div class="space-y-5">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${grdCard("Siswa Aktif", d.jumlahSiswa ?? 0, "fa-user-graduate", "grd-blue")}
            ${grdCard("Guru", d.jumlahGuru ?? 0, "fa-chalkboard-teacher", "grd-green")}
            ${grdCard("Kelas", d.jumlahKelas ?? 0, "fa-door-open", "grd-purple")}
            ${grdCard("% Hadir", pct + "%", "fa-chart-line", pct >= 80 ? "grd-green" : pct >= 60 ? "grd-amber" : "grd-red")}
          </div>
          <div class="grid grid-cols-4 gap-3">
            ${miniCard("Hadir", d.absensiSummary?.hadir || 0, "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400")}
            ${miniCard("Sakit", d.absensiSummary?.sakit || 0, "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400")}
            ${miniCard("Izin", d.absensiSummary?.izin || 0, "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400")}
            ${miniCard("Alpha", d.absensiSummary?.alpha || 0, "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400")}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
              <h3 class="font-black text-gray-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Kehadiran per Jurusan</h3>
              <canvas id="chartJur" height="220"></canvas>
            </div>
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
              <h3 class="font-black text-gray-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Distribusi per Tingkat</h3>
              <canvas id="chartTkt" height="220"></canvas>
            </div>
          </div>
        </div>`);
      if (d.byJurusan?.length) {
        chartInstances.jur = new Chart(document.getElementById("chartJur"), {
          type: "bar",
          data: {
            labels: d.byJurusan.map((x) => x.jurusan || x.nama),
            datasets: [
              {
                label: "Hadir",
                data: d.byJurusan.map((x) => x.hadir || 0),
                backgroundColor: "#22c55e",
                borderRadius: 6,
              },
              {
                label: "Alpha",
                data: d.byJurusan.map((x) => x.alpha || 0),
                backgroundColor: "#ef4444",
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          },
        });
      }
      if (d.byTingkat?.length) {
        chartInstances.tkt = new Chart(document.getElementById("chartTkt"), {
          type: "doughnut",
          data: {
            labels: d.byTingkat.map((x) => `Tingkat ${x.tingkat}`),
            datasets: [
              {
                data: d.byTingkat.map((x) => x.total || 0),
                backgroundColor: ["#3b82f6", "#8b5cf6", "#f59e0b"],
                borderWidth: 0,
                hoverOffset: 8,
              },
            ],
          },
          options: {
            responsive: true,
            cutout: "70%",
            plugins: { legend: { position: "bottom" } },
          },
        });
      }
    } else if (currentUser.role === "guru") {
      const ks = d.kelasStats || {};
      setContent(`
        <div class="space-y-5">
          ${
            d.isWalas && ks.total
              ? `
          <div>
            <h3 class="text-sm font-black text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-3">Statistik Kelas Wali (${d.namaKelas || ""})</h3>
            <div class="grid grid-cols-4 gap-3">
              ${miniCard("Hadir", ks.hadir || 0, "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400")}
              ${miniCard("Sakit", ks.sakit || 0, "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400")}
              ${miniCard("Izin", ks.izin || 0, "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400")}
              ${miniCard("Alpha", ks.alpha || 0, "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400")}
            </div>
          </div>`
              : ""
          }
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden card-hover">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Jadwal Mengajar Saya</h3>
            </div>
            ${
              d.jadwals?.length
                ? `
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-slate-900"><tr>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Hari</th>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Jam</th>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Kelas</th>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Mapel</th>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Tipe</th>
                  <th class="px-5 py-3 text-left font-bold text-gray-500 text-xs uppercase">Pola Minggu</th>
                </tr></thead>
                <tbody>${d.jadwals
                  .map(
                    (
                      j,
                    ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
                  <td class="px-5 py-3 font-semibold">${j.hari}</td>
                  <td class="px-5 py-3 font-mono text-xs text-gray-500">${j.jam_mulai?.slice(0, 5)}–${j.jam_selesai?.slice(0, 5)}</td>
                  <td class="px-5 py-3">${j.kelas}</td>
                  <td class="px-5 py-3">${j.mapel}</td>
                  <td class="px-5 py-3">${tipeBadge(j.tipe_sesi)}</td>
                  <td class="px-5 py-3">${polaBadge(j.pola_minggu)}</td>
                </tr>`,
                  )
                  .join("")}</tbody>
              </table>
            </div>`
                : '<p class="text-center py-10 text-gray-400 text-sm">Belum ada jadwal.</p>'
            }
          </div>
        </div>`);
    } else {
      // SISWA DASHBOARD
      const s = d.stats || {};
      const pctS = s.total ? Math.round((s.hadir / s.total) * 100) : 0;
      setContent(`
        <div class="space-y-5">
          <!-- Profile Card -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center font-black text-purple-700 dark:text-purple-300 text-2xl flex-shrink-0">
                ${currentUser.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 class="font-black text-gray-800 text-lg">${currentUser.nama}</h3>
                <p class="text-gray-500 text-sm">${currentUser.kelas_nama || "Kelas belum ditentukan"}</p>
                <div class="flex gap-2 mt-1">
                  ${currentUser.nis ? `<span class="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-mono">NIS: ${currentUser.nis}</span>` : ""}
                  ${currentUser.is_ketua_kelas ? '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full"><i class="fas fa-crown mr-1"></i>Ketua Kelas</span>' : ""}
                </div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-3">
            ${miniCard("Hadir", s.hadir || 0, "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400")}
            ${miniCard("Sakit", s.sakit || 0, "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400")}
            ${miniCard("Izin", s.izin || 0, "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400")}
            ${miniCard("Alpha", s.alpha || 0, "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400")}
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Tingkat Kehadiran</h3>
              <span class="font-black text-2xl ${pctS >= 80 ? "text-green-600" : pctS >= 60 ? "text-amber-600" : "text-red-600"}">${pctS}%</span>
            </div>
            <div class="relative h-5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="${pctS >= 80 ? "bg-green-500" : pctS >= 60 ? "bg-amber-500" : "bg-red-500"} h-full rounded-full transition-all duration-700" style="width:${pctS}%"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">${s.hadir || 0} hadir dari ${s.total || 0} hari</p>
          </div>
          ${
            d.monthly?.length
              ? `
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
            <h3 class="font-black text-gray-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Tren Kehadiran Bulanan</h3>
            <canvas id="chartMonthly" height="150"></canvas>
          </div>`
              : ""
          }
        </div>`);
      if (d.monthly?.length) {
        chartInstances.monthly = new Chart(
          document.getElementById("chartMonthly"),
          {
            type: "line",
            data: {
              labels: d.monthly.map((m) => m.bulan),
              datasets: [
                {
                  label: "Hadir",
                  data: d.monthly.map((m) => m.hadir),
                  borderColor: "#a855f7",
                  tension: 0.3,
                  fill: true,
                  backgroundColor: "rgba(168,85,247,0.1)",
                  pointBackgroundColor: "#a855f7",
                  pointRadius: 5,
                },
              ],
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
            },
          },
        );
      }
    }
  } catch (err) {
    setContent(
      `<div class="text-center py-16 text-red-500"><i class="fas fa-exclamation-triangle text-4xl mb-3 block"></i><p>${err.message}</p></div>`,
    );
  }
}

function grdCard(label, val, icon, grd) {
  return `<div class="${grd} text-white rounded-2xl shadow-lg p-5 card-hover">
    <div class="flex items-center justify-between">
      <div><p class="text-white/70 text-xs font-bold uppercase tracking-wider">${label}</p><p class="text-3xl font-black mt-1">${val}</p></div>
      <i class="fas ${icon} text-3xl text-white/40"></i>
    </div>
  </div>`;
}
function miniCard(label, val, cls) {
  return `<div class="${cls} rounded-2xl p-4 text-center card-hover">
    <p class="text-2xl font-black">${val}</p><p class="text-xs font-semibold mt-1 opacity-80">${label}</p>
  </div>`;
}
function tipeBadge(t) {
  const s = t === "praktek" ? "mg-praktek" : "mg-teori";
  return `<span class="text-xs font-bold px-2.5 py-1 rounded-full ${s}">${t || "teori"}</span>`;
}
function polaBadge(p) {
  if (!p || p === "semua")
    return '<span class="text-xs text-gray-400">Semua Minggu</span>';
  const s = p === "ganjil" ? "mg-praktek" : "mg-teori";
  return `<span class="text-xs font-bold px-2.5 py-1 rounded-full ${s}">${p === "ganjil" ? "Minggu Ganjil" : "Minggu Genap"}</span>`;
}
function stBadge(status) {
  const c =
    {
      hadir: "st-hadir",
      sakit: "st-sakit",
      izin: "st-izin",
      alpha: "st-alpha",
    }[status] || "st-alpha";
  return `<span class="text-xs font-bold px-2.5 py-1 rounded-full capitalize ${c}">${status}</span>`;
}

// ============================================================
// SEMESTER
// ============================================================
async function renderSemester() {
  setTitle("Semester", "Manajemen Tahun Ajaran");
  loadingUI();
  try {
    const data = await apiGet("/semester");
    setContent(`
      <div class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Daftar Semester</h3>
          <div class="flex gap-2">
            <button onclick="showNaikTingkatModal()" class="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all active:scale-95">
              <i class="fas fa-arrow-up"></i>Naik Tingkat</button>
            <button onclick="showAddSemesterModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all active:scale-95">
              <i class="fas fa-plus"></i>Tambah</button>
          </div>
        </div>
        <div class="grid gap-3">
          ${data.data
            .map(
              (s) => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover border border-gray-100 dark:border-slate-700">
              <div class="flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-4">
                  <div class="${s.is_active ? "bg-green-100 dark:bg-green-950/30 text-green-600" : "bg-gray-100 dark:bg-slate-700 text-gray-400"} rounded-xl p-3">
                    <i class="fas fa-calendar-alt text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-black text-gray-800 dark:text-white">${s.nama} — ${s.semester.toUpperCase()}</h4>
                    <p class="text-gray-400 text-xs mt-0.5">${s.start_date?.slice(0, 10) || "—"} s/d ${s.end_date?.slice(0, 10) || "—"}</p>
                    ${s.is_active ? '<span class="inline-block mt-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs px-2.5 py-1 rounded-full font-bold"><i class="fas fa-circle text-xs mr-1"></i>Aktif</span>' : ""}
                  </div>
                </div>
                <div class="flex gap-2 flex-wrap">
                  <button onclick="showEditSemesterModal(${s.id},'${s.nama}','${s.semester}','${s.start_date?.slice(0, 10) || ""}','${s.end_date?.slice(0, 10) || ""}')"
                    class="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
                    <i class="fas fa-pen mr-1"></i>Edit</button>
                  ${
                    !s.is_active
                      ? `<button onclick="activateSemester(${s.id})"
                    class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-all">
                    <i class="fas fa-check mr-1"></i>Aktifkan</button>`
                      : ""
                  }
                  <button onclick="showDuplikatKelasModal(${s.id})"
                    class="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-600 transition-all">
                    <i class="fas fa-copy mr-1"></i>Duplikat Kelas</button>
                  ${
                    !s.is_active
                      ? `<button onclick="deleteSemester(${s.id})"
                    class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-all">
                    <i class="fas fa-trash mr-1"></i>Hapus</button>`
                      : ""
                  }
                </div>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

function showAddSemesterModal() {
  openModal(
    "Tambah Semester",
    `
    <div class="space-y-4">
      ${FW("Tahun Ajaran (contoh: 2027/2028)", `<input id="sm_nama" class="${IC()}" placeholder="2027/2028" />`)}
      ${FW("Semester", `<select id="sm_sem" class="${IC()}"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select>`)}
      ${FW("Tanggal Mulai", `<input id="sm_st" type="date" class="${IC()}" />`)}
      ${FW("Tanggal Selesai", `<input id="sm_en" type="date" class="${IC()}" />`)}
      ${btnRow(btnPri("Simpan", "doAddSemester()"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doAddSemester() {
  const body = {
    nama: document.getElementById("sm_nama").value,
    semester: document.getElementById("sm_sem").value,
    start_date: document.getElementById("sm_st").value,
    end_date: document.getElementById("sm_en").value,
  };
  if (!body.nama || !body.start_date || !body.end_date) {
    showToast("Lengkapi semua field", "error");
    return;
  }
  try {
    await apiPost("/semester", body);
    showToast("Semester ditambahkan");
    closeModal();
    renderSemester();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditSemesterModal(id, nama, sem, st, en) {
  openModal(
    "Edit Semester",
    `
    <div class="space-y-4">
      ${FW("Tahun Ajaran", `<input id="sme_nama" value="${nama}" class="${IC()}" />`)}
      ${FW("Semester", `<select id="sme_sem" class="${IC()}"><option value="ganjil" ${sem === "ganjil" ? "selected" : ""}>Ganjil</option><option value="genap" ${sem === "genap" ? "selected" : ""}>Genap</option></select>`)}
      ${FW("Tanggal Mulai", `<input id="sme_st" type="date" value="${st}" class="${IC()}" />`)}
      ${FW("Tanggal Selesai", `<input id="sme_en" type="date" value="${en}" class="${IC()}" />`)}
      ${btnRow(btnPri(`doEditSemester(${id})`, "Update"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
  // fix button
  document.querySelector(
    "#modalBody .flex.gap-3 button:first-child",
  ).textContent = "Update";
  document
    .querySelector("#modalBody .flex.gap-3 button:first-child")
    .setAttribute("onclick", `doEditSemester(${id})`);
}
async function doEditSemester(id) {
  const body = {
    nama: document.getElementById("sme_nama").value,
    semester: document.getElementById("sme_sem").value,
    start_date: document.getElementById("sme_st").value,
    end_date: document.getElementById("sme_en").value,
  };
  try {
    await apiPut(`/semester/${id}`, body);
    showToast("Semester diupdate");
    closeModal();
    renderSemester();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteSemester(id) {
  if (!confirm("Hapus semester ini?")) return;
  try {
    await apiDelete(`/semester/${id}`);
    showToast("Semester dihapus");
    renderSemester();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function activateSemester(id) {
  if (!confirm("Aktifkan semester ini?")) return;
  try {
    await apiPut(`/semester/${id}/activate`, {});
    showToast("Semester diaktifkan");
    activeSemesterId = String(id);
    selectedSemesterId = String(id);
    const semRes = await apiGet("/semester");
    allSemesters = semRes.data;
    const active = allSemesters.find((s) => s.is_active);
    if (active)
      document.getElementById("semesterLabel").textContent =
        `${active.nama} ${active.semester}`;
    document.getElementById("globalSemesterFilter").innerHTML = allSemesters
      .map(
        (s) =>
          `<option value="${s.id}" ${s.is_active ? "selected" : ""}>${s.nama} ${s.semester.toUpperCase()}</option>`,
      )
      .join("");
    renderSemester();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showDuplikatKelasModal(fromId) {
  const opts = allSemesters
    .filter((s) => s.id != fromId)
    .map((s) => `<option value="${s.id}">${s.nama} ${s.semester}</option>`)
    .join("");
  openModal(
    "Duplikat Kelas ke Semester",
    `
    <div class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-slate-400">Salin semua kelas dari semester ini ke semester tujuan.</p>
      ${FW("Duplikat ke", `<select id="dup_tgt" class="${IC()}">${opts}</select>`)}
      ${btnRow(btnPri("Duplikat", `doDuplikatKelas(${fromId})`), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doDuplikatKelas(fromId) {
  const target = document.getElementById("dup_tgt").value;
  try {
    const r = await apiPost(`/semester/${fromId}/duplicate-kelas`, {
      target_semester_id: target,
    });
    showToast(r.message);
    closeModal();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showNaikTingkatModal() {
  const opts = allSemesters
    .map((s) => `<option value="${s.id}">${s.nama} ${s.semester}</option>`)
    .join("");
  openModal(
    "Naik Tingkat Otomatis",
    `
    <div class="space-y-4">
      <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <i class="fas fa-info-circle mr-2"></i>X→XI, XI→XII, XII→Alumni. Data absensi lama tetap tersimpan.
      </div>
      ${FW("Dari Semester", `<select id="nt_from" class="${IC()}">${opts}</select>`)}
      ${FW("Ke Semester", `<select id="nt_to" class="${IC()}">${opts}</select>`)}
      ${btnRow(btnGrn("Proses Naik Tingkat", "doNaikTingkat()"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doNaikTingkat() {
  const from = document.getElementById("nt_from").value,
    to = document.getElementById("nt_to").value;
  if (from === to) {
    showToast("Semester tidak boleh sama", "error");
    return;
  }
  try {
    const r = await apiPost("/semester/naik-tingkat", {
      from_ta_id: from,
      to_ta_id: to,
    });
    showToast(r.message);
    closeModal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// JURUSAN
// ============================================================
async function renderJurusan() {
  setTitle("Jurusan", "Kelola program keahlian");
  loadingUI();
  try {
    const data = await apiGet("/jurusan");
    setContent(`
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Jurusan (${data.data.length})</h3>
          <button onclick="showAddJurusanModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all">
            <i class="fas fa-plus"></i>Tambah</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-slate-900"><tr>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Kode</th>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-5 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr></thead>
            <tbody>
              ${data.data
                .map(
                  (
                    j,
                  ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
                <td class="px-5 py-3 font-black text-blue-700 dark:text-blue-400 font-mono">${j.kode}</td>
                <td class="px-5 py-3 font-medium dark:text-slate-200">${j.nama}</td>
                <td class="px-5 py-3 text-right">
                  <button onclick="showEditJurusanModal(${j.id},'${j.kode}','${j.nama}')" class="text-blue-600 hover:underline text-xs font-bold mr-3"><i class="fas fa-pen mr-1"></i>Edit</button>
                  <button onclick="deleteJurusan(${j.id})" class="text-red-500 hover:underline text-xs font-bold"><i class="fas fa-trash mr-1"></i>Hapus</button>
                </td>
              </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
function showAddJurusanModal() {
  openModal(
    "Tambah Jurusan",
    `
    <div class="space-y-4">
      ${FW("Kode", `<input id="jr_kode" class="${IC()}" placeholder="RPL" />`)}
      ${FW("Nama Jurusan", `<input id="jr_nama" class="${IC()}" placeholder="Rekayasa Perangkat Lunak" />`)}
      ${btnRow(btnPri("Simpan", "doAddJurusan()"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doAddJurusan() {
  const kode = document.getElementById("jr_kode").value.trim(),
    nama = document.getElementById("jr_nama").value.trim();
  if (!kode || !nama) {
    showToast("Kode dan nama wajib", "error");
    return;
  }
  try {
    await apiPost("/jurusan", { kode, nama });
    showToast("Jurusan ditambahkan");
    closeModal();
    renderJurusan();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditJurusanModal(id, kode, nama) {
  openModal(
    "Edit Jurusan",
    `
    <div class="space-y-4">
      ${FW("Kode", `<input id="jre_kode" value="${kode}" class="${IC()}" />`)}
      ${FW("Nama", `<input id="jre_nama" value="${nama}" class="${IC()}" />`)}
      ${btnRow(btnPri("Update", `doEditJurusan(${id})`), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}
async function doEditJurusan(id) {
  const kode = document.getElementById("jre_kode").value.trim(),
    nama = document.getElementById("jre_nama").value.trim();
  try {
    await apiPut(`/jurusan/${id}`, { kode, nama });
    showToast("Diupdate");
    closeModal();
    renderJurusan();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteJurusan(id) {
  if (!confirm("Hapus jurusan ini?")) return;
  try {
    await apiDelete(`/jurusan/${id}`);
    showToast("Dihapus");
    renderJurusan();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// KELAS
// ============================================================
let _kGurus = [],
  _kJurusans = [];
async function renderKelas() {
  setTitle("Kelas", "Kelola kelas dan wali kelas");
  loadingUI();
  try {
    const [kelasRes, guruRes, jurusanRes] = await Promise.all([
      apiGet(`/kelas?tahun_ajaran_id=${selectedSemesterId || ""}`),
      apiGet("/guru"),
      apiGet("/jurusan"),
    ]);
    _kGurus = guruRes.data;
    _kJurusans = jurusanRes.data;
    const grouped = {};
    kelasRes.data.forEach((k) => {
      (grouped[k.tingkat] = grouped[k.tingkat] || []).push(k);
    });
    setContent(`
      <div class="space-y-5">
        <div class="flex justify-between items-center">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Kelas (${kelasRes.data.length})</h3>
          <button onclick="showAddKelasModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all">
            <i class="fas fa-plus"></i>Tambah Kelas</button>
        </div>
        ${["X", "XI", "XII"]
          .map((t) =>
            !grouped[t]
              ? ""
              : ` 
          <div>
            <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs">${t}</span> Tingkat ${t}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              ${grouped[t]
                .map(
                  (k) => `
                <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 card-hover border border-gray-100 dark:border-slate-700">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h5 class="font-black text-blue-700 dark:text-blue-400">${k.nama}</h5>
                      <p class="text-gray-400 text-xs mt-0.5">${k.jurusan_nama}</p>
                      <p class="text-gray-400 text-xs">Walas: ${k.walas_nama || "—"}</p>
                    </div>
                    <span class="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg font-bold">${k.tingkat}</span>
                  </div>
                  <div class="flex gap-1.5">
                    <button onclick="viewKelasDetail(${k.id})" class="flex-1 text-xs py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg font-bold hover:bg-blue-100 transition-all">Detail</button>
                    <button onclick="showEditKelasModal(${k.id},'${k.nama}','${k.tingkat}',${k.jurusan_id},${k.wali_kelas_id || "null"})" class="flex-1 text-xs py-1.5 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-slate-600 transition-all">Edit</button>
                    <button onclick="deleteKelas(${k.id})" class="flex-1 text-xs py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-100 transition-all">Hapus</button>
                  </div>
                </div>`,
                )
                .join("")}
            </div>
          </div>`,
          )
          .join("")}
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
function showAddKelasModal() {
  openModal(
    "Tambah Kelas",
    `
    <div class="space-y-4">
      ${FW("Nama Kelas", `<input id="kl_nama" class="${IC()}" placeholder="X RPL 1" />`)}
      ${FW("Tingkat", `<select id="kl_tkt" class="${IC()}"><option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option></select>`)}
      ${FW("Jurusan", `<select id="kl_jur" class="${IC()}">${_kJurusans.map((j) => `<option value="${j.id}">${j.nama}</option>`).join("")}</select>`)}
      ${FW("Wali Kelas", `<select id="kl_wal" class="${IC()}"><option value="">— Pilih —</option>${_kGurus.map((g) => `<option value="${g.user_id}">${g.nama}</option>`).join("")}</select>`)}
      ${btnRow(btnPri("Simpan", "doAddKelas()"), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doAddKelas() {
  const body = {
    nama: document.getElementById("kl_nama").value.trim(),
    tingkat: document.getElementById("kl_tkt").value,
    jurusan_id: document.getElementById("kl_jur").value,
    tahun_ajaran_id: selectedSemesterId || activeSemesterId,
    wali_kelas_id: document.getElementById("kl_wal").value || null,
  };
  if (!body.nama) {
    showToast("Nama wajib", "error");
    return;
  }
  try {
    await apiPost("/kelas", body);
    showToast("Kelas ditambahkan");
    closeModal();
    renderKelas();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditKelasModal(id, nama, tkt, jurId, walId) {
  openModal(
    "Edit Kelas",
    `
    <div class="space-y-4">
      ${FW("Nama", `<input id="kle_nama" value="${nama}" class="${IC()}" />`)}
      ${FW("Tingkat", `<select id="kle_tkt" class="${IC()}"><option value="X" ${tkt === "X" ? "selected" : ""}>X</option><option value="XI" ${tkt === "XI" ? "selected" : ""}>XI</option><option value="XII" ${tkt === "XII" ? "selected" : ""}>XII</option></select>`)}
      ${FW("Jurusan", `<select id="kle_jur" class="${IC()}">${_kJurusans.map((j) => `<option value="${j.id}" ${j.id == jurId ? "selected" : ""}>${j.nama}</option>`).join("")}</select>`)}
      ${FW("Wali Kelas", `<select id="kle_wal" class="${IC()}"><option value="">— Tidak Ada —</option>${_kGurus.map((g) => `<option value="${g.user_id}" ${g.user_id == walId ? "selected" : ""}>${g.nama}</option>`).join("")}</select>`)}
      ${btnRow(btnPri(`Update`, `doEditKelas(${id})`), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doEditKelas(id) {
  const body = {
    nama: document.getElementById("kle_nama").value.trim(),
    tingkat: document.getElementById("kle_tkt").value,
    jurusan_id: document.getElementById("kle_jur").value,
    wali_kelas_id: document.getElementById("kle_wal").value || null,
  };
  try {
    await apiPut(`/kelas/${id}`, body);
    showToast("Kelas diupdate");
    closeModal();
    renderKelas();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteKelas(id) {
  if (!confirm("Hapus kelas ini?")) return;
  try {
    await apiDelete(`/kelas/${id}`);
    showToast("Dihapus");
    renderKelas();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function viewKelasDetail(kelasId) {
  try {
    const [kr, sr] = await Promise.all([
      apiGet(`/kelas/${kelasId}`),
      apiGet(`/kelas/${kelasId}/siswa?tahun_ajaran_id=${selectedSemesterId}`),
    ]);
    const k = kr.data,
      siswas = sr.data;
    openModal(
      `Detail: ${k.nama}`,
      `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-sm">
          <div><span class="text-gray-400 text-xs uppercase font-bold">Jurusan</span><p class="font-semibold mt-0.5 dark:text-white">${k.jurusan_nama}</p></div>
          <div><span class="text-gray-400 text-xs uppercase font-bold">Tingkat</span><p class="font-semibold mt-0.5 dark:text-white">${k.tingkat}</p></div>
          <div><span class="text-gray-400 text-xs uppercase font-bold">Wali Kelas</span><p class="font-semibold mt-0.5 dark:text-white">${k.walas_nama || "—"}</p></div>
          <div><span class="text-gray-400 text-xs uppercase font-bold">Jumlah Siswa</span><p class="font-semibold mt-0.5 dark:text-white">${siswas.length}</p></div>
        </div>
        <div class="overflow-y-auto max-h-64 rounded-xl border dark:border-slate-700">
          <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-900 sticky top-0"><tr>
            <th class="px-3 py-2 text-left text-xs font-black text-gray-500">NIS</th>
            <th class="px-3 py-2 text-left text-xs font-black text-gray-500">Nama</th>
            <th class="px-3 py-2 text-center text-xs font-black text-gray-500">Status</th>
          </tr></thead><tbody>
            ${siswas
              .map(
                (s) => `<tr class="border-t dark:border-slate-700">
              <td class="px-3 py-2 text-gray-400 font-mono text-xs">${s.nis}</td>
              <td class="px-3 py-2 dark:text-slate-200">${s.nama}</td>
              <td class="px-3 py-2 text-center">${s.is_ketua_kelas ? '<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold"><i class="fas fa-crown mr-1"></i>Ketua</span>' : '<span class="text-gray-400 text-xs">Anggota</span>'}</td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>
      </div>`,
      "max-w-lg",
    );
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// GURU
// ============================================================
let _gKelas = [];
async function renderGuru() {
  setTitle("Guru", "Kelola data guru");
  loadingUI();
  try {
    const [guruRes, kelasRes] = await Promise.all([
      apiGet("/guru"),
      apiGet(`/kelas?tahun_ajaran_id=${selectedSemesterId}`),
    ]);
    _gKelas = kelasRes.data;
    setContent(`
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Guru (${guruRes.data.length})</h3>
          <button onclick="showAddGuruModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all"><i class="fas fa-plus"></i>Tambah</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-900"><tr>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Nama / Email</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">NIP</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Wali Kelas</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">Aksi</th>
              </tr></thead>
              <tbody>
                ${guruRes.data
                  .map(
                    (
                      g,
                    ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
                  <td class="px-4 py-3"><div class="font-semibold dark:text-white">${g.nama}</div><div class="text-gray-400 text-xs">${g.email}</div></td>
                  <td class="px-4 py-3 font-mono text-gray-500 text-xs">${g.nip || "—"}</td>
                  <td class="px-4 py-3">${g.is_walas ? `<span class="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">${g.kelas_nama || "—"}</span>` : '<span class="text-gray-300">—</span>'}</td>
                  <td class="px-4 py-3">${g.is_active ? '<span class="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs px-2.5 py-1 rounded-full font-bold">Aktif</span>' : '<span class="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">Nonaktif</span>'}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    <button onclick="showEditGuruModal(${g.id},'${g.nama}','${g.email}','${g.nip || ""}',${g.is_walas},${g.kelas_id || "null"})" class="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                    <button onclick="resetPasswordGuru(${g.id})" class="text-amber-600 hover:underline text-xs font-bold">Reset Pass</button>
                    <button onclick="deleteGuru(${g.id})" class="text-red-500 hover:underline text-xs font-bold">Hapus</button>
                  </td>
                </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
function showAddGuruModal() {
  openModal(
    "Tambah Guru",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Nama", `<input id="gr_nama" class="${IC()}" />`)}
        ${FW("Email", `<input id="gr_email" type="email" class="${IC()}" />`)}
        ${FW("NIP", `<input id="gr_nip" class="${IC()}" placeholder="Nomor Induk Pegawai" />`)}
        ${FW("Password", `<input id="gr_pass" type="password" placeholder="Default: guru123" class="${IC()}" />`)}
      </div>
      <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
        <input type="checkbox" id="gr_walas" class="w-4 h-4 accent-blue-600" onchange="document.getElementById('grKelasWrap').classList.toggle('hidden',!this.checked)" />
        <label for="gr_walas" class="text-sm font-bold text-blue-800 dark:text-blue-300">Jadikan Wali Kelas</label>
      </div>
      <div id="grKelasWrap" class="hidden">
        ${FW("Kelas yang Diwalikan", `<select id="gr_kelas" class="${IC()}"><option value="">— Pilih Kelas —</option>${_gKelas.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}</select>`)}
      </div>
      ${btnRow(btnPri("Simpan", "doAddGuru()"), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doAddGuru() {
  const body = {
    nama: document.getElementById("gr_nama").value.trim(),
    email: document.getElementById("gr_email").value.trim(),
    nip: document.getElementById("gr_nip").value.trim(),
    password: document.getElementById("gr_pass").value || "guru123",
    is_walas: document.getElementById("gr_walas").checked,
    kelas_id: document.getElementById("gr_kelas")?.value || null,
  };
  if (!body.nama || !body.email) {
    showToast("Nama dan email wajib", "error");
    return;
  }
  try {
    await apiPost("/guru", body);
    showToast("Guru ditambahkan");
    closeModal();
    renderGuru();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditGuruModal(id, nama, email, nip, isWalas, kelasId) {
  openModal(
    "Edit Guru",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Nama", `<input id="gre_nama" value="${nama}" class="${IC()}" />`)}
        ${FW("Email", `<input id="gre_email" type="email" value="${email}" class="${IC()}" />`)}
        ${FW("NIP", `<input id="gre_nip" value="${nip}" class="${IC()}" />`)}
      </div>
      <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
        <input type="checkbox" id="gre_walas" class="w-4 h-4 accent-blue-600" ${isWalas ? "checked" : ""}
          onchange="document.getElementById('greKelasWrap').classList.toggle('hidden',!this.checked)" />
        <label for="gre_walas" class="text-sm font-bold text-blue-800 dark:text-blue-300">Wali Kelas</label>
      </div>
      <div id="greKelasWrap" class="${isWalas ? "" : "hidden"}">
        ${FW("Kelas", `<select id="gre_kelas" class="${IC()}"><option value="">— Tidak Ada —</option>${_gKelas.map((k) => `<option value="${k.id}" ${k.id == kelasId ? "selected" : ""}>${k.nama}</option>`).join("")}</select>`)}
      </div>
      ${btnRow(btnPri("Update", `doEditGuru(${id})`), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doEditGuru(id) {
  const body = {
    nama: document.getElementById("gre_nama").value.trim(),
    email: document.getElementById("gre_email").value.trim(),
    nip: document.getElementById("gre_nip").value.trim(),
    is_walas: document.getElementById("gre_walas").checked,
    kelas_id: document.getElementById("gre_kelas")?.value || null,
  };
  try {
    await apiPut(`/guru/${id}`, body);
    showToast("Guru diupdate");
    closeModal();
    renderGuru();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function resetPasswordGuru(id) {
  if (!confirm('Reset password jadi "guru123"?')) return;
  try {
    await apiPost(`/guru/${id}/reset-password`, {});
    showToast("Password direset ke: guru123");
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteGuru(id) {
  if (!confirm("Nonaktifkan guru ini?")) return;
  try {
    await apiDelete(`/guru/${id}`);
    showToast("Guru dinonaktifkan");
    renderGuru();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// SISWA
// ============================================================
let _sKelas = [];
async function renderSiswa() {
  setTitle("Siswa", "Kelola data siswa");
  loadingUI();
  try {
    const [siswaRes, kelasRes] = await Promise.all([
      apiGet(`/siswa?tahun_ajaran_id=${selectedSemesterId}&is_alumni=0`),
      apiGet(`/kelas?tahun_ajaran_id=${selectedSemesterId}`),
    ]);
    _sKelas = kelasRes.data;
    setContent(`
      <div class="space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Siswa (${siswaRes.data.length})</h3>
          <div class="flex gap-2">
            <button onclick="showBulkModal()" class="flex items-center gap-2 bg-gray-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-600 active:scale-95 transition-all"><i class="fas fa-tasks"></i>Bulk</button>
            <button onclick="showAddSiswaModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all"><i class="fas fa-plus"></i>Tambah</button>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <select id="sfKelas" onchange="filterSiswa()" class="border dark:border-slate-600 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-700 dark:text-white focus:outline-none">
            <option value="">Semua Kelas</option>
            ${_sKelas.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}
          </select>
          <input id="sfQ" oninput="filterSiswa()" placeholder="Cari nama / NIS..." class="border dark:border-slate-600 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-700 dark:text-white focus:outline-none w-48" />
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-900"><tr>
                <th class="px-4 py-3 w-10"><input type="checkbox" id="chkAll" onchange="toggleChkAll()" class="accent-blue-600" /></th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">NIS</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Nama</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Kelas</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">Aksi</th>
              </tr></thead>
              <tbody id="siswaTbl">
                ${siswaRes.data
                  .map(
                    (s) => `
                  <tr class="border-t dark:border-slate-700 table-row-hover" data-kelas="${s.kelas_id}" data-q="${s.nama.toLowerCase()} ${s.nis}">
                    <td class="px-4 py-3"><input type="checkbox" class="sw-chk accent-blue-600" value="${s.id}" /></td>
                    <td class="px-4 py-3 font-mono text-xs text-gray-400">${s.nis}</td>
                    <td class="px-4 py-3">
                      <div class="font-semibold dark:text-white">${s.nama}</div>
                      ${s.is_ketua_kelas ? '<span class="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold"><i class="fas fa-crown mr-1"></i>Ketua</span>' : ""}
                    </td>
                    <td class="px-4 py-3 dark:text-slate-300">${s.kelas_nama}</td>
                    <td class="px-4 py-3">${s.is_active ? '<span class="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs px-2.5 py-1 rounded-full font-bold">Aktif</span>' : '<span class="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">Nonaktif</span>'}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button onclick="showEditSiswaModal(${s.id},'${s.nama}','${s.email}','${s.nis}',${s.kelas_id},${s.is_ketua_kelas})" class="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                      <button onclick="viewSiswaAbsensi(${s.id})" class="text-purple-600 hover:underline text-xs font-bold">Absensi</button>
                      <button onclick="deleteSiswa(${s.id})" class="text-red-500 hover:underline text-xs font-bold">Hapus</button>
                    </td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
function toggleChkAll() {
  const v = document.getElementById("chkAll").checked;
  document.querySelectorAll(".sw-chk").forEach((c) => (c.checked = v));
}
function filterSiswa() {
  const kelas = document.getElementById("sfKelas").value;
  const q = document.getElementById("sfQ").value.toLowerCase();
  document.querySelectorAll("#siswaTbl tr").forEach((r) => {
    const kMatch = !kelas || r.dataset.kelas === kelas;
    const qMatch = !q || (r.dataset.q || "").includes(q);
    r.style.display = kMatch && qMatch ? "" : "none";
  });
}
function showBulkModal() {
  openModal(
    "Bulk Aksi Siswa",
    `
    <div class="space-y-3">
      <p class="text-sm text-gray-500 dark:text-slate-400">Aksi untuk siswa yang dicentang di tabel.</p>
      <button onclick="doBulk('activate')"    class="w-full flex items-center gap-3 bg-green-500 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-green-600 transition-all"><i class="fas fa-check w-5"></i>Aktifkan Terpilih</button>
      <button onclick="doBulk('deactivate')"  class="w-full flex items-center gap-3 bg-red-500 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-red-600 transition-all"><i class="fas fa-ban w-5"></i>Nonaktifkan Terpilih</button>
      <button onclick="doBulk('set-ketua')"   class="w-full flex items-center gap-3 bg-amber-500 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all"><i class="fas fa-crown w-5"></i>Set Ketua (siswa pertama dipilih)</button>
      ${btnRow(btnSec("Tutup", "closeModal()"))}
    </div>`,
    "max-w-sm",
  );
}
async function doBulk(action) {
  const ids = [...document.querySelectorAll(".sw-chk:checked")].map((c) =>
    parseInt(c.value),
  );
  if (!ids.length) {
    showToast("Pilih siswa dulu", "error");
    return;
  }
  try {
    const r = await apiPost("/siswa/bulk-action", { action, ids });
    showToast(r.message);
    closeModal();
    renderSiswa();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showAddSiswaModal() {
  openModal(
    "Tambah Siswa",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Nama", `<input id="sw_nama" class="${IC()}" />`)}
        ${FW("Email", `<input id="sw_email" type="email" class="${IC()}" />`)}
        ${FW("NIS", `<input id="sw_nis" class="${IC()}" placeholder="Nomor Induk Siswa" />`)}
        ${FW("Password", `<input id="sw_pass" type="password" placeholder="Default: siswa123" class="${IC()}" />`)}
      </div>
      ${FW("Kelas", `<select id="sw_kelas" class="${IC()}"><option value="">— Pilih Kelas —</option>${_sKelas.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}</select>`)}
      <div class="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
        <input type="checkbox" id="sw_ketua" class="w-4 h-4 accent-amber-600" />
        <label for="sw_ketua" class="text-sm font-bold text-amber-800 dark:text-amber-300">Jadikan Ketua Kelas</label>
      </div>
      ${btnRow(btnPri("Simpan", "doAddSiswa()"), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doAddSiswa() {
  const body = {
    nama: document.getElementById("sw_nama").value.trim(),
    email: document.getElementById("sw_email").value.trim(),
    nis: document.getElementById("sw_nis").value.trim(),
    password: document.getElementById("sw_pass").value || "siswa123",
    kelas_id: document.getElementById("sw_kelas").value,
    tahun_ajaran_id: selectedSemesterId || activeSemesterId,
    is_ketua_kelas: document.getElementById("sw_ketua").checked,
  };
  if (!body.nama || !body.email || !body.nis || !body.kelas_id) {
    showToast("Nama, email, NIS, kelas wajib", "error");
    return;
  }
  try {
    await apiPost("/siswa", body);
    showToast("Siswa ditambahkan");
    closeModal();
    renderSiswa();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditSiswaModal(id, nama, email, nis, kelasId, isKetua) {
  openModal(
    "Edit Siswa",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Nama", `<input id="swe_nama" value="${nama}" class="${IC()}" />`)}
        ${FW("Email", `<input id="swe_email" type="email" value="${email}" class="${IC()}" />`)}
        ${FW("NIS", `<input id="swe_nis" value="${nis}" class="${IC()}" />`)}
      </div>
      ${FW("Kelas", `<select id="swe_kelas" class="${IC()}">${_sKelas.map((k) => `<option value="${k.id}" ${k.id == kelasId ? "selected" : ""}>${k.nama}</option>`).join("")}</select>`)}
      <div class="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
        <input type="checkbox" id="swe_ketua" class="w-4 h-4 accent-amber-600" ${isKetua ? "checked" : ""} />
        <label for="swe_ketua" class="text-sm font-bold text-amber-800 dark:text-amber-300">Ketua Kelas</label>
      </div>
      ${btnRow(btnPri("Update", `doEditSiswa(${id})`), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doEditSiswa(id) {
  const body = {
    nama: document.getElementById("swe_nama").value.trim(),
    email: document.getElementById("swe_email").value.trim(),
    nis: document.getElementById("swe_nis").value.trim(),
    kelas_id: document.getElementById("swe_kelas").value,
    is_ketua_kelas: document.getElementById("swe_ketua").checked,
  };
  try {
    await apiPut(`/siswa/${id}`, body);
    showToast("Siswa diupdate");
    closeModal();
    renderSiswa();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteSiswa(id) {
  if (!confirm("Nonaktifkan siswa?")) return;
  try {
    await apiDelete(`/siswa/${id}`);
    showToast("Siswa dinonaktifkan");
    renderSiswa();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function viewSiswaAbsensi(siswaId) {
  try {
    const res = await apiGet(
      `/absensi/siswa/${siswaId}?tahun_ajaran_id=${selectedSemesterId}`,
    );
    const d = res.data,
      st = res.stats || {};
    openModal(
      "Riwayat Absensi Siswa",
      `
      <div class="space-y-4">
        <div class="grid grid-cols-4 gap-2">
          ${miniCard("Hadir", st.hadir || 0, "text-green-600 bg-green-50")}
          ${miniCard("Sakit", st.sakit || 0, "text-blue-600 bg-blue-50")}
          ${miniCard("Izin", st.izin || 0, "text-amber-600 bg-amber-50")}
          ${miniCard("Alpha", st.alpha || 0, "text-red-600 bg-red-50")}
        </div>
        <div class="overflow-y-auto max-h-60 rounded-xl border dark:border-slate-700">
          <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-900 sticky top-0"><tr>
            <th class="px-3 py-2 text-left text-xs font-black text-gray-500">Tanggal</th>
            <th class="px-3 py-2 text-center text-xs font-black text-gray-500">Status</th>
          </tr></thead><tbody>
            ${d.map((a) => `<tr class="border-t dark:border-slate-700"><td class="px-3 py-2 text-gray-500">${a.tanggal?.slice(0, 10)}</td><td class="px-3 py-2 text-center">${stBadge(a.status)}</td></tr>`).join("") || '<tr><td colspan="2" class="text-center py-8 text-gray-400">Belum ada data</td></tr>'}
          </tbody></table>
        </div>
      </div>`,
      "max-w-md",
    );
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// MAPEL
// ============================================================
async function renderMapel() {
  setTitle("Mata Pelajaran", "Kelola mapel");
  loadingUI();
  try {
    const data = await apiGet("/mapel");
    setContent(`
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Mapel (${data.data.length})</h3>
          <button onclick="showAddMapelModal()" class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all"><i class="fas fa-plus"></i>Tambah</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-900"><tr>
            <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">Kode</th>
            <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">Nama</th>
            <th class="px-5 py-3 text-right text-xs font-black text-gray-500 uppercase">Aksi</th>
          </tr></thead><tbody>
            ${data.data
              .map(
                (
                  m,
                ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
              <td class="px-5 py-3 font-black font-mono text-blue-700 dark:text-blue-400">${m.kode}</td>
              <td class="px-5 py-3 font-medium dark:text-slate-200">${m.nama}</td>
              <td class="px-5 py-3 text-right">
                <button onclick="showEditMapelModal(${m.id},'${m.kode}','${m.nama}')" class="text-blue-600 hover:underline text-xs font-bold mr-3">Edit</button>
                <button onclick="deleteMapel(${m.id})" class="text-red-500 hover:underline text-xs font-bold">Hapus</button>
              </td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
function showAddMapelModal() {
  openModal(
    "Tambah Mapel",
    `<div class="space-y-4">${FW("Kode", `<input id="mp_kode" class="${IC()}" placeholder="MAT" />`)}${FW("Nama", `<input id="mp_nama" class="${IC()}" placeholder="Matematika" />`)}${btnRow(btnPri("Simpan", "doAddMapel()"), btnSec("Batal", "closeModal()"))}</div>`,
    "max-w-md",
  );
}
async function doAddMapel() {
  const kode = document.getElementById("mp_kode").value.trim(),
    nama = document.getElementById("mp_nama").value.trim();
  if (!kode || !nama) {
    showToast("Wajib isi", "error");
    return;
  }
  try {
    await apiPost("/mapel", { kode, nama });
    showToast("Ditambahkan");
    closeModal();
    renderMapel();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditMapelModal(id, kode, nama) {
  openModal(
    "Edit Mapel",
    `<div class="space-y-4">${FW("Kode", `<input id="mpe_kode" value="${kode}" class="${IC()}" />`)}${FW("Nama", `<input id="mpe_nama" value="${nama}" class="${IC()}" />`)}${btnRow(btnPri("Update", `doEditMapel(${id})`), btnSec("Batal", "closeModal()"))}</div>`,
    "max-w-md",
  );
}
async function doEditMapel(id) {
  const kode = document.getElementById("mpe_kode").value.trim(),
    nama = document.getElementById("mpe_nama").value.trim();
  try {
    await apiPut(`/mapel/${id}`, { kode, nama });
    showToast("Diupdate");
    closeModal();
    renderMapel();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteMapel(id) {
  if (!confirm("Hapus mapel?")) return;
  try {
    await apiDelete(`/mapel/${id}`);
    showToast("Dihapus");
    renderMapel();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// JADWAL — SISTEM BLOK MINGGU
// ============================================================
let _jKelas = [],
  _jGurus = [],
  _jMapels = [];
async function renderJadwal() {
  setTitle(
    "Jadwal Blok Minggu",
    "Sistem blok praktek & teori bergantian per minggu",
  );
  loadingUI();
  try {
    const taParam = `tahun_ajaran_id=${selectedSemesterId}`;
    const guruParam =
      currentUser.role === "guru" && currentUser.guru_id
        ? `&guru_id=${currentUser.guru_id}`
        : "";
    const [jadwalRes, kelasRes, guruRes, mapelRes, jurusanRes] =
      await Promise.all([
        apiGet(`/jadwal?${taParam}${guruParam}`),
        apiGet(`/kelas?${taParam}`),
        apiGet("/guru"),
        apiGet("/mapel"),
        apiGet("/jurusan"),
      ]);
    _jKelas = kelasRes.data;
    _jGurus = guruRes.data;
    _jMapels = mapelRes.data;
    window._jJurusans = jurusanRes.data;

    const weekInfo = updateWeekInfo();
    setContent(`
      <div class="space-y-5">
        <!-- Info Blok Minggu -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 class="font-black text-lg">Sistem Blok Minggu</h3>
              <p class="text-white/70 text-sm mt-1">Jadwal praktek & teori bergantian setiap minggu berdasarkan urutan jurusan</p>
            </div>
            <div class="text-right">
              <p class="text-white/60 text-xs">Minggu Sekarang</p>
              <p class="font-black text-xl">ke-${weekInfo.weekNum}</p>
              <span class="text-xs font-bold px-3 py-1 rounded-full ${weekInfo.isGanjil ? "bg-orange-400/30 text-orange-100" : "bg-blue-400/30 text-blue-100"}">${weekInfo.isGanjil ? "GANJIL — Jurusan 1 Praktek" : "GENAP — Jurusan 2 Praktek"}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="bg-white/15 rounded-xl p-3">
              <p class="text-xs font-bold text-orange-300 uppercase tracking-wider mb-1"><i class="fas fa-tools mr-1"></i>Minggu Ganjil</p>
              <p class="text-sm font-semibold">Jurusan Urutan 1 → <strong>Praktek</strong></p>
              <p class="text-sm font-semibold">Jurusan Urutan 2 → <strong>Teori</strong></p>
            </div>
            <div class="bg-white/15 rounded-xl p-3">
              <p class="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1"><i class="fas fa-book mr-1"></i>Minggu Genap</p>
              <p class="text-sm font-semibold">Jurusan Urutan 1 → <strong>Teori</strong></p>
              <p class="text-sm font-semibold">Jurusan Urutan 2 → <strong>Praktek</strong></p>
            </div>
          </div>
        </div>

        ${
          currentUser.role === "admin"
            ? `
        <!-- Atur Urutan Jurusan -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider mb-4">Urutan Jurusan untuk Blok</h3>

          <!-- BARIS ATAS: Kelas 1 tiap jurusan -->
          <div class="mb-5">
            <p class="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <i class="fas fa-tools"></i> Jurusan 1 (Kelas ke-1 setiap Jurusan)
            </p>
            <div class="grid grid-cols-5 gap-3">
              ${jurusanRes.data
                .map(
                  (j) => `
              <div class="border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 text-center">
                <div class="font-black text-2xl text-orange-500">${j.kode} <span class="text-2xl">1</span></div>
                <div class="text-xs text-gray-400 mt-0.5">${j.nama}</div>
                <div class="mt-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">→ Jurusan 1</span>
                </div>
              </div>`,
                )
                .join("")}
            </div>
          </div>

          <!-- BARIS BAWAH: Kelas 2 tiap jurusan -->
          <div>
            <p class="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <i class="fas fa-book"></i> Jurusan 2 (Kelas ke-2 setiap Jurusan)
            </p>
            <div class="grid grid-cols-5 gap-3">
              ${jurusanRes.data
                .map(
                  (j) => `
              <div class="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
                <div class="font-black text-2xl text-blue-500">${j.kode} <span class="text-2xl">2</span></div>
                <div class="text-xs text-gray-400 mt-0.5">${j.nama}</div>
                <div class="mt-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">→ Jurusan 2</span>
                </div>
              </div>`,
                )
                .join("")}
            </div>
          </div>

          <p class="text-xs text-gray-400 mt-3"><i class="fas fa-info-circle mr-1"></i>Kelas ke-1 setiap jurusan praktek di minggu ganjil. Kelas ke-2 praktek di minggu genap.</p>
        </div>`
            : ""
        }

        <!-- Daftar Jadwal -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <div class="p-4 border-b dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Jadwal Mengajar (${jadwalRes.data.length})</h3>
            ${
              currentUser.role === "admin"
                ? `
            <div class="flex gap-2">
              <button onclick="showJadwalBantuanModal()" class="flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all">
                <i class="fas fa-magic"></i>Auto Generate</button>
              <button onclick="showAddJadwalModal()" class="flex items-center gap-2 bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 active:scale-95 transition-all">
                <i class="fas fa-plus"></i>Tambah Manual</button>
            </div>`
                : ""
            }
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-900"><tr>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Hari</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Jam</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Kelas</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Mapel</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Guru</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Tipe Sesi</th>
                <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Pola Minggu</th>
                ${currentUser.role === "admin" ? '<th class="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">Aksi</th>' : ""}
              </tr></thead>
              <tbody>
                ${
                  jadwalRes.data.length
                    ? jadwalRes.data
                        .map(
                          (j) => `
                  <tr class="border-t dark:border-slate-700 table-row-hover">
                    <td class="px-4 py-3 font-bold dark:text-white">${j.hari}</td>
                    <td class="px-4 py-3 font-mono text-xs text-gray-400">${j.jam_mulai?.slice(0, 5)}–${j.jam_selesai?.slice(0, 5)}</td>
                    <td class="px-4 py-3 dark:text-slate-200">${j.kelas_nama}</td>
                    <td class="px-4 py-3 dark:text-slate-300">${j.mapel_nama}</td>
                    <td class="px-4 py-3 text-gray-500">${j.guru_nama}</td>
                    <td class="px-4 py-3">${tipeBadge(j.tipe_sesi)}</td>
                    <td class="px-4 py-3">${polaBadge(j.pola_minggu)}</td>
                    ${
                      currentUser.role === "admin"
                        ? `<td class="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button onclick="showEditJadwalModal(${j.id},${j.guru_id},${j.kelas_id},${j.mapel_id},'${j.hari}','${j.jam_mulai?.slice(0, 5)}','${j.jam_selesai?.slice(0, 5)}','${j.tipe_sesi || "teori"}','${j.pola_minggu || "semua"}')" class="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                      <button onclick="deleteJadwal(${j.id})" class="text-red-500 hover:underline text-xs font-bold">Hapus</button>
                    </td>`
                        : ""
                    }
                  </tr>`,
                        )
                        .join("")
                    : `<tr><td colspan="8" class="text-center py-12 text-gray-400"><i class="fas fa-calendar-times text-3xl mb-2 block"></i>Belum ada jadwal</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

function showAddJadwalModal() {
  const haris = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  openModal(
    "Tambah Jadwal",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Kelas", `<select id="jd_kelas" class="${IC()}">${_jKelas.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}</select>`)}
        ${FW("Guru", `<select id="jd_guru" class="${IC()}">${_jGurus.map((g) => `<option value="${g.id}">${g.nama}</option>`).join("")}</select>`)}
        ${FW("Mata Pelajaran", `<select id="jd_mapel" class="${IC()}">${_jMapels.map((m) => `<option value="${m.id}">${m.nama}</option>`).join("")}</select>`)}
        ${FW("Hari", `<select id="jd_hari" class="${IC()}">${haris.map((h) => `<option value="${h}">${h}</option>`).join("")}</select>`)}
        ${FW("Jam Mulai", `<input id="jd_mulai" type="time" class="${IC()}" />`)}
        ${FW("Jam Selesai", `<input id="jd_selesai" type="time" class="${IC()}" />`)}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${FW("Tipe Sesi", `<select id="jd_tipe" class="${IC()}"><option value="teori">Teori</option><option value="praktek">Praktek</option></select>`)}
        ${FW(
          "Pola Minggu",
          `<select id="jd_pola" class="${IC()}">
          <option value="semua">Semua Minggu</option>
          <option value="ganjil">Minggu Ganjil (Jur.1 Praktek)</option>
          <option value="genap">Minggu Genap (Jur.2 Praktek)</option>
        </select>`,
        )}
      </div>
      <div class="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl text-xs text-blue-700 dark:text-blue-300">
        <i class="fas fa-lightbulb mr-1"></i><strong>Tips Blok:</strong> Pilih "Minggu Ganjil" untuk jadwal jurusan urutan ke-1 praktek. "Minggu Genap" untuk jurusan urutan ke-2 praktek. Tipe sesi menunjukkan apa yang dilakukan pada pola minggu tersebut.
      </div>
      ${btnRow(btnPri("Simpan", "doAddJadwal()"), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doAddJadwal() {
  const body = {
    kelas_id: document.getElementById("jd_kelas").value,
    guru_id: document.getElementById("jd_guru").value,
    mapel_id: document.getElementById("jd_mapel").value,
    hari: document.getElementById("jd_hari").value,
    jam_mulai: document.getElementById("jd_mulai").value,
    jam_selesai: document.getElementById("jd_selesai").value,
    tipe_sesi: document.getElementById("jd_tipe").value,
    pola_minggu: document.getElementById("jd_pola").value,
    tahun_ajaran_id: selectedSemesterId || activeSemesterId,
  };
  if (!body.jam_mulai || !body.jam_selesai) {
    showToast("Jam mulai & selesai wajib", "error");
    return;
  }
  try {
    await apiPost("/jadwal", body);
    showToast("Jadwal ditambahkan");
    closeModal();
    renderJadwal();
  } catch (err) {
    showToast(err.message, "error");
  }
}
function showEditJadwalModal(
  id,
  guruId,
  kelasId,
  mapelId,
  hari,
  mulai,
  selesai,
  tipe,
  pola,
) {
  const haris = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  openModal(
    "Edit Jadwal",
    `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        ${FW("Kelas", `<select id="jde_kelas" class="${IC()}">${_jKelas.map((k) => `<option value="${k.id}" ${k.id == kelasId ? "selected" : ""}>${k.nama}</option>`).join("")}</select>`)}
        ${FW("Guru", `<select id="jde_guru" class="${IC()}">${_jGurus.map((g) => `<option value="${g.id}" ${g.id == guruId ? "selected" : ""}>${g.nama}</option>`).join("")}</select>`)}
        ${FW("Mata Pelajaran", `<select id="jde_mapel" class="${IC()}">${_jMapels.map((m) => `<option value="${m.id}" ${m.id == mapelId ? "selected" : ""}>${m.nama}</option>`).join("")}</select>`)}
        ${FW("Hari", `<select id="jde_hari" class="${IC()}">${haris.map((h) => `<option value="${h}" ${h === hari ? "selected" : ""}>${h}</option>`).join("")}</select>`)}
        ${FW("Jam Mulai", `<input id="jde_mulai" type="time" value="${mulai}" class="${IC()}" />`)}
        ${FW("Jam Selesai", `<input id="jde_selesai" type="time" value="${selesai}" class="${IC()}" />`)}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${FW("Tipe Sesi", `<select id="jde_tipe" class="${IC()}"><option value="teori" ${tipe === "teori" ? "selected" : ""}>Teori</option><option value="praktek" ${tipe === "praktek" ? "selected" : ""}>Praktek</option></select>`)}
        ${FW(
          "Pola Minggu",
          `<select id="jde_pola" class="${IC()}">
          <option value="semua" ${pola === "semua" ? "selected" : ""}>Semua Minggu</option>
          <option value="ganjil" ${pola === "ganjil" ? "selected" : ""}>Minggu Ganjil</option>
          <option value="genap" ${pola === "genap" ? "selected" : ""}>Minggu Genap</option>
        </select>`,
        )}
      </div>
      ${btnRow(btnPri("Update", `doEditJadwal(${id})`), btnSec("Batal", "closeModal()"))}
    </div>`,
  );
}
async function doEditJadwal(id) {
  const body = {
    kelas_id: document.getElementById("jde_kelas").value,
    guru_id: document.getElementById("jde_guru").value,
    mapel_id: document.getElementById("jde_mapel").value,
    hari: document.getElementById("jde_hari").value,
    jam_mulai: document.getElementById("jde_mulai").value,
    jam_selesai: document.getElementById("jde_selesai").value,
    tipe_sesi: document.getElementById("jde_tipe").value,
    pola_minggu: document.getElementById("jde_pola").value,
  };
  try {
    await apiPut(`/jadwal/${id}`, body);
    showToast("Jadwal diupdate");
    closeModal();
    renderJadwal();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function deleteJadwal(id) {
  if (!confirm("Hapus jadwal ini?")) return;
  try {
    await apiDelete(`/jadwal/${id}`);
    showToast("Jadwal dihapus");
    renderJadwal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// ABSENSI HARIAN
// ============================================================
async function renderAbsensiHarian() {
  setTitle("Absensi Harian", "Input kehadiran harian siswa");
  loadingUI();
  try {
    const kelasRes = await apiGet(
      `/kelas?tahun_ajaran_id=${selectedSemesterId}`,
    );
    const today = new Date().toISOString().slice(0, 10);
    const weekInfo = updateWeekInfo(today);
    setContent(`
      <div class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider mb-4">Pilih Kelas & Tanggal</h3>
          <div class="flex gap-3 flex-wrap items-end">
            <div>
              ${LB("Kelas")}
              <select id="pilihKelas" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48">
                <option value="">— Pilih Kelas —</option>
                ${kelasRes.data.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}
              </select>
            </div>
            <div>
              ${LB("Tanggal")}
              <input id="tglAbsen" type="date" value="${today}" onchange="updateWeekInfo(this.value)" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onclick="loadAbsenHarian()" class="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all">
              <i class="fas fa-search mr-2"></i>Muat Siswa</button>
          </div>
        </div>
        <div id="absenHarianForm"></div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function loadAbsenHarian() {
  const kelasId = document.getElementById("pilihKelas").value;
  const tanggal = document.getElementById("tglAbsen").value;
  if (!kelasId) {
    showToast("Pilih kelas dahulu", "error");
    return;
  }
  if (!tanggal) {
    showToast("Pilih tanggal dahulu", "error");
    return;
  }
  const div = document.getElementById("absenHarianForm");
  div.innerHTML = `<div class="flex items-center justify-center py-10 text-gray-400 gap-2"><div class="w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div><span class="text-sm">Memuat...</span></div>`;
  try {
    const [siswaRes, existRes] = await Promise.all([
      apiGet(`/kelas/${kelasId}/siswa?tahun_ajaran_id=${selectedSemesterId}`),
      apiGet(
        `/absensi/harian?kelas_id=${kelasId}&tanggal=${tanggal}&tahun_ajaran_id=${selectedSemesterId}`,
      ),
    ]);
    if (!siswaRes.data.length) {
      div.innerHTML =
        '<div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 p-4 rounded-xl text-sm">Tidak ada siswa di kelas ini.</div>';
      return;
    }
    const exMap = {};
    existRes.data.forEach((a) => (exMap[a.siswa_id] = a));
    div.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
        <div class="p-4 bg-blue-700 flex items-center justify-between flex-wrap gap-2">
          <div><span class="font-black text-white">${tanggal}</span><span class="text-blue-200 text-sm ml-2">(${siswaRes.data.length} siswa)</span></div>
          <div class="flex gap-2">
            <button onclick="setAll('hadir')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-400 transition-all">Semua Hadir</button>
            <button onclick="submitAbsenHarian('${kelasId}','${tanggal}')" class="bg-white text-blue-700 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-blue-50 transition-all">
              <i class="fas fa-save mr-1"></i>Simpan</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-slate-900"><tr>
              <th class="px-4 py-2 text-left text-xs font-black text-gray-500 w-8">#</th>
              <th class="px-4 py-2 text-left text-xs font-black text-gray-500">Siswa</th>
              <th class="px-4 py-2 text-center text-xs font-black text-green-600">Hadir</th>
              <th class="px-4 py-2 text-center text-xs font-black text-blue-600">Sakit</th>
              <th class="px-4 py-2 text-center text-xs font-black text-amber-600">Izin</th>
              <th class="px-4 py-2 text-center text-xs font-black text-red-600">Alpha</th>
            </tr></thead>
            <tbody class="divide-y dark:divide-slate-700">
              ${siswaRes.data
                .map((s, i) => {
                  const curr = exMap[s.id];
                  return `<tr class="table-row-hover">
                  <td class="px-4 py-3 text-gray-400 text-xs font-mono">${i + 1}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold dark:text-white text-sm">${s.nama}</div>
                    <div class="text-gray-400 text-xs">${s.nis}${s.is_ketua_kelas ? ' · <span class="text-amber-500">Ketua</span>' : ""}</div>
                  </td>
                  ${["hadir", "sakit", "izin", "alpha"]
                    .map(
                      (st) => `<td class="px-4 py-3 text-center">
                    <label class="cursor-pointer flex justify-center">
                      <input type="radio" name="ab_${s.id}" value="${st}" ${(!curr && st === "hadir") || curr?.status === st ? "checked" : ""} class="w-5 h-5 ${st === "hadir" ? "accent-green-500" : st === "sakit" ? "accent-blue-500" : st === "izin" ? "accent-amber-500" : "accent-red-500"}" />
                    </label>
                  </td>`,
                    )
                    .join("")}
                </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`;
    window._absenList = siswaRes.data;
  } catch (err) {
    div.innerHTML = `<p class="text-red-500 p-4 text-sm">${err.message}</p>`;
  }
}

function setAll(status) {
  (window._absenList || []).forEach((s) => {
    const el = document.querySelector(
      `input[name="ab_${s.id}"][value="${status}"]`,
    );
    if (el) el.checked = true;
  });
}
async function submitAbsenHarian(kelasId, tanggal) {
  const siswas = window._absenList;
  if (!siswas?.length) {
    showToast("Muat data dulu", "error");
    return;
  }
  const data = siswas.map((s) => {
    const sel = document.querySelector(`input[name="ab_${s.id}"]:checked`);
    return {
      siswa_id: s.id,
      status: sel ? sel.value : "hadir",
      keterangan: "",
    };
  });
  try {
    const r = await apiPost("/absensi/harian/bulk", {
      kelas_id: parseInt(kelasId),
      tanggal,
      tahun_ajaran_id: parseInt(selectedSemesterId || activeSemesterId),
      data,
    });
    showToast(r.message);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// ABSENSI MAPEL
// ============================================================
async function renderAbsensiMapel() {
  setTitle("Absensi Mata Pelajaran", "Input absensi per mapel");
  loadingUI();
  try {
    const taParam = `tahun_ajaran_id=${selectedSemesterId}`;
    const guruParam =
      currentUser.role === "guru" && currentUser.guru_id
        ? `&guru_id=${currentUser.guru_id}`
        : "";
    const jadwalRes = await apiGet(`/jadwal?${taParam}${guruParam}`);
    const today = new Date().toISOString().slice(0, 10);
    setContent(`
      <div class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <div class="flex gap-3 flex-wrap items-end">
            <div class="flex-1 min-w-48">
              ${LB("Pilih Jadwal")}
              <select id="pilihJadwal" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full">
                <option value="">— Pilih Jadwal —</option>
                ${jadwalRes.data.map((j) => `<option value="${j.id}" data-kelas="${j.kelas_id}">${j.kelas_nama} — ${j.mapel_nama} (${j.hari} ${j.jam_mulai?.slice(0, 5)})</option>`).join("")}
              </select>
            </div>
            <div>
              ${LB("Tanggal")}
              <input id="tglMapel" type="date" value="${today}" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <button onclick="loadAbsenMapel()" class="bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-800 active:scale-95 transition-all">
              <i class="fas fa-search mr-2"></i>Muat</button>
          </div>
        </div>
        <div id="absenMapelForm"></div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function loadAbsenMapel() {
  const sel = document.getElementById("pilihJadwal");
  const jadwalId = sel.value,
    kelasId = sel.selectedOptions[0]?.dataset?.kelas;
  const tanggal = document.getElementById("tglMapel").value;
  if (!jadwalId) {
    showToast("Pilih jadwal dahulu", "error");
    return;
  }
  const div = document.getElementById("absenMapelForm");
  div.innerHTML = `<div class="flex items-center justify-center py-10 text-gray-400 gap-2"><div class="w-6 h-6 border-2 border-t-purple-500 border-gray-200 rounded-full animate-spin"></div><span class="text-sm">Memuat...</span></div>`;
  try {
    const [siswaRes, existRes] = await Promise.all([
      apiGet(`/kelas/${kelasId}/siswa?tahun_ajaran_id=${selectedSemesterId}`),
      apiGet(
        `/absensi/mapel?jadwal_id=${jadwalId}&tanggal=${tanggal}&tahun_ajaran_id=${selectedSemesterId}`,
      ),
    ]);
    const exMap = {};
    existRes.data.forEach((a) => (exMap[a.siswa_id] = a));
    div.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
        <div class="p-4 bg-purple-700 flex items-center justify-between flex-wrap gap-2">
          <span class="font-black text-white">Absensi Mapel — ${tanggal}</span>
          <div class="flex gap-2">
            <button onclick="setAllMapel('hadir')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-400">Semua Hadir</button>
            <button onclick="submitAbsenMapel('${jadwalId}','${tanggal}')" class="bg-white text-purple-700 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-purple-50">
              <i class="fas fa-save mr-1"></i>Simpan</button>
          </div>
        </div>
        <table class="w-full text-sm">
          <tbody class="divide-y dark:divide-slate-700">
            ${siswaRes.data
              .map((s, i) => {
                const curr = exMap[s.id];
                return `<tr class="table-row-hover">
                <td class="px-4 py-3 w-8 text-gray-400 text-xs">${i + 1}</td>
                <td class="px-4 py-3"><span class="font-semibold dark:text-white">${s.nama}</span><span class="text-gray-400 text-xs ml-2">${s.nis}</span></td>
                ${["hadir", "sakit", "izin", "alpha"]
                  .map(
                    (st) => `<td class="px-4 py-3 text-center">
                  <label class="flex flex-col items-center gap-0.5 cursor-pointer">
                    <input type="radio" name="mp_${s.id}" value="${st}" ${(!curr && st === "hadir") || curr?.status === st ? "checked" : ""} class="w-5 h-5 ${st === "hadir" ? "accent-green-500" : st === "sakit" ? "accent-blue-500" : st === "izin" ? "accent-amber-500" : "accent-red-500"}" />
                    <span class="text-xs ${st === "hadir" ? "text-green-600" : st === "sakit" ? "text-blue-600" : st === "izin" ? "text-amber-600" : "text-red-600"}">${st}</span>
                  </label>
                </td>`,
                  )
                  .join("")}
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`;
    window._mapelList = siswaRes.data;
  } catch (err) {
    div.innerHTML = `<p class="text-red-500 p-4 text-sm">${err.message}</p>`;
  }
}

function setAllMapel(status) {
  (window._mapelList || []).forEach((s) => {
    const el = document.querySelector(
      `input[name="mp_${s.id}"][value="${status}"]`,
    );
    if (el) el.checked = true;
  });
}
async function submitAbsenMapel(jadwalId, tanggal) {
  const siswas = window._mapelList;
  if (!siswas?.length) {
    showToast("Muat data dulu", "error");
    return;
  }
  const data = siswas.map((s) => {
    const sel = document.querySelector(`input[name="mp_${s.id}"]:checked`);
    return { siswa_id: s.id, status: sel ? sel.value : "hadir" };
  });
  try {
    const r = await apiPost("/absensi/mapel/bulk", {
      jadwal_id: parseInt(jadwalId),
      tanggal,
      tahun_ajaran_id: parseInt(selectedSemesterId || activeSemesterId),
      data,
    });
    showToast(r.message);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// ABSENSI SISWA (self)
// ============================================================
async function renderAbsensiSiswa() {
  setTitle("Riwayat Absensi", "Rekap kehadiran saya");
  loadingUI();
  try {
    const siswaId = currentUser.siswa_id;
    if (!siswaId) {
      setContent(
        '<p class="text-gray-400 text-center py-10">Data siswa tidak ditemukan.</p>',
      );
      return;
    }
    const res = await apiGet(
      `/absensi/siswa/${siswaId}?tahun_ajaran_id=${selectedSemesterId}`,
    );
    const d = res.data,
      st = res.stats || {};
    const pct = st.total ? Math.round((st.hadir / st.total) * 100) : 0;
    setContent(`
      <div class="space-y-4">
        <div class="grid grid-cols-4 gap-3">
          ${miniCard("Hadir", st.hadir || 0, "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400")}
          ${miniCard("Sakit", st.sakit || 0, "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400")}
          ${miniCard("Izin", st.izin || 0, "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400")}
          ${miniCard("Alpha", st.alpha || 0, "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400")}
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Kehadiran</h3>
            <span class="font-black text-2xl ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}">${pct}%</span>
          </div>
          <div class="h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"} h-full rounded-full" style="width:${pct}%"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">${st.hadir || 0} hadir dari ${st.total || 0} hari</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <div class="p-4 border-b dark:border-slate-700 font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Riwayat Harian</div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-900"><tr>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">Tanggal</th>
              <th class="px-5 py-3 text-center text-xs font-black text-gray-500 uppercase">Status</th>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">Keterangan</th>
            </tr></thead><tbody>
              ${
                d
                  .map(
                    (
                      a,
                    ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
                <td class="px-5 py-3 font-mono text-xs text-gray-400">${a.tanggal?.slice(0, 10)}</td>
                <td class="px-5 py-3 text-center">${stBadge(a.status)}</td>
                <td class="px-5 py-3 text-gray-400 text-xs">${a.keterangan || "—"}</td>
              </tr>`,
                  )
                  .join("") ||
                '<tr><td colspan="3" class="text-center py-10 text-gray-400">Belum ada data</td></tr>'
              }
            </tbody></table>
          </div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

// ============================================================
// KETUA KELAS
// ============================================================
async function renderKetuaKelas() {
  setTitle("Kelola Kelas", "Manajemen keanggotaan kelas");
  loadingUI();
  try {
    const siswaId = currentUser.siswa_id,
      kelasId = currentUser.kelas_id;
    if (!siswaId || !kelasId) {
      setContent(
        '<div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-6 rounded-2xl text-amber-700 dark:text-amber-300 text-sm">Data kelas tidak ditemukan.</div>',
      );
      return;
    }
    const [siswaRes, meRes] = await Promise.all([
      apiGet(`/kelas/${kelasId}/siswa?tahun_ajaran_id=${selectedSemesterId}`),
      apiGet(`/siswa/${siswaId}`),
    ]);
    const me = meRes.data,
      siswas = siswaRes.data;
    const isKetua = me.is_ketua_kelas;
    const ketua = siswas.find((s) => s.is_ketua_kelas);
    setContent(`
      <div class="space-y-5">
        <div class="bg-gradient-to-r ${isKetua ? "from-amber-500 to-orange-600" : "from-purple-600 to-indigo-700"} rounded-2xl p-5 text-white shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl flex-shrink-0">${me.nama?.charAt(0).toUpperCase()}</div>
            <div>
              <h3 class="font-black text-lg">${me.nama}</h3>
              <p class="text-white/70 text-sm">${me.kelas_nama}</p>
              ${isKetua ? '<span class="inline-block mt-1 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold"><i class="fas fa-crown mr-1"></i>Ketua Kelas</span>' : '<span class="inline-block mt-1 bg-white/15 text-white/80 text-xs px-3 py-1 rounded-full">Anggota Kelas</span>'}
            </div>
          </div>
        </div>
        ${
          ketua
            ? `<div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <h4 class="font-black text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-3">Ketua Kelas Aktif</h4>
          <div class="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900">
            <div class="w-12 h-12 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xl flex-shrink-0">${ketua.nama.charAt(0).toUpperCase()}</div>
            <div class="flex-1"><div class="font-black dark:text-white">${ketua.nama}</div><div class="text-gray-400 text-xs font-mono">${ketua.nis}</div></div>
            <i class="fas fa-crown text-amber-500 text-2xl"></i>
          </div>
        </div>`
            : ""
        }
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
          <div class="p-4 border-b dark:border-slate-700 flex items-center justify-between">
            <h4 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Anggota (${siswas.length})</h4>
            ${isKetua ? '<span class="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-bold">Anda dapat mengganti ketua</span>' : ""}
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-slate-900"><tr>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">Nama</th>
              <th class="px-5 py-3 text-left text-xs font-black text-gray-500 uppercase">NIS</th>
              <th class="px-5 py-3 text-center text-xs font-black text-gray-500 uppercase">Jabatan</th>
              ${isKetua ? '<th class="px-5 py-3 text-right text-xs font-black text-gray-500 uppercase">Aksi</th>' : ""}
            </tr></thead>
            <tbody>
              ${siswas
                .map(
                  (
                    s,
                  ) => `<tr class="border-t dark:border-slate-700 table-row-hover ${s.is_ketua_kelas ? "bg-amber-50/60 dark:bg-amber-950/10" : ""}">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <div class="${s.is_ketua_kelas ? "bg-amber-200 dark:bg-amber-900 text-amber-700 dark:text-amber-300" : "bg-gray-100 dark:bg-slate-700 text-gray-500"} w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">${s.nama.charAt(0).toUpperCase()}</div>
                    <div>
                      <div class="font-semibold dark:text-white">${s.nama}</div>
                      ${s.id == siswaId ? '<span class="text-xs text-purple-500 font-bold">(Anda)</span>' : ""}
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3 font-mono text-xs text-gray-400">${s.nis}</td>
                <td class="px-5 py-3 text-center">${s.is_ketua_kelas ? '<span class="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 rounded-full font-bold"><i class="fas fa-crown mr-1"></i>Ketua</span>' : '<span class="text-gray-400 text-xs">Anggota</span>'}</td>
                ${isKetua ? `<td class="px-5 py-3 text-right">${!s.is_ketua_kelas ? `<button onclick="setKetuaKelas(${s.id},'${s.nama}')" class="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-amber-600 active:scale-95 transition-all"><i class="fas fa-crown mr-1"></i>Jadikan Ketua</button>` : '<span class="text-gray-300 text-xs">Aktif</span>'}</td>` : ""}
              </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${!isKetua ? '<div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300"><i class="fas fa-info-circle mr-2"></i>Hanya ketua kelas yang dapat mengubah jabatan.</div>' : ""}
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
async function setKetuaKelas(newId, nama) {
  if (!confirm(`Jadikan ${nama} sebagai Ketua Kelas baru?`)) return;
  try {
    await apiPost("/siswa/bulk-action", { action: "set-ketua", ids: [newId] });
    showToast(`${nama} dijadikan Ketua Kelas`);
    renderKetuaKelas();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// REKAP
// ============================================================
async function renderRekap() {
  setTitle("Rekap Absensi", "Laporan kehadiran per kelas");
  loadingUI();
  try {
    const kelasRes = await apiGet(
      `/kelas?tahun_ajaran_id=${selectedSemesterId}`,
    );
    setContent(`
      <div class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <div class="flex gap-3 flex-wrap items-end">
            <div>
              ${LB("Kelas")}
              <select id="rekapKelas" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48">
                <option value="">— Pilih Kelas —</option>
                ${kelasRes.data.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}
              </select>
            </div>
            <div>
              ${LB("Filter Bulan (opsional)")}
              <input id="rekapBulan" type="month" class="border dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onclick="loadRekap()" class="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 active:scale-95 transition-all">
              <i class="fas fa-chart-bar mr-2"></i>Tampilkan</button>
          </div>
        </div>
        <div id="rekapResult"></div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}
async function loadRekap() {
  const kelasId = document.getElementById("rekapKelas").value;
  const bulan = document.getElementById("rekapBulan").value;
  if (!kelasId) {
    showToast("Pilih kelas dulu", "error");
    return;
  }
  const div = document.getElementById("rekapResult");
  div.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-400"><div class="w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div><span class="text-sm">Memuat rekap...</span></div>`;
  try {
    const res = await apiGet(
      `/absensi/harian/rekap?kelas_id=${kelasId}&tahun_ajaran_id=${selectedSemesterId}&bulan=${bulan}`,
    );
    const d = res.data;
    div.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <span class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Rekap (${d.length} siswa)</span>
          <button onclick="exportExcelKelas(${kelasId})" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all">
            <i class="fas fa-file-excel"></i>Export Excel</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-slate-900"><tr>
              <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">#</th>
              <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Nama</th>
              <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">NIS</th>
              <th class="px-4 py-3 text-center text-xs font-black text-green-600 uppercase">H</th>
              <th class="px-4 py-3 text-center text-xs font-black text-blue-600 uppercase">S</th>
              <th class="px-4 py-3 text-center text-xs font-black text-amber-600 uppercase">I</th>
              <th class="px-4 py-3 text-center text-xs font-black text-red-600 uppercase">A</th>
              <th class="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">% Hadir</th>
            </tr></thead>
            <tbody>
              ${
                d
                  .map((r, i) => {
                    const pct = r.total
                      ? Math.round((r.hadir / r.total) * 100)
                      : 0;
                    return `<tr class="border-t dark:border-slate-700 table-row-hover">
                  <td class="px-4 py-3 text-gray-400 text-xs">${i + 1}</td>
                  <td class="px-4 py-3 font-semibold dark:text-white">${r.nama}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-400">${r.nis}</td>
                  <td class="px-4 py-3 text-center font-black text-green-600">${r.hadir || 0}</td>
                  <td class="px-4 py-3 text-center font-black text-blue-600">${r.sakit || 0}</td>
                  <td class="px-4 py-3 text-center font-black text-amber-600">${r.izin || 0}</td>
                  <td class="px-4 py-3 text-center font-black text-red-600">${r.alpha || 0}</td>
                  <td class="px-4 py-3 text-center">${r.total || 0}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="font-black text-sm ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}">${pct}%</span>
                    <div class="w-16 h-1.5 bg-gray-100 rounded-full mt-1 mx-auto overflow-hidden">
                      <div class="${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"} h-full rounded-full" style="width:${pct}%"></div>
                    </div>
                  </td>
                </tr>`;
                  })
                  .join("") ||
                '<tr><td colspan="9" class="text-center py-10 text-gray-400">Belum ada data absensi</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) {
    div.innerHTML = `<p class="text-red-500 p-4 text-sm">${err.message}</p>`;
  }
}

// ============================================================
// REKAP SISWA
// ============================================================
async function renderRekapSiswa() {
  setTitle("Statistik Absensi", "Grafik kehadiran saya");
  loadingUI();
  try {
    const siswaId = currentUser.siswa_id;
    if (!siswaId) {
      setContent(
        '<p class="text-gray-400 text-center py-10">Data tidak ditemukan.</p>',
      );
      return;
    }
    const res = await apiGet(`/absensi/siswa/${siswaId}`);
    const d = res.data,
      st = res.stats || {};
    const pct = st.total ? Math.round((st.hadir / st.total) * 100) : 0;
    const bySem = {};
    d.forEach((a) => {
      const k = `${a.ta_nama} ${a.semester}`;
      if (!bySem[k]) bySem[k] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
      bySem[k][a.status]++;
    });
    setContent(`
      <div class="space-y-5">
        <div class="grid grid-cols-4 gap-3">
          ${miniCard("Hadir", st.hadir || 0, "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400")}
          ${miniCard("Sakit", st.sakit || 0, "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400")}
          ${miniCard("Izin", st.izin || 0, "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400")}
          ${miniCard("Alpha", st.alpha || 0, "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400")}
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Total Kehadiran</h3>
            <span class="font-black text-3xl ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}">${pct}%</span>
          </div>
          <div class="h-5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"} h-full rounded-full transition-all duration-1000" style="width:${pct}%"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">${st.hadir || 0} hadir dari ${st.total || 0} hari sekolah</p>
        </div>
        ${Object.keys(bySem).length ? `<div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover"><h3 class="font-black text-gray-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Per Semester</h3><canvas id="chartSem" height="200"></canvas></div>` : ""}
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 card-hover">
          <h3 class="font-black text-gray-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Distribusi Status</h3>
          <canvas id="chartDist" height="250" style="max-width:280px;display:block;margin:auto;"></canvas>
        </div>
      </div>`);
    if (Object.keys(bySem).length) {
      chartInstances.sem = new Chart(document.getElementById("chartSem"), {
        type: "bar",
        data: {
          labels: Object.keys(bySem),
          datasets: [
            {
              label: "Hadir",
              data: Object.values(bySem).map((s) => s.hadir),
              backgroundColor: "#22c55e",
              borderRadius: 6,
            },
            {
              label: "Alpha",
              data: Object.values(bySem).map((s) => s.alpha),
              backgroundColor: "#ef4444",
              borderRadius: 6,
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: "top" } } },
      });
    }
    if (st.total) {
      chartInstances.dist = new Chart(document.getElementById("chartDist"), {
        type: "pie",
        data: {
          labels: ["Hadir", "Sakit", "Izin", "Alpha"],
          datasets: [
            {
              data: [st.hadir || 0, st.sakit || 0, st.izin || 0, st.alpha || 0],
              backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"],
              borderWidth: 0,
              hoverOffset: 10,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

// ============================================================
// EXPORT EXCEL
// ============================================================
async function renderExport() {
  setTitle("Export Excel", "Unduh laporan absensi ke file Excel");
  loadingUI();
  try {
    const kelasRes = await apiGet(
      `/kelas?tahun_ajaran_id=${selectedSemesterId}`,
    );
    const weekInfo = updateWeekInfo();
    setContent(`
      <div class="max-w-2xl space-y-5">
        <!-- Info jadwal blok -->
        <div class="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
          <h3 class="font-black text-lg mb-1"><i class="fas fa-file-excel mr-2"></i>Export Excel — Sistem Blok Minggu</h3>
          <p class="text-white/70 text-sm">File berisi 4 sheet: Rekap Kehadiran, Data Harian, Statistik Jurusan, dan Jadwal Blok Minggu</p>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
          <h3 class="font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Filter Export</h3>
          ${FW("Semester", `<select id="exp_ta" class="${IC()}">${allSemesters.map((s) => `<option value="${s.id}" ${s.is_active ? "selected" : ""}>${s.nama} ${s.semester.toUpperCase()}</option>`).join("")}</select>`)}
          ${FW("Filter Kelas (opsional)", `<select id="exp_kelas" class="${IC()}"><option value="">Semua Kelas</option>${kelasRes.data.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}</select>`)}

          <button onclick="doExport()" class="w-full bg-green-600 text-white py-4 rounded-xl font-black hover:bg-green-700 active:scale-95 transition-all text-sm tracking-wide shadow-lg">
            <i class="fas fa-download mr-2"></i>DOWNLOAD EXCEL (.xlsx)
          </button>

          <div class="border-t dark:border-slate-700 pt-4 space-y-2">
            <p class="text-xs font-black text-gray-500 uppercase tracking-wider">Isi File Excel</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <div class="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0"></div>Sheet 1: Rekap per Siswa
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <div class="w-3 h-3 rounded-sm bg-green-500 flex-shrink-0"></div>Sheet 2: Data Harian
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <div class="w-3 h-3 rounded-sm bg-purple-500 flex-shrink-0"></div>Sheet 3: Statistik Jurusan
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <div class="w-3 h-3 rounded-sm bg-orange-500 flex-shrink-0"></div>Sheet 4: Jadwal Blok Minggu
              </div>
            </div>
          </div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

function doExport() {
  const ta = document.getElementById("exp_ta").value;
  const kelas = document.getElementById("exp_kelas").value;
  const params = new URLSearchParams({ tahun_ajaran_id: ta });
  if (kelas) params.set("kelas_id", kelas);
  window.open(`/api/export/excel?${params.toString()}`, "_blank");
}
function exportExcelKelas(kelasId) {
  const params = new URLSearchParams({
    tahun_ajaran_id: selectedSemesterId || activeSemesterId,
  });
  if (kelasId) params.set("kelas_id", kelasId);
  window.open(`/api/export/excel?${params.toString()}`, "_blank");
}

// ============================================================
// LOGS
// ============================================================
async function renderLogs() {
  setTitle("Activity Log", "Riwayat aktivitas sistem");
  loadingUI();
  try {
    const res = await apiGet("/logs");
    setContent(`
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700 font-black text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wider">Log Aktivitas (${res.data.length} entri terbaru)</div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-900"><tr>
            <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Waktu</th>
            <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">User</th>
            <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Role</th>
            <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Aksi</th>
            <th class="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Detail</th>
          </tr></thead><tbody>
            ${res.data
              .map(
                (
                  l,
                ) => `<tr class="border-t dark:border-slate-700 table-row-hover">
              <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap font-mono">${new Date(l.created_at).toLocaleString("id-ID")}</td>
              <td class="px-4 py-3 font-semibold dark:text-white">${l.nama || "System"}</td>
              <td class="px-4 py-3 capitalize text-xs text-gray-400">${l.role || "—"}</td>
              <td class="px-4 py-3"><span class="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full font-mono font-bold">${l.action}</span></td>
              <td class="px-4 py-3 text-gray-400 text-xs">${l.detail || "—"}</td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

// ============================================================

// ============================================================
// HELPERS
// ============================================================
function errHTML(msg) {
  return `<div class="flex flex-col items-center justify-center py-16 text-red-500 gap-3">
    <i class="fas fa-exclamation-triangle text-4xl"></i>
    <p class="text-sm font-semibold">${msg}</p>
  </div>`;
}

// ============================================================
// AUDIT TRAIL / LOGS LANJUTAN
// ============================================================
async function renderLogs() {
  setTitle("Audit Trail", "Riwayat aktivitas sistem lengkap");
  loadingUI();
  try {
    const today = new Date().toISOString().slice(0, 10);
    setContent(`
      <div class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border dark:border-slate-700 p-4">
          <div class="flex gap-3 flex-wrap items-end">
            <div class="flex-1 min-w-36">
              <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Cari Aksi</label>
              <input id="logAction" placeholder="LOGIN, ABSENSI..." class="${IC()} text-sm" />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Tanggal</label>
              <input id="logDate" type="date" value="${today}" class="${IC()} text-sm w-44" />
            </div>
            <button onclick="loadLogs()" class="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors">
              <i class="fas fa-search mr-2"></i>Filter
            </button>
            <button onclick="loadLogs(true)" class="border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <i class="fas fa-times mr-1"></i>Reset
            </button>
          </div>
        </div>
        <div id="logResult"><div class="text-center py-12 text-gray-400 dark:text-slate-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div></div>
      </div>`);
    loadLogs();
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function loadLogs(reset) {
  const action = reset ? "" : document.getElementById("logAction")?.value || "";
  const tanggal = reset ? "" : document.getElementById("logDate")?.value || "";
  if (reset) {
    if (document.getElementById("logAction"))
      document.getElementById("logAction").value = "";
    if (document.getElementById("logDate"))
      document.getElementById("logDate").value = "";
  }
  const div = document.getElementById("logResult");
  if (!div) return;
  div.innerHTML =
    '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
  try {
    let q = "/logs?limit=200";
    if (action) q += "&action=" + encodeURIComponent(action);
    if (tanggal) q += "&tanggal=" + tanggal;
    const res = await apiGet(q);
    const actionColors = {
      LOGIN: "green",
      LOGOUT: "gray",
      ABSENSI: "blue",
      IZIN: "yellow",
      QR: "purple",
      ALERT: "red",
      HAPUS: "red",
      EDIT: "orange",
      TAMBAH: "green",
      EXPORT: "cyan",
    };
    function getColor(action) {
      for (const [k, v] of Object.entries(actionColors))
        if (action.includes(k)) return v;
      return "gray";
    }
    const colorMap = {
      green:
        "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
      yellow:
        "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
      red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
      purple:
        "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
      orange:
        "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
      cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400",
      gray: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400",
    };
    div.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border dark:border-slate-700 overflow-hidden">
        <div class="p-4 border-b dark:border-slate-700 flex items-center justify-between">
          <span class="font-semibold text-sm dark:text-white">${res.data.length} aktivitas</span>
          <span class="text-xs text-gray-400 dark:text-slate-500">${action || "Semua aksi"} ${tanggal ? "· " + tanggal : ""}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-700/50"><tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Waktu</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">User</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Role</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Aksi</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Detail</th>
          </tr></thead><tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            ${
              res.data
                .map((l) => {
                  const c = colorMap[getColor(l.action)] || colorMap.gray;
                  return `<tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap font-mono">${new Date(l.created_at).toLocaleString("id-ID")}</td>
                <td class="px-4 py-3"><span class="font-medium dark:text-white">${l.nama || "System"}</span><br><span class="text-xs text-gray-400">${l.email || "—"}</span></td>
                <td class="px-4 py-3"><span class="text-xs capitalize text-gray-500 dark:text-slate-400">${l.role || "system"}</span></td>
                <td class="px-4 py-3"><span class="text-xs px-2.5 py-1 rounded-full font-semibold ${c}">${l.action}</span></td>
                <td class="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs max-w-xs truncate">${l.detail || "—"}</td>
              </tr>`;
                })
                .join("") ||
              `<tr><td colspan="5" class="py-12 text-center text-gray-400 dark:text-slate-500"><i class="fas fa-inbox text-3xl mb-2 block opacity-40"></i>Tidak ada aktivitas</td></tr>`
            }
          </tbody></table>
        </div>
      </div>`;
  } catch (err) {
    div.innerHTML = errHTML(err.message);
  }
}

// ============================================================
// IZIN & SAKIT TERSTRUKTUR
// ============================================================
async function renderIzin() {
  setTitle("Pengajuan Izin & Sakit", "Kelola izin dan sakit siswa");
  loadingUI();
  try {
    const taId = selectedSemesterId;
    const [izinRes, pendingRes] = await Promise.all([
      apiGet(`/izin?tahun_ajaran_id=${taId}`),
      apiGet("/izin/count-pending"),
    ]);
    const data = izinRes.data;
    const pending = data.filter((d) => d.status === "pending");
    const approved = data.filter((d) => d.status === "approved");
    const rejected = data.filter((d) => d.status === "rejected");

    const statusBadge = (s) => {
      const m = {
        pending: ["yellow", "fa-clock", "Menunggu"],
        approved: ["green", "fa-check", "Disetujui"],
        rejected: ["red", "fa-times", "Ditolak"],
      };
      const [c, i, t] = m[s] || ["gray", "fa-question", "?"];
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-${c}-50 dark:bg-${c}-900/20 text-${c}-700 dark:text-${c}-400"><i class="fas ${i}"></i>${t}</span>`;
    };
    const jenisBadge = (j) =>
      j === "sakit"
        ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"><i class="fas fa-hospital-alt"></i> Sakit</span>'
        : '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"><i class="fas fa-calendar-minus"></i> Izin</span>';

    function izinTable(rows, showActions) {
      if (!rows.length)
        return `<div class="py-10 text-center text-gray-400 dark:text-slate-500 text-sm"><i class="fas fa-inbox text-3xl mb-2 block opacity-40"></i>Tidak ada pengajuan</div>`;
      return `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-700/50"><tr>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Siswa</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jenis</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alasan</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
        ${showActions ? '<th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>' : ""}
      </tr></thead><tbody class="divide-y divide-gray-100 dark:divide-slate-700">
        ${rows
          .map((r) => {
            const hari =
              Math.ceil(
                (new Date(r.tanggal_selesai) - new Date(r.tanggal_mulai)) /
                  86400000,
              ) + 1;
            return `<tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td class="px-4 py-3"><div class="font-medium dark:text-white">${r.siswa_nama}</div><div class="text-xs text-gray-400">${r.nis}</div></td>
            <td class="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">${r.kelas_nama}</td>
            <td class="px-4 py-3">${jenisBadge(r.jenis)}</td>
            <td class="px-4 py-3 text-xs"><div class="font-mono">${String(r.tanggal_mulai).slice(0, 10)}</div><div class="text-gray-400">s/d ${String(r.tanggal_selesai).slice(0, 10)}</div><div class="text-blue-500 font-semibold">${hari} hari</div></td>
            <td class="px-4 py-3 text-xs text-gray-600 dark:text-slate-400 max-w-xs">${r.alasan}</td>
            <td class="px-4 py-3">${statusBadge(r.status)}${r.catatan_reviewer ? `<div class="text-xs text-gray-400 mt-1">📝 ${r.catatan_reviewer}</div>` : ""}</td>
            ${
              showActions
                ? `<td class="px-4 py-3 text-right">
              <div class="flex gap-2 justify-end">
                <button onclick="reviewIzin(${r.id},'approved')" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-check mr-1"></i>Setuju</button>
                <button onclick="showRejectModal(${r.id})" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"><i class="fas fa-times mr-1"></i>Tolak</button>
              </div>
            </td>`
                : ""
            }
          </tr>`;
          })
          .join("")}
      </tbody></table></div>`;
    }

    setContent(`
      <div class="space-y-5">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <div class="flex gap-3">
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2.5 text-center">
              <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-400">${pending.length}</div>
              <div class="text-xs text-yellow-600 dark:text-yellow-500">Menunggu</div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5 text-center">
              <div class="text-2xl font-bold text-green-700 dark:text-green-400">${approved.length}</div>
              <div class="text-xs text-green-600 dark:text-green-500">Disetujui</div>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5 text-center">
              <div class="text-2xl font-bold text-red-700 dark:text-red-400">${rejected.length}</div>
              <div class="text-xs text-red-600 dark:text-red-500">Ditolak</div>
            </div>
          </div>
          ${currentUser.role === "siswa" ? `<button onclick="showAjukanIzinModal()" class="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"><i class="fas fa-plus mr-2"></i>Ajukan Izin/Sakit</button>` : ""}
        </div>

        ${
          pending.length > 0
            ? `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-yellow-100 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
            <i class="fas fa-clock text-yellow-600 dark:text-yellow-400"></i>
            <h3 class="font-bold text-yellow-800 dark:text-yellow-400 text-sm">Menunggu Persetujuan (${pending.length})</h3>
          </div>
          ${izinTable(pending, currentUser.role !== "siswa")}
        </div>`
            : ""
        }

        <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow overflow-hidden">
          <div class="flex gap-1 p-3 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <button onclick="switchIzinTab('all')" id="iTab_all" class="izin-tab px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-600 shadow-sm text-gray-800 dark:text-white">Semua (${data.length})</button>
            <button onclick="switchIzinTab('approved')" id="iTab_approved" class="izin-tab px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-slate-400">Disetujui (${approved.length})</button>
            <button onclick="switchIzinTab('rejected')" id="iTab_rejected" class="izin-tab px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-slate-400">Ditolak (${rejected.length})</button>
          </div>
          <div id="izinTab_all">${izinTable(data, false)}</div>
          <div id="izinTab_approved" class="hidden">${izinTable(approved, false)}</div>
          <div id="izinTab_rejected" class="hidden">${izinTable(rejected, false)}</div>
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

function switchIzinTab(key) {
  ["all", "approved", "rejected"].forEach((k) => {
    const c = document.getElementById("izinTab_" + k),
      b = document.getElementById("iTab_" + k);
    if (c) c.classList.toggle("hidden", k !== key);
    if (b) {
      if (k === key) {
        b.classList.add(
          "bg-white",
          "dark:bg-slate-600",
          "shadow-sm",
          "text-gray-800",
          "dark:text-white",
        );
        b.classList.remove("text-gray-500", "dark:text-slate-400");
      } else {
        b.classList.remove(
          "bg-white",
          "dark:bg-slate-600",
          "shadow-sm",
          "text-gray-800",
          "dark:text-white",
        );
        b.classList.add("text-gray-500", "dark:text-slate-400");
      }
    }
  });
}

function showAjukanIzinModal() {
  const today = new Date().toISOString().slice(0, 10);
  openModal(
    "Ajukan Izin / Sakit",
    `
    <div class="space-y-4">
      ${FW("Jenis", `<select id="iz_jenis" class="${IC()}"><option value="izin">📅 Izin</option><option value="sakit">🏥 Sakit</option></select>`)}
      <div class="grid grid-cols-2 gap-3">
        ${FW("Tanggal Mulai", `<input id="iz_start" type="date" value="${today}" class="${IC()}" />`)}
        ${FW("Tanggal Selesai", `<input id="iz_end" type="date" value="${today}" class="${IC()}" />`)}
      </div>
      ${FW("Alasan / Keterangan", `<textarea id="iz_alasan" rows="3" placeholder="Tuliskan alasan dengan jelas..." class="${IC()}"></textarea>`)}
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
        <i class="fas fa-info-circle mr-1"></i>Setelah disetujui, absensi akan otomatis terupdate.
      </div>
      ${btnRow(btnPri("Kirim Pengajuan", "doAjukanIzin()", "blue"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-md",
  );
}

async function doAjukanIzin() {
  const jenis = document.getElementById("iz_jenis").value;
  const start = document.getElementById("iz_start").value;
  const end = document.getElementById("iz_end").value;
  const alasan = document.getElementById("iz_alasan").value.trim();
  if (!start || !end || !alasan) {
    showToast("Semua field wajib diisi", "error");
    return;
  }
  if (end < start) {
    showToast("Tanggal selesai tidak boleh sebelum tanggal mulai", "error");
    return;
  }
  try {
    const r = await apiPost("/izin", {
      jenis,
      tanggal_mulai: start,
      tanggal_selesai: end,
      alasan,
      tahun_ajaran_id: selectedSemesterId,
    });
    showToast(r.message);
    closeModal();
    renderIzin();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function reviewIzin(id, status, catatan) {
  try {
    const r = await apiPost("/izin/" + id + "/review", {
      status,
      catatan_reviewer: catatan || "",
    });
    // Note: using PUT but switching to POST for safety
    const r2 = await apiFetch("/izin/" + id + "/review", {
      method: "PUT",
      body: JSON.stringify({ status, catatan_reviewer: catatan || "" }),
    });
    showToast(r2.message);
    renderIzin();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Fix: use PUT directly
async function reviewIzin(id, status, catatan) {
  try {
    const r = await apiFetch("/izin/" + id + "/review", {
      method: "PUT",
      body: JSON.stringify({ status, catatan_reviewer: catatan || null }),
    });
    showToast(r.message);
    renderIzin();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function showRejectModal(id) {
  openModal(
    "Tolak Pengajuan",
    `
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
        <i class="fas fa-exclamation-triangle mr-1"></i>Pengajuan akan ditolak dan absensi tidak diubah.
      </div>
      ${FW("Alasan Penolakan (opsional)", `<textarea id="reject_catatan" rows="2" placeholder="Tuliskan alasan penolakan..." class="${IC()}"></textarea>`)}
      ${btnRow(btnPri("Tolak Pengajuan", "doRejectIzin(" + id + ")", "red"), btnSec("Batal", "closeModal()"))}
    </div>`,
    "max-w-sm",
  );
}
async function doRejectIzin(id) {
  const catatan = document.getElementById("reject_catatan").value;
  await reviewIzin(id, "rejected", catatan);
  closeModal();
}

// ============================================================
// QR CODE ABSENSI MANDIRI
// ============================================================
async function renderQRAbsensi() {
  setTitle("QR Code Absensi", "Absensi mandiri via QR Code");
  loadingUI();
  try {
    const taId = selectedSemesterId;
    const guP =
      currentUser.role === "guru" && currentUser.guru_id
        ? `&guru_id=${currentUser.guru_id}`
        : "";
    const today = new Date().toISOString().slice(0, 10);

    if (currentUser.role === "siswa") {
      // Siswa: lihat QR aktif dan form scan
      const sesiRes = await apiGet("/qr/sesi-aktif");
      const sesis = sesiRes.data;
      setContent(`
        <div class="space-y-5">
          <div class="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
            <i class="fas fa-qrcode text-6xl mb-4 opacity-80"></i>
            <h3 class="font-bold text-xl">Scan QR Absensi</h3>
            <p class="text-purple-200 text-sm mt-1">Masukkan kode QR yang ditampilkan guru</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-white mb-3">Kode QR Token</label>
            <div class="flex gap-3">
              <input id="qrToken" placeholder="Paste token dari guru..." class="${IC()} flex-1 font-mono text-sm" />
              <button onclick="doScanQR()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors whitespace-nowrap">
                <i class="fas fa-sign-in-alt mr-2"></i>Absen
              </button>
            </div>
          </div>
          ${
            sesis.length > 0
              ? `
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-green-200 dark:border-green-800 shadow overflow-hidden">
            <div class="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="font-semibold text-green-800 dark:text-green-400 text-sm">Sesi Aktif (${sesis.length})</span>
            </div>
            ${sesis
              .map((s) => {
                const exp = new Date(s.expired_at);
                const minsLeft = Math.max(
                  0,
                  Math.round((exp - Date.now()) / 60000),
                );
                return `<div class="p-4 flex items-center justify-between gap-4 border-b dark:border-slate-700 last:border-0">
                <div>
                  <div class="font-medium dark:text-white">${s.mapel_nama}</div>
                  <div class="text-xs text-gray-400 mt-0.5">Guru: ${s.guru_nama} · Berakhir ${minsLeft} menit lagi</div>
                </div>
                <button onclick="document.getElementById('qrToken').value='${s.token}'" class="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition-colors">
                  Gunakan Token
                </button>
              </div>`;
              })
              .join("")}
          </div>`
              : ""
          }
        </div>`);
      return;
    }

    // Admin/Guru: generate QR
    const jadwalRes = await apiGet(
      `/jadwal?tahun_ajaran_id=${taId}${guP}&tanggal=${today}`,
    );
    const jadwals = jadwalRes.data;

    setContent(`
      <div class="space-y-5">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Generate QR -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-5">
            <h3 class="font-bold text-gray-700 dark:text-white text-sm mb-4 flex items-center gap-2">
              <i class="fas fa-plus-circle text-blue-600"></i> Generate QR Sesi
            </h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Pilih Jadwal Hari Ini</label>
                <select id="qrJadwal" class="${IC()} text-sm">
                  <option value="">— Pilih Jadwal —</option>
                  ${jadwals.map((j) => `<option value="${j.id}">${j.kelas_nama || j.kelas} — ${j.mapel_naam || j.mapel_nama} (${(j.jam_mulai || "").slice(0, 5)})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Tanggal</label>
                <input id="qrTanggal" type="date" value="${today}" class="${IC()} text-sm" />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Durasi QR (menit)</label>
                <select id="qrDurasi" class="${IC()} text-sm">
                  <option value="10">10 menit</option>
                  <option value="15" selected>15 menit</option>
                  <option value="20">20 menit</option>
                  <option value="30">30 menit</option>
                </select>
              </div>
              <button onclick="generateQR()" class="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                <i class="fas fa-qrcode mr-2"></i>Generate QR Code
              </button>
            </div>
          </div>
          <!-- QR Display -->
          <div id="qrDisplay" class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-5 flex flex-col items-center justify-center min-h-48">
            <i class="fas fa-qrcode text-6xl text-gray-200 dark:text-slate-700 mb-3"></i>
            <p class="text-gray-400 dark:text-slate-500 text-sm">QR akan muncul di sini</p>
          </div>
        </div>
        <div id="scanListPanel"></div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function generateQR() {
  const jadwalId = document.getElementById("qrJadwal").value;
  const tanggal = document.getElementById("qrTanggal").value;
  const durasi = document.getElementById("qrDurasi").value;
  if (!jadwalId) {
    showToast("Pilih jadwal terlebih dahulu", "error");
    return;
  }
  try {
    const r = await apiPost("/qr/generate", {
      jadwal_id: jadwalId,
      tanggal,
      durasi_menit: parseInt(durasi),
    });
    const token = r.data.token;
    const exp = new Date(r.data.expired_at).toLocaleTimeString("id-ID");
    const sesiId = r.data.id;

    // Generate QR visual menggunakan QRCode.js (CDN)
    const qrDiv = document.getElementById("qrDisplay");
    qrDiv.innerHTML = `
      <div class="text-center space-y-3 w-full">
        <div id="qrCanvas" class="flex justify-center"></div>
        <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
          <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">Token (bagikan ke siswa):</p>
          <p class="font-mono text-xs break-all text-blue-700 dark:text-blue-400 select-all">${token}</p>
        </div>
        <p class="text-xs text-red-500 font-semibold"><i class="fas fa-clock mr-1"></i>Kedaluwarsa pukul ${exp}</p>
        <button onclick="loadScanList('${r.data.token}')" class="text-xs text-blue-600 dark:text-blue-400 underline">Lihat daftar scan</button>
      </div>`;

    // Load QRCode library and render
    if (!window.QRCode) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = () => renderQRCanvas(token);
      document.head.appendChild(script);
    } else {
      renderQRCanvas(token);
    }

    showToast("QR Code berhasil digenerate!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderQRCanvas(token) {
  try {
    new window.QRCode(document.getElementById("qrCanvas"), {
      text: token,
      width: 200,
      height: 200,
      colorDark: "#1e3a8a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (e) {
    document.getElementById("qrCanvas").innerHTML =
      `<div class="w-48 h-48 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 text-xs p-3 text-center">QR siap. Token sudah dicopy di bawah.</div>`;
  }
}

async function doScanQR() {
  const token = document.getElementById("qrToken").value.trim();
  if (!token) {
    showToast("Masukkan token QR", "error");
    return;
  }
  try {
    const r = await apiPost("/qr/scan", { token });
    showToast(
      r.message,
      r.data?.status === "terlambat" ? "warning" : "success",
    );
    document.getElementById("qrToken").value = "";
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadScanList(token) {
  // Find sesi by token — we'll load all sesi and get scan list
  const panel = document.getElementById("scanListPanel");
  if (!panel) return;
  panel.innerHTML =
    '<div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin text-xl"></i></div>';
  try {
    // We need sesi_id; get from listing
    showToast("Memuat daftar scan...", "info");
  } catch (err) {
    panel.innerHTML = errHTML(err.message);
  }
}

// ============================================================
// ALERT & SISWA BERISIKO
// ============================================================
async function renderAlert() {
  setTitle("Alert & Siswa Berisiko", "Monitor kehadiran & peringatan dini");
  loadingUI();
  try {
    const taId = selectedSemesterId;
    const krOpts =
      currentUser.role === "admin" ? `&tahun_ajaran_id=${taId}` : "";
    const [alertRes, risikoRes] = await Promise.all([
      apiGet(`/alert?tahun_ajaran_id=${taId}&is_read=0`),
      apiGet(`/alert/siswa-berisiko?tahun_ajaran_id=${taId}`),
    ]);
    const alerts = alertRes.data;
    const berisiko = risikoRes.berisiko || [];
    const allSiswa = risikoRes.data || [];

    const jenisIcon = {
      alpha_beruntun: "fa-calendar-times text-red-500",
      batas_kehadiran: "fa-exclamation-triangle text-yellow-500",
      alpha_tinggi: "fa-chart-line text-orange-500",
    };
    const jenisLabel = {
      alpha_beruntun: "Alpha Beruntun",
      batas_kehadiran: "Bawah Batas Min.",
      alpha_tinggi: "Alpha Tinggi",
    };

    setContent(`
      <div class="space-y-5">
        <!-- Run Check + Stats -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex gap-3">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center">
              <div class="text-2xl font-bold text-red-700 dark:text-red-400">${alerts.length}</div>
              <div class="text-xs text-red-600 dark:text-red-500 mt-0.5">Alert Baru</div>
            </div>
            <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 text-center">
              <div class="text-2xl font-bold text-orange-700 dark:text-orange-400">${berisiko.length}</div>
              <div class="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Siswa Berisiko</div>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-center">
              <div class="text-2xl font-bold text-blue-700 dark:text-blue-400">${allSiswa.length}</div>
              <div class="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Total Dipantau</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="runAlertCheck()" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <i class="fas fa-radar mr-2"></i>Cek Sekarang
            </button>
            ${
              alerts.length > 0
                ? `<button onclick="markAllRead()" class="border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <i class="fas fa-check-double mr-1"></i>Tandai Semua Dibaca
            </button>`
                : ""
            }
          </div>
        </div>

        <!-- Alerts List -->
        ${
          alerts.length > 0
            ? `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800 shadow overflow-hidden">
          <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <h3 class="font-bold text-red-800 dark:text-red-400 text-sm">Alert Belum Dibaca (${alerts.length})</h3>
            </div>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-slate-700">
            ${alerts
              .map(
                (a) => `
              <div class="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <div class="mt-0.5 flex-shrink-0"><i class="fas ${jenisIcon[a.jenis] || "fa-bell text-gray-400"} text-lg"></i></div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm dark:text-white">${a.siswa_nama} <span class="text-gray-400 text-xs">· ${a.nis}</span></div>
                  <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">${a.kelas_nama} · ${jenisLabel[a.jenis] || a.jenis}</div>
                  <div class="text-xs text-gray-600 dark:text-slate-300 mt-1">${a.detail}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-xs text-gray-400 dark:text-slate-500">${new Date(a.created_at).toLocaleDateString("id-ID")}</div>
                  <button onclick="markAlertRead(${a.id})" class="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">Tandai dibaca</button>
                </div>
              </div>`,
              )
              .join("")}
          </div>
        </div>`
            : `
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-center gap-4">
          <i class="fas fa-check-circle text-3xl text-green-600 dark:text-green-400"></i>
          <div><div class="font-bold text-green-800 dark:text-green-400">Tidak ada alert baru</div><div class="text-sm text-green-600 dark:text-green-500 mt-0.5">Semua siswa dalam kondisi baik.</div></div>
        </div>`
        }

        <!-- Siswa Berisiko Table -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow overflow-hidden">
          <div class="p-4 border-b dark:border-slate-700 flex items-center gap-2">
            <i class="fas fa-exclamation-triangle text-orange-500"></i>
            <h3 class="font-bold text-gray-700 dark:text-white text-sm">Siswa di Bawah Batas Kehadiran Minimum (${berisiko.length})</h3>
          </div>
          ${
            berisiko.length > 0
              ? `
          <div class="overflow-x-auto">
            <table class="w-full text-sm"><thead class="bg-gray-50 dark:bg-slate-700/50"><tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Siswa</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">% Hadir</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Batas Min.</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Alpha</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total Hari</th>
            </tr></thead><tbody class="divide-y divide-gray-100 dark:divide-slate-700">
              ${berisiko
                .map((s) => {
                  const pct = s.pct_hadir || 0;
                  const barW = pct;
                  const barCls = pct < 60 ? "bg-red-500" : "bg-yellow-500";
                  return `<tr class="hover:bg-orange-50/50 dark:hover:bg-orange-900/10">
                  <td class="px-4 py-3"><div class="font-medium dark:text-white">${s.nama}</div><div class="text-xs text-gray-400">${s.nis}</div></td>
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">${s.kelas_nama}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2 min-w-16"><div class="${barCls} h-2 rounded-full" style="width:${barW}%"></div></div>
                      <span class="font-bold text-xs ${pct < 60 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}">${pct}%</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center text-xs font-semibold text-gray-500">${s.batas_kehadiran || 75}%</td>
                  <td class="px-4 py-3 text-center font-bold text-red-600 dark:text-red-400">${s.alpha || 0}</td>
                  <td class="px-4 py-3 text-center text-gray-500">${s.total || 0}</td>
                </tr>`;
                })
                .join("")}
            </tbody></table>
          </div>`
              : `<div class="py-10 text-center text-gray-400 dark:text-slate-500 text-sm"><i class="fas fa-thumbs-up text-3xl mb-2 block opacity-40"></i>Semua siswa di atas batas kehadiran minimum!</div>`
          }
        </div>
      </div>`);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function runAlertCheck() {
  try {
    const r = await apiPost("/alert/check", {
      tahun_ajaran_id: selectedSemesterId,
    });
    showToast(r.message, r.data.alertsCreated > 0 ? "info" : "success");
    renderAlert();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function markAlertRead(id) {
  try {
    await apiFetch("/alert/" + id + "/read", { method: "PUT", body: "{}" });
    renderAlert();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function markAllRead() {
  try {
    await apiFetch("/alert/read-all", {
      method: "PUT",
      body: JSON.stringify({ tahun_ajaran_id: selectedSemesterId }),
    });
    showToast("Semua alert ditandai dibaca");
    renderAlert();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// GRAFIK TREN KEHADIRAN
// ============================================================
async function renderTren() {
  setTitle("Grafik Tren Kehadiran", "Analitik dan visualisasi data absensi");
  loadingUI();
  try {
    const taId = selectedSemesterId;
    const krRes = await apiGet("/kelas?tahun_ajaran_id=" + taId);
    setContent(`
      <div class="space-y-5">
        <!-- Filter -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-4">
          <div class="flex gap-3 flex-wrap items-end">
            <div>
              <label class="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-1">Filter Kelas (opsional)</label>
              <select id="trenKelas" class="${IC()} w-auto min-w-44 text-sm">
                <option value="">Semua Kelas</option>
                ${krRes.data.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("")}
              </select>
            </div>
            <button onclick="loadTren()" class="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <i class="fas fa-chart-line mr-2"></i>Tampilkan
            </button>
          </div>
        </div>
        <div id="trenContent"><div class="text-center py-10 text-gray-400 dark:text-slate-500"><i class="fas fa-spinner fa-spin text-2xl"></i></div></div>
      </div>`);
    loadTren();
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function loadTren() {
  const kelasId = document.getElementById("trenKelas")?.value || "";
  const taId = selectedSemesterId;
  const div = document.getElementById("trenContent");
  if (!div) return;
  div.innerHTML =
    '<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
  try {
    let q = `/tren/kehadiran?tahun_ajaran_id=${taId}`;
    if (kelasId) q += `&kelas_id=${kelasId}`;
    const [trenRes, jurRes] = await Promise.all([
      apiGet(q),
      apiGet(`/tren/perbandingan-jurusan?tahun_ajaran_id=${taId}`),
    ]);
    const d = trenRes.data;
    const jur = jurRes.data;
    const isDark = document.documentElement.classList.contains("dark");
    const tc = isDark ? "#94a3b8" : "#6b7280";
    const gc = isDark ? "#334155" : "#f3f4f6";

    const pct = d.summary.total
      ? Math.round((d.summary.hadir / d.summary.total) * 100)
      : 0;
    const pctCls =
      pct >= 80
        ? "text-green-600 dark:text-green-400"
        : pct >= 60
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-red-600 dark:text-red-400";

    div.innerHTML = `
      <div class="space-y-5">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 text-center">
            <div class="text-3xl font-bold ${pctCls}">${pct}%</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">Rata-rata Kehadiran</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 text-center">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${d.summary.total_siswa || 0}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">Total Siswa</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${d.summary.hadir || 0}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">Total Hadir</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 text-center">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">${d.summary.alpha || 0}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">Total Alpha</div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 text-center">
            <div class="text-2xl font-bold text-gray-600 dark:text-slate-300">${d.summary.total_hari || 0}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">Hari Sekolah</div>
          </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-5">
            <h3 class="font-bold text-gray-700 dark:text-white text-sm mb-4">📈 Tren Bulanan</h3>
            <canvas id="chartBulan" height="220"></canvas>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-5">
            <h3 class="font-bold text-gray-700 dark:text-white text-sm mb-4">📅 Kehadiran per Hari</h3>
            <canvas id="chartHari" height="220"></canvas>
          </div>
        </div>

        <!-- Chart Jurusan -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow p-5">
          <h3 class="font-bold text-gray-700 dark:text-white text-sm mb-4">🏫 Perbandingan per Jurusan & Tingkat</h3>
          <canvas id="chartJurusan" height="160"></canvas>
        </div>

        <!-- Top Alpha -->
        ${
          d.topAlpha.length > 0
            ? `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow overflow-hidden">
          <div class="p-4 border-b dark:border-slate-700 flex items-center gap-2">
            <i class="fas fa-fire text-red-500"></i>
            <h3 class="font-bold text-gray-700 dark:text-white text-sm">Siswa dengan Alpha Terbanyak</h3>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-slate-700">
            ${d.topAlpha
              .map((s, i) => {
                const pctS = s.pct_hadir || 0;
                const barCls =
                  pctS >= 80
                    ? "bg-green-500"
                    : pctS >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500";
                return `<div class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <div class="w-7 h-7 rounded-full ${i < 3 ? ["bg-red-500", "bg-orange-500", "bg-yellow-500"][i] : "bg-gray-200 dark:bg-slate-700"} text-white flex items-center justify-center text-xs font-bold flex-shrink-0">${i + 1}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm dark:text-white">${s.nama} <span class="text-xs text-gray-400">· ${s.nis}</span></div>
                  <div class="text-xs text-gray-400 dark:text-slate-500">${s.kelas_nama}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 max-w-32"><div class="${barCls} h-1.5 rounded-full" style="width:${pctS}%"></div></div>
                    <span class="text-xs text-gray-500 dark:text-slate-400">${pctS}%</span>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-xl font-bold text-red-600 dark:text-red-400">${s.alpha_count}</div>
                  <div class="text-xs text-gray-400">alpha</div>
                </div>
              </div>`;
              })
              .join("")}
          </div>
        </div>`
            : ""
        }
      </div>`;

    // Destroy old charts
    Object.values(chartInstances).forEach((c) => {
      try {
        c.destroy();
      } catch (e) {}
    });
    chartInstances = {};

    // Chart Bulanan
    if (d.byBulan.length) {
      chartInstances.b = new Chart(document.getElementById("chartBulan"), {
        type: "line",
        data: {
          labels: d.byBulan.map((b) => b.label),
          datasets: [
            {
              label: "Hadir",
              data: d.byBulan.map((b) => b.hadir),
              borderColor: "#22c55e",
              backgroundColor: "rgba(34,197,94,0.1)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "Alpha",
              data: d.byBulan.map((b) => b.alpha),
              borderColor: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { color: tc, font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: tc }, grid: { color: gc } },
            y: { ticks: { color: tc }, grid: { color: gc } },
          },
        },
      });
    } else {
      const cb = document.getElementById("chartBulan");
      if (cb)
        cb.parentElement.innerHTML +=
          '<p class="text-center text-xs text-gray-400 mt-2">Belum ada data absensi untuk ditampilkan.</p>';
    }

    // Chart Hari
    if (d.byHari.length) {
      const hariColors = {
        Senin: "#3b82f6",
        Selasa: "#8b5cf6",
        Rabu: "#06b6d4",
        Kamis: "#10b981",
        Jumat: "#f59e0b",
        Sabtu: "#f97316",
      };
      chartInstances.h = new Chart(document.getElementById("chartHari"), {
        type: "bar",
        data: {
          labels: d.byHari.map((h) => h.hari),
          datasets: [
            {
              label: "% Hadir",
              data: d.byHari.map((h) => h.pct),
              backgroundColor: d.byHari.map(
                (h) => hariColors[h.hari] || "#6b7280",
              ),
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: tc } } },
          scales: {
            x: { ticks: { color: tc }, grid: { color: gc } },
            y: {
              min: 0,
              max: 100,
              ticks: { color: tc, callback: (v) => v + "%" },
              grid: { color: gc },
            },
          },
        },
      });
    }

    // Chart Jurusan
    if (jur.length) {
      const jurLabels = jur.map((j) => `${j.kode || j.jurusan} ${j.tingkat}`);
      chartInstances.j = new Chart(document.getElementById("chartJurusan"), {
        type: "bar",
        data: {
          labels: jurLabels,
          datasets: [
            {
              label: "Hadir",
              data: jur.map((j) => j.hadir),
              backgroundColor: "#22c55e",
              borderRadius: 4,
            },
            {
              label: "Sakit",
              data: jur.map((j) => j.sakit),
              backgroundColor: "#3b82f6",
              borderRadius: 4,
            },
            {
              label: "Izin",
              data: jur.map((j) => j.izin),
              backgroundColor: "#f59e0b",
              borderRadius: 4,
            },
            {
              label: "Alpha",
              data: jur.map((j) => j.alpha),
              backgroundColor: "#ef4444",
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: tc } } },
          scales: {
            x: { stacked: true, ticks: { color: tc }, grid: { color: gc } },
            y: { stacked: true, ticks: { color: tc }, grid: { color: gc } },
          },
        },
      });
    }
  } catch (err) {
    div.innerHTML = errHTML(err.message);
  }
}

// ============================================================
// BATAS KEHADIRAN MINIMUM (admin)
// ============================================================
async function renderBatasKehadiran() {
  setTitle("Batas Kehadiran Minimum", "Atur persentase minimum per kelas");
  loadingUI();
  try {
    const krRes = await apiGet("/kelas?tahun_ajaran_id=" + selectedSemesterId);
    const kelas = krRes.data;
    const grouped = {};
    kelas.forEach((k) => {
      if (!grouped[k.tingkat]) grouped[k.tingkat] = [];
      grouped[k.tingkat].push(k);
    });

    let html = `<div class="space-y-5">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <i class="fas fa-info-circle mr-2"></i>
        Atur persentase kehadiran minimum per kelas. Siswa di bawah batas akan muncul di halaman Alert sebagai <strong>siswa berisiko</strong>.
      </div>`;

    ["X", "XI", "XII"].forEach((t) => {
      if (!grouped[t]) return;
      html += `<div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow overflow-hidden">
        <div class="flex items-center gap-2 p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Tingkat ${t}</span>
          <span class="text-xs text-gray-400 dark:text-slate-500">${grouped[t].length} kelas</span>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-slate-700">
          ${grouped[t]
            .map(
              (k) => `
            <div class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <div class="flex-1">
                <div class="font-medium text-sm dark:text-white">${k.nama}</div>
                <div class="text-xs text-gray-400 dark:text-slate-500">${k.jurusan_nama || ""} · Walas: ${k.walas_nama || "—"}</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <input type="range" id="batas_${k.id}" min="50" max="100" step="5"
                    value="${k.batas_kehadiran || 75}"
                    oninput="document.getElementById('batasVal_${k.id}').textContent=this.value+'%'"
                    class="w-32 accent-blue-600" />
                  <span id="batasVal_${k.id}" class="text-sm font-bold text-blue-700 dark:text-blue-400 w-12">${k.batas_kehadiran || 75}%</span>
                </div>
                <button onclick="saveBatas(${k.id})" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  Simpan
                </button>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`;
    });

    html += `</div>`;
    setContent(html);
  } catch (err) {
    setContent(errHTML(err.message));
  }
}

async function saveBatas(kelasId) {
  const batas = document.getElementById("batas_" + kelasId)?.value;
  try {
    await apiFetch("/kelas/" + kelasId + "/batas-kehadiran", {
      method: "PUT",
      body: JSON.stringify({ batas: parseInt(batas) }),
    });
    showToast(`Batas kehadiran disimpan: ${batas}%`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// UPDATE buildSidebar + navigateTo to include new pages
// ============================================================
const _origBuildSidebar = buildSidebar;
buildSidebar = function (role) {
  const nav = {
    admin: [
      ["fa-tachometer-alt", "Dashboard", "dashboard"],
      ["fa-calendar-alt", "Semester", "semester"],
      ["fa-layer-group", "Jurusan", "jurusan"],
      ["fa-door-open", "Kelas", "kelas"],
      ["fa-chalkboard-teacher", "Guru", "guru"],
      ["fa-user-graduate", "Siswa", "siswa"],
      ["fa-book", "Mata Pelajaran", "mapel"],
      ["fa-clock", "Jadwal", "jadwal"],
      ["fa-clipboard-check", "Absensi Harian", "absensi-harian"],
      ["fa-clipboard-list", "Absensi Mapel", "absensi-mapel"],
      ["fa-chart-bar", "Rekap", "rekap"],
      ["fa-chart-line", "Grafik Tren", "tren"],
      ["fa-bell", "Alert & Risiko", "alert"],
      ["fa-file-medical-alt", "Izin & Sakit", "izin"],
      ["fa-qrcode", "QR Code", "qr-absensi"],
      ["fa-percent", "Batas Kehadiran", "batas-kehadiran"],
      ["fa-file-excel", "Export Excel", "export"],
      ["fa-shield-alt", "Audit Trail", "logs"],
    ],
    guru: [
      ["fa-tachometer-alt", "Dashboard", "dashboard"],
      ["fa-calendar-week", "Jadwal Saya", "jadwal"],
      ["fa-clipboard-check", "Absensi Harian", "absensi-harian"],
      ["fa-clipboard-list", "Absensi Mapel", "absensi-mapel"],
      ["fa-qrcode", "QR Code", "qr-absensi"],
      ["fa-bell", "Alert Siswa", "alert"],
      ["fa-file-medical-alt", "Izin & Sakit", "izin"],
      ["fa-chart-bar", "Rekap Kelas", "rekap"],
      ["fa-chart-line", "Grafik Tren", "tren"],
    ],
    siswa: [
      ["fa-tachometer-alt", "Dashboard", "dashboard"],
      ["fa-calendar-check", "Absensi Saya", "absensi-siswa"],
      ["fa-file-medical-alt", "Izin & Sakit", "izin"],
      ["fa-qrcode", "Scan QR Absensi", "qr-absensi"],
      ["fa-users", "Kelola Kelas", "ketua-kelas"],
      ["fa-chart-pie", "Statistik", "rekap-siswa"],
    ],
  };
  document.getElementById("sidebarNav").innerHTML = (nav[role] || [])
    .map(
      (item) =>
        `<a href="#" onclick="navigateTo('${item[2]}');return false;" id="nav-${item[2]}" class="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm"><i class="fas ${item[0]} w-5 text-center text-sm flex-shrink-0"></i><span>${item[1]}</span></a>`,
    )
    .join("");
};

const _origNavigateTo = navigateTo;
navigateTo = function (page) {
  document
    .querySelectorAll(".sidebar-link")
    .forEach((e) => e.classList.remove("active"));
  const el = document.getElementById("nav-" + page);
  if (el) el.classList.add("active");

  const newPages = {
    tren: renderTren,
    alert: renderAlert,
    izin: renderIzin,
    "qr-absensi": renderQRAbsensi,
    "batas-kehadiran": renderBatasKehadiran,
    logs: renderLogs,
  };
  if (newPages[page]) {
    newPages[page]();
    return;
  }
  _origNavigateTo(page);
};

// ============================================================
// AUTO INIT
// ============================================================
(async () => {
  switchLoginRole("admin");
  const token = getToken(),
    userData = localStorage.getItem("user");
  if (token && userData) {
    try {
      const res = await apiGet("/auth/me");
      await initApp({ ...JSON.parse(userData), ...res.data });
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
})();
