// ============================================
// utils.js — Форматирование и вспомогательные функции
// ============================================

window.formatPrice = function (amount) {
  const number = parseFloat(amount) || 0;
  return new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(number) + ' сом';
};

window.formatDate = function (dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).replace(' г.', '');
};

window.formatClientPhone = function(phone) {
  if (!phone) return '';
  const phoneStr = String(phone);
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.startsWith('996')) {
    return '+' + clean;
  }
  return '+996' + clean;
};

window.formatRelativeDate = function (dateStr) {
  if (!dateStr) return '';
  const today = new Date().toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  
  if (dateStr === today) return 'Сегодня';
  if (dateStr === yesterday) return 'Вчера';
  
  return formatDate(dateStr);
};

window.formatTime = function (timeStr) {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  return timeStr.substring(0, 5);
};

window.formatDateTime = function (dateStr, timeStr) {
  return `${formatRelativeDate(dateStr)} в ${formatTime(timeStr)}`;
};

window.showToast = function (message, type = 'info', duration = 3000) {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const toasts = [...(state.ui.toasts || [])];
  
  toasts.push({ id, message, type });
  setUI({ toasts });
  
  setTimeout(() => {
    const currentToasts = [...(state.ui.toasts || [])];
    const index = currentToasts.findIndex(t => t.id === id);
    if (index !== -1) {
      currentToasts.splice(index, 1);
      setUI({ toasts: currentToasts });
    }
  }, duration);
};

window.getStatusLabel = function (status) {
  const labels = {
    'pending': 'Записан',
    'confirmed': 'Подтверждён',
    'completed': 'Выполнен',
    'cancelled': 'Отмена'
  };
  return labels[status] || status;
};

window.getStatusIcon = function (status) {
  const icons = {
    'pending': 'clock',
    'confirmed': 'check-circle',
    'completed': 'credit-card',
    'cancelled': 'x-circle'
  };
  return icons[status] || 'info';
};

window.getStatusColor = function (status) {
  const colors = {
    'pending': 'badge-warning',
    'confirmed': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-danger'
  };
  return colors[status] || 'badge-info';
};

window.getInitials = function (name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

window.durationToMinutes = function(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return parseInt(durationStr, 10) || 60;
  if (!durationStr.includes(':')) return parseInt(durationStr, 10) || 60; // fallback for old integer data
  const parts = durationStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

window.minutesToDuration = function(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

window.generateTimeSlots = function (start, end, step = 30) {
  const slots = [];
  let current = parseTimeToMinutes(start);
  const finish = parseTimeToMinutes(end);
  
  while (current <= finish) {
    const hours = Math.floor(current / 60).toString().padStart(2, '0');
    const minutes = (current % 60).toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    current += step;
  }
  return slots;
};

function parseTimeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Менеджер тем оформления
window.ThemeManager = {
  setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
  },
  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'hair';
  },
  init() {
    const savedTheme = state.business?.theme || 'hair';
    this.setTheme(savedTheme);
  }
};

window.formatMasterTime = function (val) {
  if (!val) return '09:00';
  if (typeof val === 'string' && val.includes('1899-12-30')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
  }
  return val;
};

// Функция для получения информации по нескольким услугам (разделенным запятой)
window.getServicesInfo = function (serviceIdsStr) {
  if (!serviceIdsStr) return { name: 'Неизвестная услуга', price: 0, duration: '01:00', durationMins: 60 };
  
  const ids = serviceIdsStr.split(',').map(id => id.trim()).filter(Boolean);
  let totalPrice = 0;
  let totalDurationMins = 0;
  let names = [];
  
  ids.forEach(id => {
    const s = (window.state.services || []).find(x => x.id === id);
    if (s) {
      totalPrice += parseFloat(s.price) || 0;
      totalDurationMins += window.durationToMinutes(s.duration);
      names.push(s.name);
    }
  });
  
  return {
    name: names.length > 0 ? names.join(' + ') : 'Неизвестная услуга',
    price: totalPrice,
    duration: window.minutesToDuration(totalDurationMins || 60),
    durationMins: totalDurationMins || 60
  };
};
