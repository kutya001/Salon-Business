// ============================================
// state.js — Управление состоянием Suluu Business
// ============================================

window.state = {
  isAuthenticated: false,
  currentPage: 'dashboard',
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
    theme: 'hair',
    useFinance: true
  },
  
  // Списки сущностей
  masters: [],
  services: [],
  categories: [],
  bookings: [],
  clients: [],
  transactions: [],
  shifts: [],
  wallets: [],
  transactionCategories: [],
  globalCategories: [],
  globalServices: [],
  
  // UI Состояние
  ui: {
    sidebarOpen: false,
    loading: false,
    modal: null, // Имя активной модалки
    modalData: null, // Данные, переданные в модалку
    filters: {
      status: '',
      masterId: '',
      serviceId: '',
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      searchQuery: ''
    },
    txFilters: {
      search: '',
      type: '',
      categoryId: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: ''
    },
    showTxFilters: false,
    dashboardFilters: {
      periodType: 'today', // 'today', 'all', 'custom'
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      isOpen: false
    },
    selectedDate: new Date().toISOString().split('T')[0],
    toasts: [],
    viewMode: 'table', // 'table' или 'timeline' для записей
    sortField: 'date', // поле сортировки по умолчанию
    sortOrder: 'desc', // направление сортировки по умолчанию
    showSetupInline: false,
    showDevConsole: false
  },
  apiLogs: [] // Массив логов API запросов
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
  
  // Refetch bookings in background if date range changes
  if (updates.dateFrom !== undefined || updates.dateTo !== undefined) {
    api.getAll({ background: true }).then(allData => {
      setState({ bookings: allData.bookings });
    }).catch(e => console.error('Error refetching filtered bookings:', e));
  }
};

// Функция обновления фильтров транзакций
window.setTxFilters = function (updates) {
  if (!window.state.ui.txFilters) {
    window.state.ui.txFilters = {
      search: '',
      type: '',
      categoryId: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: ''
    };
  }
  Object.assign(window.state.ui.txFilters, updates);
  if (window.render) window.render();
};

// Вспомогательная функция ведения лога API
window.logApiCall = function (type, action, details) {
  const time = new Date().toLocaleTimeString('ru-RU');
  const logs = [...(window.state.apiLogs || [])];
  
  logs.unshift({
    time,
    type, // 'send' | 'recv' | 'error'
    action,
    details: typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)
  });
  
  // Ограничиваем лог последними 30 записями
  if (logs.length > 30) logs.pop();
  
  window.state.apiLogs = logs;
  // Рендерим консоль без глубокого вызова setState для предотвращения зацикливания
  if (window.render) window.render();
};
