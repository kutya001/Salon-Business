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
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
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
    'pending': 'Ожидает',
    'confirmed': 'Подтверждена',
    'completed': 'Завершена',
    'cancelled': 'Отменена',
    'no-show': 'Не пришел'
  };
  return labels[status] || status;
};

window.getStatusColor = function (status) {
  const colors = {
    'pending': 'badge-warning',
    'confirmed': 'badge-info',
    'completed': 'badge-success',
    'cancelled': 'badge-danger',
    'no-show': 'badge-secondary'
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
