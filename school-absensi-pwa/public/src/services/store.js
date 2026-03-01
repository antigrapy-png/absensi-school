// =============================================
// AbsensiKu PWA — Reactive Store
// =============================================
const store = (() => {
  const state = {
    user: null,
    semesters: [],
    activeSemesterId: null,
    selectedSemesterId: null,
    notifCount: 0,
    izinCount: 0,
    isOnline: navigator.onLine,
    isDark: true, // PWA always dark
    chartInstances: {},
    navHistory: [],
    currentPage: null,
  };

  const listeners = {};

  function get(key) { return state[key]; }

  function set(key, val) {
    state[key] = val;
    if (listeners[key]) listeners[key].forEach(fn => fn(val));
  }

  function on(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return () => { listeners[key] = listeners[key].filter(f => f !== fn); };
  }

  function destroyCharts() {
    Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(e) {} });
    state.chartInstances = {};
  }

  // Persist user + token
  function saveUser(user, token) {
    state.user = user;
    localStorage.setItem('pwa_token', token);
    localStorage.setItem('pwa_user', JSON.stringify(user));
  }

  function loadUser() {
    const raw = localStorage.getItem('pwa_user');
    if (raw) state.user = JSON.parse(raw);
    return state.user;
  }

  function clearUser() {
    state.user = null;
    localStorage.removeItem('pwa_token');
    localStorage.removeItem('pwa_user');
  }

  function getActiveTaId() {
    return state.selectedSemesterId || state.activeSemesterId;
  }

  // Online/offline tracking
  window.addEventListener('online',  () => { set('isOnline', true);  showToast('Kembali online', 'success'); });
  window.addEventListener('offline', () => { set('isOnline', false); showToast('Offline — data dari cache', 'warning'); });

  return { get, set, on, destroyCharts, saveUser, loadUser, clearUser, getActiveTaId };
})();
