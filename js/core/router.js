// ============================================
// router.js — Упрощенный роутер и макет (Layout)
// ============================================

window.navigate = function (page) {
  setUI({ sidebarOpen: false });
  setState({ currentPage: page });
};

window.renderApp = function () {
  if (!api.isConfigured()) {
    return renderSetup();
  }
  if (!state.isAuthenticated) {
    return renderAuth();
  }
  return renderLayout();
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
    { id: 'dashboard', label: 'Дашборд', icon: '📊' },
    { id: 'bookings', label: 'Записи', icon: '📅' },
    { id: 'masters', label: 'Мастера', icon: '👩‍🎨' },
    { id: 'clients', label: 'Клиенты', icon: '👥' },
    { id: 'services', label: 'Услуги', icon: '💇' },
    { id: 'finance', label: 'Финансы', icon: '💰' },
    { id: 'settings', label: 'Настройки', icon: '⚙️' }
  ];

  // Рендерим пункты меню
  const sidebarLinks = menuItems.map(item => {
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="nav-link ${activeClass}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  // Рендерим вкладки нижнего меню для мобильных
  const mobileTabs = menuItems.slice(0, 4).concat([menuItems[5]]).map(item => {
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="tab-item ${activeClass}">
        <span class="tab-icon" style="font-size: 20px;">${item.icon}</span>
        <span class="tab-label" style="font-size: 10px;">${item.label}</span>
      </a>
    `;
  }).join('');

  // Рендерим тосты
  const toastsHtml = (state.ui.toasts || []).map(toast => {
    const icon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️';
    return `
      <div class="toast-item toast-${toast.type} animate-slide-in-right">
        <span>${icon}</span>
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
    else if (state.ui.modal === 'createTransaction' && window.renderTransactionModal) modalContent = renderTransactionModal();
    else if (state.ui.modal === 'openShift' && window.renderOpenShiftModal) modalContent = renderOpenShiftModal();
    else if (state.ui.modal === 'closeShift' && window.renderCloseShiftModal) modalContent = renderCloseShiftModal();
    else if (state.ui.modal === 'viewShift' && window.renderShiftDetailsModal) modalContent = renderShiftDetailsModal();
    else modalContent = `<div class="p-6">Неизвестное модальное окно: ${state.ui.modal}</div>`;

    modalHtml = `
      <div class="modal-overlay" onclick="if(event.target===this) setUI({modal: null, modalData: null})">
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

  return `
    <div class="app-layout">
      <!-- Навигационная панель для десктопа -->
      <aside class="sidebar">
        <div class="sidebar-header" style="padding: 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border);">
          <div style="font-size: 32px;">💎</div>
          <div>
            <h2 style="font-weight: 800; font-size: 18px; color: var(--text); line-height: 1.2;">Suluu</h2>
            <p style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">Управление бизнесом</p>
          </div>
        </div>
        <nav class="sidebar-menu" style="padding: 16px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1;">
          ${sidebarLinks}
        </nav>
        <div style="padding: 16px; border-top: 1px solid var(--border);">
          <div style="font-size: 13px; font-weight: 600; padding: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px;">
            🏢 ${businessName}
          </div>
          <button onclick="api.logout()" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05);">
            <span>🚪</span> Выйти
          </button>
        </div>
      </aside>

      <!-- Шапка для мобильных телефонов -->
      <header class="top-bar">
        <button onclick="setUI({ sidebarOpen: true })" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 4px; color: var(--text);">
          ☰
        </button>
        <div style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 6px;">
          💎 ${businessName}
        </div>
        <div style="width: 32px;"></div>
      </header>

      <!-- Выпадающий оверлей-сайдбар для мобильных -->
      <div class="mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}" onclick="setUI({ sidebarOpen: false })">
        <aside class="mobile-sidebar" onclick="event.stopPropagation()">
          <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 28px;">💎</span>
              <span style="font-weight: 800; font-size: 18px; color: var(--text);">Suluu Business</span>
            </div>
            <button onclick="setUI({ sidebarOpen: false })" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text);">✕</button>
          </div>
          <nav style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
            ${sidebarLinks}
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 12px 0;">
            <button onclick="api.logout()" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05); cursor: pointer;">
              🚪 Выйти из аккаунта
            </button>
          </nav>
        </aside>
      </div>

      <!-- Главная область контента -->
      <main class="main-content">
        ${pageContent}
      </main>

      <!-- Нижнее меню для мобильных -->
      <nav class="bottom-nav">
        ${mobileTabs}
        <a href="#" onclick="event.preventDefault(); navigate('settings')" class="tab-item ${page === 'settings' ? 'active' : ''}">
          <span class="tab-icon" style="font-size: 20px;">⚙️</span>
          <span class="tab-label" style="font-size: 10px;">Настройки</span>
        </a>
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
