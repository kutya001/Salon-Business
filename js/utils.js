// ============================================
// utils.js — Форматирование и вспомогательные функции
// ============================================

window.formatPrice = function (amount) {
  const number = parseFloat(amount) || 0;
  return new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(number) + ' сом';
};

window.parseDateTimeRU = function (dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Если это ISO с дефисами, например, "2026-05-31" или ISO-строка
  if (typeof dateStr === 'string' && (dateStr.includes('T') || (dateStr.includes('-') && dateStr.indexOf('.') === -1))) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Парсим формат DD.MM.YYYY HH:mm:ss или DD.MM.YYYY
  if (typeof dateStr === 'string') {
    const parts = dateStr.trim().split(' ');
    // Поддержка дефисов или точек
    const dateParts = parts[0].includes('-') ? parts[0].split('-') : parts[0].split('.');
    if (dateParts.length === 3) {
      let day, month, year;
      if (dateParts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1;
        day = parseInt(dateParts[2], 10);
      } else {
        // DD.MM.YYYY
        day = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1;
        year = parseInt(dateParts[2], 10);
      }
      
      let hours = 0, minutes = 0, seconds = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
        seconds = parseInt(timeParts[2], 10) || 0;
      }
      return new Date(year, month, day, hours, minutes, seconds);
    }
  }
  
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

window.formatDate = function (dateStr) {
  if (!dateStr) return '';
  const date = window.parseDateTimeRU(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).replace(' г.', '');
};

window.formatDateTimeRU = function(dateObj) {
  const d = dateObj || new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

window.formatClientPhone = function(phone) {
  if (!phone) return '';
  const phoneStr = String(phone);
  let clean = phoneStr.replace(/\D/g, '');
  
  if (clean.startsWith('996')) {
    clean = clean.substring(3);
  }
  
  if (clean.length === 0) return '+996';
  
  let formatted = '+996 ';
  if (clean.length > 0) {
    formatted += clean.substring(0, 3);
  }
  if (clean.length > 3) {
    formatted += ' ' + clean.substring(3, 6);
  }
  if (clean.length > 6) {
    formatted += ' ' + clean.substring(6, 9);
  }
  return formatted.trim();
};

window.handlePhoneInput = function(e) {
  const input = e.target;
  let cursorPosition = input.selectionStart;
  const oldLength = input.value.length;
  
  input.value = window.formatClientPhone(input.value);
  
  if (cursorPosition !== null) {
    const newLength = input.value.length;
    cursorPosition = cursorPosition + (newLength - oldLength);
    input.setSelectionRange(cursorPosition, cursorPosition);
  }
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

window.forceAppUpdate = async function() {
  showToast('Обновление приложения...', 'info');
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.update()));
    }
    showToast('Приложение успешно обновлено!', 'success');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  } catch (err) {
    console.error('Ошибка очистки кэша:', err);
    window.location.reload(true);
  }
};
