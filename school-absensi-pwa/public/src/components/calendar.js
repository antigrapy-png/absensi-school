// =============================================
// Calendar Component
// =============================================
const Calendar = (() => {
  const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  let current = new Date();
  let selected = null;
  let markedDates = {}; // { 'YYYY-MM-DD': { type:'libur'|'event', label } }
  let onSelectFn = null;

  function setMarked(dates) { markedDates = dates || {}; }
  function onSelect(fn) { onSelectFn = fn; }

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const year = current.getFullYear(), month = current.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const today = new Date().toISOString().slice(0, 10);

    let cells = '';
    // Empty cells before first day
    for (let i = 0; i < startPad; i++) {
      const prevDate = new Date(year, month, -startPad + i + 1);
      cells += `<div class="cal-day other-month">${prevDate.getDate()}</div>`;
    }
    // Days
    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const mark = markedDates[dateStr];
      const isToday    = dateStr === today;
      const isSelected = dateStr === selected;
      const isLibur    = mark?.type === 'libur';
      const hasData    = mark?.type === 'event';
      let cls = 'cal-day';
      if (isToday) cls += ' today';
      if (isSelected && !isToday) cls += ' selected';
      if (isLibur) cls += ' libur';
      if (hasData) cls += ' has-data';
      cells += `<div class="${cls}" onclick="Calendar.selectDay('${dateStr}')" title="${mark?.label || ''}">${d}</div>`;
    }
    // Fill remaining
    const total = startPad + last.getDate();
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= remain; i++) {
      cells += `<div class="cal-day other-month">${i}</div>`;
    }

    container.innerHTML = `
      <div class="cal-month-nav">
        <button class="btn btn-ghost btn-icon" onclick="Calendar.prevMonth()"><i class="fas fa-chevron-left"></i></button>
        <span class="cal-month-title">${MONTHS[month]} ${year}</span>
        <button class="btn btn-ghost btn-icon" onclick="Calendar.nextMonth()"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="calendar-grid">${DAYS.map(d => `<div class="cal-header">${d}</div>`).join('')}${cells}</div>`;
  }

  function selectDay(dateStr) {
    selected = dateStr;
    const containerId = document.querySelector('[data-calendar]')?.id;
    if (containerId) render(containerId);
    if (onSelectFn) onSelectFn(dateStr, markedDates[dateStr]);
  }

  function prevMonth() {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const containerId = document.querySelector('[data-calendar]')?.id;
    if (containerId) render(containerId);
  }
  function nextMonth() {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const containerId = document.querySelector('[data-calendar]')?.id;
    if (containerId) render(containerId);
  }

  return { render, selectDay, prevMonth, nextMonth, setMarked, onSelect, MONTHS };
})();
