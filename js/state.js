// ============================================
// state.js — Управление состоянием Suluu Business
// ============================================

window.state = {
  isAuthenticated: false,
  currentPage: 'dashboard',
  gasUrl: '', // Ссылка на Google Apps Script, сохраняется в localStorage
  token: '',  // Токен сессии, сохраняется в sessionStorage
  
  // Данные бизнеса
  business: {
    name: 'Мой салон',
    description: '',
    address: '',
    phone: '',
    email: '',
    workSchedule: {
      mon: { start: '09:00', end: '20:00', enabled: true },
      tue: { start: '09:00', end: '20:00', enabled: true },
      wed: { start: '09:00', end: '20:00', enabled: true },
      thu: { start: '09:00', end: '20:00', enabled: true },
      fri: { start: '09:00', end: '20:00', enabled: true },
      sat: { start: '10:00', end: '18:00', enabled: true },
      sun: { enabled: false }
    },
    theme: 'hair'
  },
  
  // Списки сущностей
  masters: [],
  services: [],
  categories: ['Волосы', 'Ногти', 'Лицо', 'Тело', 'Макияж', 'Брови и ресницы', 'Депиляция', 'Массаж'],
  bookings: [],
  clients: [],
  transactions: [],
  shifts: [],
  
  // UI Состояние
  ui: {
    sidebarOpen: false,
    loading: false,
    modal: null, // Имя активной модалки
    modalData: null, // Данные, переданные в модалку
    filters: {
      status: '',
      masterId: '',
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      searchQuery: ''
    },
    selectedDate: new Date().toISOString().split('T')[0],
    toasts: [],
    viewMode: 'table' // 'table' или 'timeline' для записей
  }
};

// Функция обновления состояния с автоматическим рендером
window.setState = function (updates) {
  Object.assign(window.state, updates);
  if (window.render) window.render();
};

// Функция обновления UI настроек
window.setUI = function (updates) {
  Object.assign(window.state.ui, updates);
  if (window.render) window.render();
};

// Функция обновления фильтров
window.setFilters = function (updates) {
  Object.assign(window.state.ui.filters, updates);
  if (window.render) window.render();
};
