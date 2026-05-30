// ============================================
// router.js — Упрощенный роутер и макет (Layout)
// ============================================

window.navigate = function (page) {
  setUI({ sidebarOpen: false });
  setState({ currentPage: page });
};

window.renderApp = function () {
  let html = '';
  if (!api.isConfigured() || state.currentPage === 'setup') {
    html = renderSetup();
  } else if (!state.isAuthenticated) {
    html = renderAuth();
  } else {
    html = renderLayout();
  }

  return `<div id="app" class="min-h-screen">` + html + `</div>`;
};

window.renderLayout = function () {
  const page = state.currentPage;
  let pageContent = '';

  const isSyncing = state.ui.loading || state.ui.syncingCount > 0;
  const syncClass = isSyncing ? 'sync-icon-spin' : '';
  const logsCount = (state.apiLogs || []).length;

  // Подключение рендеров страниц по условию
  if (page === 'dashboard' && window.renderDashboard) pageContent = renderDashboard();
  else if (page === 'bookings' && window.renderBookings) pageContent = renderBookings();
  else if (page === 'masters' && window.renderMasters) pageContent = renderMasters();
  else if (page === 'clients' && window.renderClients) pageContent = renderClients();
  else if (page === 'services' && window.renderServices) pageContent = renderServices();
  else if (page === 'finance' && window.renderFinance) pageContent = renderFinance();
  else if (page === 'settings' && window.renderSettings) pageContent = renderSettings();
  else pageContent = `<div class="p-8 text-center">Раздел "${page}" находится в разработке</div>`;

  const isSidebarOpen = state.ui.sidebarOpen;
  const businessName = state.business?.name || 'Мой Салон';

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: 'grid' },
    { id: 'bookings', label: 'Записи', icon: 'calendar' },
    { id: 'masters', label: 'Мастера', icon: 'users' },
    { id: 'clients', label: 'Клиенты', icon: 'user' },
    { id: 'services', label: 'Услуги', icon: 'scissors' },
    { id: 'finance', label: 'Финансы', icon: 'dollar-sign' },
    { id: 'settings', label: 'Настройки', icon: 'settings' }
  ];

  const sidebarLinks = menuItems.map(item => {
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="nav-link ${activeClass}" title="${item.label}">
        <span class="nav-icon"><i data-feather="${item.icon}" style="width: 20px; height: 20px;"></i></span>
        <span class="nav-label">${item.label}</span>
      </a>
    `;
  }).join('');

  const mobileTabs = ['dashboard', 'bookings', 'masters', 'finance'].map(id => {
    const item = menuItems.find(m => m.id === id);
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="tab-item ${activeClass}">
        <span class="tab-icon" style="display: flex; align-items: center; justify-content: center; height: 24px;"><i data-feather="${item.icon}" style="width: 20px; height: 20px;"></i></span>
        <span class="tab-label" style="font-size: 10px;">${item.label}</span>
      </a>
    `;
  }).join('');

  // Рендерим тосты
  const toastsHtml = (state.ui.toasts || []).map(toast => {
    const icon = toast.type === 'success' ? '<i data-feather="check-circle" style="width: 18px; height: 18px;"></i>' : toast.type === 'error' ? '<i data-feather="x-octagon" style="width: 18px; height: 18px;"></i>' : '<i data-feather="info" style="width: 18px; height: 18px;"></i>';
    return `
      <div class="toast-item toast-${toast.type} animate-slide-in-right" style="display: flex; align-items: center; gap: 8px;">
        <span style="display: flex; align-items: center;">${icon}</span>
        <span>${toast.message}</span>
      </div>
    `;
  }).join('');

  // Рендерим модалку, если она есть
  let modalHtml = '';
  if (state.ui.modal) {
    let modalContent = '';
    
    // Передаем отрисовку соответствующего окна
    if (state.ui.modal === 'createBooking' && window.renderBookingModal) modalContent = renderBookingModal();
    else if (state.ui.modal === 'editBookingFull' && window.renderEditBookingFullModal) modalContent = renderEditBookingFullModal();
    else if (state.ui.modal === 'viewBooking' && window.renderBookingDetailsModal) modalContent = renderBookingDetailsModal();
    else if (state.ui.modal === 'createMaster' && window.renderMasterModal) modalContent = renderMasterModal();
    else if (state.ui.modal === 'createClient' && window.renderClientModal) modalContent = renderClientModal();
    else if (state.ui.modal === 'viewClient' && window.renderClientDetailsModal) modalContent = renderClientDetailsModal();
    else if (state.ui.modal === 'createService' && window.renderServiceModal) modalContent = renderServiceModal();
    else if (state.ui.modal === 'categories' || state.ui.modal === 'createCategory') {
      if (window.renderCategoriesModal) modalContent = renderCategoriesModal();
    }
    else if (state.ui.modal === 'serviceCategories' || state.ui.modal === 'createServiceCategory') {
      if (window.renderServiceCategoriesModal) modalContent = renderServiceCategoriesModal();
    }
    else if (state.ui.modal === 'createWallet' && window.renderWalletModal) modalContent = renderWalletModal();
    else if (state.ui.modal === 'createTransaction' && window.renderTransactionModal) modalContent = renderTransactionModal();
    else if (state.ui.modal === 'openShift' && window.renderOpenShiftModal) modalContent = renderOpenShiftModal();
    else if (state.ui.modal === 'closeShift' && window.renderCloseShiftModal) modalContent = renderCloseShiftModal();
    else if (state.ui.modal === 'viewShift' && window.renderShiftDetailsModal) modalContent = renderShiftDetailsModal();
    else if (state.ui.modal === 'bookingMessage' && window.renderBookingMessageModal) modalContent = renderBookingMessageModal();
    else if (state.ui.modal === 'viewMaster' && window.renderMasterDetailsModal) modalContent = renderMasterDetailsModal();
    else if (state.ui.modal === 'syncLogs' && window.renderSyncLogsModal) modalContent = renderSyncLogsModal();
    else modalContent = `<div class="p-6">Неизвестное модальное окно: ${state.ui.modal}</div>`;

    modalHtml = `
      <div class="modal-overlay" onmousedown="if(event.target===this) { setUI({modal: null, modalData: null}); }">
        <div class="modal animate-scale-in">
          ${modalContent}
        </div>
      </div>
    `;
  }

  // Рендерим глобальный спиннер загрузки
  const globalSpinner = state.ui.loading ? `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,26,46,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);">
      <div class="card" style="padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        <span class="spinner" style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
        <div style="font-weight: 700; color: #1a1a2e;">Синхронизация данных...</div>
      </div>
    </div>
  ` : '';

  const syncingIcon = (state.ui.syncingCount > 0) ? `<i data-feather="refresh-cw" class="sync-icon-spin" style="width: 16px; height: 16px; margin-left: 8px; color: var(--primary);"></i>` : '';

  return `
    <div class="app-layout ${state.ui.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <!-- Кнопка синхронизации для десктопа в правом верхнем углу -->
      <button onclick="setUI({ modal: 'syncLogs' })" class="hidden lg-flex" style="position: fixed; top: 24px; right: 40px; z-index: 999; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 8px 16px; font-size: 13px; font-weight: 700; color: var(--text); align-items: center; gap: 8px; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
        <i data-feather="refresh-cw" class="${syncClass}" style="width: 16px; height: 16px; color: var(--primary);"></i>
        <span>Синхронизация</span>
        ${logsCount > 0 ? `<span style="background: #ef4444; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 10px; margin-left: 2px;">${logsCount}</span>` : ''}
      </button>

      <!-- Навигационная панель для десктопа -->
      <aside class="sidebar glass-island">
        <div class="sidebar-header" style="padding: 24px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
            <div style="color: var(--primary); min-width: 28px;"><i data-feather="hexagon" style="width: 28px; height: 28px;"></i></div>
            <div class="sidebar-logo-text">
              <h2 style="font-weight: 800; font-size: 18px; color: var(--text); line-height: 1.2;">Suluu</h2>
              <p style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">Управление бизнесом</p>
            </div>
          </div>
          <button onclick="setUI({ sidebarCollapsed: !state.ui.sidebarCollapsed })" class="sidebar-toggle-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 24px;">
            <i data-feather="${state.ui.sidebarCollapsed ? 'chevron-right' : 'chevron-left'}" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        <nav class="sidebar-menu" style="padding: 16px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1; overflow-x: hidden;">
          ${sidebarLinks}
        </nav>
        <div class="sidebar-footer" style="padding: 16px; border-top: 1px solid var(--border); overflow-x: hidden;">
          <div class="sidebar-business-name" style="font-size: 13px; font-weight: 600; padding: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <i data-feather="briefcase" style="width: 16px; height: 16px; min-width: 16px;"></i> <span>${businessName}</span>
          </div>
          <button onclick="api.logout()" title="Выйти" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05);">
            <i data-feather="log-out" style="width: 16px; height: 16px; min-width: 16px;"></i> <span class="sidebar-action-text">Выйти</span>
          </button>
        </div>
      </aside>

      <header class="top-bar glass-island">
        <button onclick="setUI({ sidebarOpen: true })" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 4px; color: var(--text);">
          <i data-feather="menu"></i>
        </button>
        <div style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 6px;">
          <i data-feather="hexagon" style="width: 20px; height: 20px; color: var(--primary);"></i> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${businessName}</span> ${syncingIcon}
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          ${page === 'bookings' ? `
            <button onclick="setUI({ showMobileSearch: !state.ui.showMobileSearch, showMobileFilters: false })" style="background: none; border: none; cursor: pointer; color: var(--text); padding: 4px;"><i data-feather="search" style="width: 20px; height: 20px;"></i></button>
            <button onclick="setUI({ showMobileFilters: !state.ui.showMobileFilters, showMobileSearch: false })" style="background: none; border: none; cursor: pointer; color: var(--text); padding: 4px;"><i data-feather="sliders" style="width: 20px; height: 20px;"></i></button>
          ` : ''}
          <button onclick="setUI({ modal: 'syncLogs' })" style="background: none; border: none; cursor: pointer; color: var(--text); padding: 4px; display: flex; align-items: center; justify-content: center; position: relative;">
            <i data-feather="refresh-cw" class="${syncClass}" style="width: 20px; height: 20px; color: var(--primary);"></i>
            ${logsCount > 0 ? `<div style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; font-size: 8px; font-weight: 800; width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--bg); font-family: sans-serif;">${logsCount}</div>` : ''}
          </button>
        </div>
      </header>

      <!-- Выпадающий оверлей-сайдбар для мобильных -->
      <div class="mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}" onclick="setUI({ sidebarOpen: false })">
        <aside class="mobile-sidebar glass-island" onclick="event.stopPropagation()">
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="color: var(--primary);"><i data-feather="hexagon" style="width: 28px; height: 28px;"></i></div>
              <span style="font-weight: 800; font-size: 18px; color: var(--text);">Suluu Business</span>
            </div>
            <button onclick="setUI({ sidebarOpen: false })" style="background: none; border: none; cursor: pointer; color: var(--text);"><i data-feather="x"></i></button>
          </div>
          <nav style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
            ${sidebarLinks}
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 12px 0;">
            <button onclick="api.logout()" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05); cursor: pointer;">
              <i data-feather="log-out" style="width: 18px; height: 18px;"></i> Выйти из аккаунта
            </button>
          </nav>
        </aside>
      </div>

      <!-- Главная область контента -->
      <main class="main-content">
        <div class="container-max">
          ${pageContent}
        </div>
      </main>

      <nav class="bottom-nav glass-island">
        ${mobileTabs}
      </nav>

      <!-- Контейнер для тостов -->
      <div class="toast-container">
        ${toastsHtml}
      </div>

      <!-- Модальные окна -->
      ${modalHtml}

      <!-- Загрузчик -->
      ${globalSpinner}
    </div>
  `;
};

window.renderSyncLogsModal = function () {
  const isSyncing = state.ui.loading || state.ui.syncingCount > 0;
  const syncClass = isSyncing ? 'sync-icon-spin' : '';
  const logsCount = (state.apiLogs || []).length;

  const logsHtml = logsCount === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 40px 20px;">
      <i data-feather="cloud-off" style="width: 48px; height: 48px; color: var(--border); margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;"></i>
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Сетевой лог пуст</div>
      <p style="font-size: 12px;">Активные обмены данными с Google Apps Script еще не происходили.</p>
    </div>
  ` : state.apiLogs.map(log => {
      let color = '#a78bfa'; // purple for send
      let prefix = '📤 ОТПРАВЛЕНО';
      if (log.type === 'recv') {
        color = '#34d399'; // green for recv
        prefix = '📥 ПОЛУЧЕНО';
      } else if (log.type === 'error') {
        color = '#f87171'; // red for error
        prefix = '❌ ОШИБКА';
      }
      return `
        <div style="border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 10px; font-family: monospace;">
          <div style="display: flex; gap: 8px; color: ${color}; font-weight: 700; font-size: 12px; align-items: center; justify-content: space-between;">
            <span style="display: flex; align-items: center; gap: 6px;">[${log.time}] ${prefix}</span>
            <span style="background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: normal; color: var(--text-secondary);">${log.action}</span>
          </div>
          <pre style="margin-top: 6px; color: #e2e8f0; font-size: 10px; overflow-x: auto; white-space: pre-wrap; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px; max-height: 120px; border: 1px solid var(--border);">${log.details}</pre>
        </div>
      `;
  }).join('');

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 600px; width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <div>
          <h3 style="font-weight: 800; font-size: 18px; color: var(--text); display: flex; align-items: center; gap: 8px;">
            <i data-feather="cloud-lightning" style="color: var(--primary);"></i> Сетевой шлюз GAS
          </h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Контроль и детализация обмена данными</p>
        </div>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="forceSync()" class="btn btn-primary" style="flex: 2; min-width: 180px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i data-feather="refresh-cw" class="${syncClass}" style="width: 16px; height: 16px;"></i>
          ${isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
        </button>
        <button onclick="setState({ apiLogs: [] })" class="btn btn-secondary" style="flex: 1; min-width: 100px; color: #f87171; border-color: rgba(248,113,113,0.2); background: rgba(248,113,113,0.05); display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> Очистить
        </button>
      </div>

      <div class="scrollbar-hide" style="max-height: 40vh; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; background: var(--bg-secondary); border-radius: 12px; padding: 12px; border: 1px solid var(--border);">
        ${logsHtml}
      </div>
    </div>
  `;
};
