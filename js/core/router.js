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

  // Добавляем глобальную панель логов GAS API в самом низу экрана
  const showDevConsole = state.ui.showDevConsole;
  const logsCount = (state.apiLogs || []).length;
  
  const devConsoleHtml = showDevConsole ? `
    <div class="dev-console" style="position: fixed; bottom: 80px; left: 20px; right: 20px; height: 260px; background: rgba(15, 23, 42, 0.95); border: 2px dashed #3b82f6; border-radius: 20px; z-index: 99999; display: flex; flex-direction: column; overflow: hidden; font-family: monospace; color: #38bdf8; box-shadow: 0 20px 50px rgba(0,0,0,0.5); backdrop-filter: blur(12px); animation: slideUp 0.3s forwards;">
        <div style="padding: 10px 18px; background: rgba(30, 41, 59, 0.9); border-bottom: 1px dashed #3b82f6; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
            <span style="font-weight: 800; color: #38bdf8;">📡 Лог сетевой интеграции с Google Apps Script</span>
            <div style="display: flex; gap: 12px; align-items: center;">
                <button onclick="setState({ apiLogs: [] })" style="background: none; border: none; color: #f43f5e; cursor: pointer; font-size: 11px; font-weight: 700;">🧹 Очистить</button>
                <button onclick="setUI({ showDevConsole: false })" style="background: none; border: none; color: white; cursor: pointer; font-size: 15px; font-weight: 700;">✕</button>
            </div>
        </div>
        <div style="flex-grow: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; font-size: 11px; text-align: left;">
            ${logsCount === 0 ? `
                <div style="color: #94a3b8; text-align: center; padding-top: 60px;">Сеть пассивна. Ждем сетевой активности...</div>
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
                  <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
                    <div style="display: flex; gap: 10px; color: ${color}; font-weight: 700;">
                      <span>[${log.time}]</span>
                      <span>${prefix}</span>
                      <span>"${log.action}"</span>
                    </div>
                    <pre style="margin-top: 4px; color: #e2e8f0; font-size: 10px; overflow-x: auto; white-space: pre-wrap; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px; max-height: 80px;">${log.details}</pre>
                  </div>
                `;
            }).join('')}
        </div>
    </div>
  ` : `
    <button onclick="setUI({ showDevConsole: true })" title="Лог GAS API" style="position: fixed; bottom: 80px; left: 20px; width: 44px; height: 44px; border-radius: 22px; background: #0f172a; color: #38bdf8; border: 1px dashed #3b82f6; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 99998; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <span style="font-size: 16px;">📡</span>
        ${logsCount > 0 ? `<div style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 10px; font-weight: 800; width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">${logsCount}</div>` : ''}
    </button>
  `;

  return `<div id="app" class="min-h-screen">` + html + devConsoleHtml + `</div>`;
};

window.renderLayout = function () {
  const page = state.currentPage;
  let pageContent = '';

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
    else if (state.ui.modal === 'viewBooking' && window.renderBookingDetailsModal) modalContent = renderBookingDetailsModal();
    else if (state.ui.modal === 'createMaster' && window.renderMasterModal) modalContent = renderMasterModal();
    else if (state.ui.modal === 'createClient' && window.renderClientModal) modalContent = renderClientModal();
    else if (state.ui.modal === 'viewClient' && window.renderClientDetailsModal) modalContent = renderClientDetailsModal();
    else if (state.ui.modal === 'createService' && window.renderServiceModal) modalContent = renderServiceModal();
    else if (state.ui.modal === 'categories' || state.ui.modal === 'createCategory') {
      if (window.renderCategoriesModal) modalContent = renderCategoriesModal();
    }
    else if (state.ui.modal === 'createWallet' && window.renderWalletModal) modalContent = renderWalletModal();
    else if (state.ui.modal === 'createTransaction' && window.renderTransactionModal) modalContent = renderTransactionModal();
    else if (state.ui.modal === 'openShift' && window.renderOpenShiftModal) modalContent = renderOpenShiftModal();
    else if (state.ui.modal === 'closeShift' && window.renderCloseShiftModal) modalContent = renderCloseShiftModal();
    else if (state.ui.modal === 'viewShift' && window.renderShiftDetailsModal) modalContent = renderShiftDetailsModal();
    else if (state.ui.modal === 'bookingMessage' && window.renderBookingMessageModal) modalContent = renderBookingMessageModal();
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
          <button onclick="forceSync()" title="Принудительная синхронизация" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; color: var(--primary); border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.05); margin-bottom: 8px;">
            <i data-feather="refresh-cw" style="width: 16px; height: 16px; min-width: 16px;"></i> <span class="sidebar-action-text">Синхронизировать</span>
          </button>
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
          ` : '<div style="width: 32px;"></div>'}
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
