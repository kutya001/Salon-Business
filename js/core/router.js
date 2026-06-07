// ============================================
// router.js — Упрощенный роутер и макет (Layout) с поддержкой ролей
// ============================================

window.hasPermission = function(permissionName) {
  const role = state.userProfile?.role || 'master';
  if (role === 'owner' || role === 'super_admin') return true;
  if (role === 'master') {
    if (permissionName === 'dashboard_view') return true;
    if (permissionName === 'bookings_view') return true;
    if (permissionName === 'settings_view_profile') return true;
    return false;
  }
  if (role === 'manager') {
    const activeEmployment = (state.myEmployments || []).find(e => e.business_id === state.ui.activeBusinessId && e.status === 'approved');
    const permissions = activeEmployment?.permissions || {};
    return permissions[permissionName] !== false;
  }
  return false;
};

window.navigate = function (page) {
  setUI({ sidebarOpen: false });
  
  if (page === 'dashboard' && !hasPermission('dashboard_view')) return;
  if (page === 'bookings' && !hasPermission('bookings_view')) return;
  if (page === 'masters' && !hasPermission('employees_view')) return;
  if (page === 'clients' && !hasPermission('clients_view')) return;
  if (page === 'services' && !hasPermission('services_view')) return;
  if (page === 'finance' && (!hasPermission('finance_view') || state.business?.useFinance === false)) return;
  if (page === 'super_admin_panel' && state.userProfile?.role !== 'super_admin') return;

  setState({ currentPage: page });
};

window.switchActiveBusiness = async function (bizId) {
  setUI({ 
    activeBusinessId: bizId, 
    loading: true,
    templatesDraft: null,
    filters: {
      ...state.ui.filters,
      masterId: '',
      serviceId: '',
      searchQuery: ''
    }
  });
  try {
    const allData = await api.getAll();
    setState({
      business: allData.business || state.business,
      categories: allData.categories || [],
      masters: allData.masters || [],
      services: allData.services || [],
      bookings: allData.bookings || [],
      clients: allData.clients || [],
      transactions: allData.transactions || [],
      shifts: allData.shifts || [],
      wallets: allData.wallets || [],
      transactionCategories: allData.transactionCategories || [],
      jobApplications: allData.jobApplications || []
    });
    showToast('Активный салон изменен', 'success');
  } catch (err) {
    showToast('Ошибка при переключении салона', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.renderApp = function () {
  let html = '';
  if (!api.isConfigured() || state.currentPage === 'setup') {
    html = renderSetup();
  } else if (state.currentPage === 'landing') {
    html = renderLanding();
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

  const role = state.userProfile?.role || 'master';

  // Маршрутизация по страницам
  if (page === 'dashboard' && window.renderDashboard) pageContent = renderDashboard();
  else if (page === 'bookings' && window.renderBookings) pageContent = renderBookings();
  else if (page === 'masters' && window.renderMasters) pageContent = renderMasters();
  else if (page === 'clients' && window.renderClients) pageContent = renderClients();
  else if (page === 'services' && window.renderServices) pageContent = renderServices();
  else if (page === 'finance' && window.renderFinance) pageContent = renderFinance();
  else if (page === 'settings' && window.renderSettings) pageContent = renderSettings();
  else if (page === 'job_search' && window.renderJobSearch) pageContent = renderJobSearch();
  else if (page === 'super_admin_panel' && window.renderSuperAdminPanel) pageContent = renderSuperAdminPanel();
  else pageContent = `<div class="p-8 text-center">Раздел "${page}" недоступен или находится в разработке</div>`;

  const isSidebarOpen = state.ui.sidebarOpen;
  const businessName = state.business?.name || 'Мой Салон';

  // Определение пунктов меню по ролям
  let menuItems = [];
  if (role === 'super_admin') {
    menuItems = [
      { id: 'super_admin_panel', label: 'Админ-панель', icon: 'shield' },
      { id: 'settings', label: 'Настройки', icon: 'settings' }
    ];
  } else {
    if (hasPermission('dashboard_view')) {
      menuItems.push({ id: 'dashboard', label: 'Главное', icon: 'grid' });
    }
    if (hasPermission('bookings_view')) {
      menuItems.push({ id: 'bookings', label: 'Записи', icon: 'calendar' });
    }
    if (hasPermission('employees_view')) {
      menuItems.push({ id: 'masters', label: 'Сотрудники', icon: 'users' });
    }
    if (hasPermission('clients_view')) {
      menuItems.push({ id: 'clients', label: 'Клиенты', icon: 'user' });
    }
    if (hasPermission('services_view')) {
      menuItems.push({ id: 'services', label: 'Услуги', icon: 'scissors' });
    }
    if (hasPermission('finance_view') && (role === 'owner' || role === 'manager') && state.business?.useFinance !== false) {
      menuItems.push({ id: 'finance', label: 'Финансы', icon: 'dollar-sign' });
    }
    if (role === 'master' || role === 'manager') {
      menuItems.push({ id: 'job_search', label: 'Поиск работы', icon: 'search' });
    }
    menuItems.push({ id: 'settings', label: 'Настройки', icon: 'settings' });
  }

  const sidebarLinks = menuItems.map(item => {
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="nav-link ${activeClass}" title="${item.label}">
        <span class="nav-icon"><i data-feather="${item.icon}" style="width: 20px; height: 20px;"></i></span>
        <span class="nav-label">${item.label}</span>
      </a>
    `;
  }).join('');

  // Нижняя панель для мобильных
  let mobileTabsList = [];
  if (role === 'super_admin') {
    mobileTabsList = ['super_admin_panel', 'settings'];
  } else {
    if (hasPermission('dashboard_view')) mobileTabsList.push('dashboard');
    if (hasPermission('bookings_view')) mobileTabsList.push('bookings');
    if (hasPermission('employees_view')) mobileTabsList.push('masters');
    if (hasPermission('finance_view') && (role === 'owner' || role === 'manager') && state.business?.useFinance !== false) {
      mobileTabsList.push('finance');
    } else if (role === 'master' || role === 'manager') {
      mobileTabsList.push('job_search');
    }
    if (mobileTabsList.length === 0) {
      mobileTabsList.push('settings');
    }
  }

  const mobileTabs = mobileTabsList.map(id => {
    const item = menuItems.find(m => m.id === id) || { id, label: 'Поиск', icon: 'search' };
    const activeClass = page === item.id ? 'active' : '';
    return `
      <a href="#" onclick="event.preventDefault(); navigate('${item.id}')" class="tab-item ${activeClass}">
        <span class="tab-icon" style="display: flex; align-items: center; justify-content: center; height: 28px;"><i data-feather="${item.icon}" style="width: 24px; height: 24px;"></i></span>
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

  // Рендерим модалку
  let modalHtml = '';
  if (state.ui.modal) {
    let modalContent = '';
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
    else if (state.ui.modal === 'viewTransaction' && window.renderTransactionDetailsModal) modalContent = renderTransactionDetailsModal();
    else if (state.ui.modal === 'openShift' && window.renderOpenShiftModal) modalContent = renderOpenShiftModal();
    else if (state.ui.modal === 'closeShift' && window.renderCloseShiftModal) modalContent = renderCloseShiftModal();
    else if (state.ui.modal === 'viewShift' && window.renderShiftDetailsModal) modalContent = renderShiftDetailsModal();
    else if (state.ui.modal === 'editShiftCash' && window.renderEditShiftCashModal) modalContent = renderEditShiftCashModal();
    else if (state.ui.modal === 'bookingMessage' && window.renderBookingMessageModal) modalContent = renderBookingMessageModal();
    else if (state.ui.modal === 'viewMaster' && window.renderMasterDetailsModal) modalContent = renderMasterDetailsModal();
    else if (state.ui.modal === 'syncLogs' && window.renderSyncLogsModal) modalContent = renderSyncLogsModal();
    else if (state.ui.modal === 'employeePermissions' && window.renderEmployeePermissionsModal) modalContent = renderEmployeePermissionsModal();
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
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(11,15,26,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(12px); animation: fadeIn 0.3s forwards;">
      <div class="card" style="padding: 40px 32px; display: flex; flex-direction: column; align-items: center; gap: 20px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.45); border-radius: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 340px; width: 90%; text-align: center; animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
        <div style="animation: pulse 1.5s infinite; display: flex; justify-content: center; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gem-grad-router)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 6px rgba(118, 75, 162, 0.2));">
                <defs>
                    <linearGradient id="gem-grad-router" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#667eea" />
                        <stop offset="100%" stop-color="#764ba2" />
                    </linearGradient>
                </defs>
                <path d="M6 3h12l4 6-10 12L2 9z"></path>
                <path d="M11 3 8 9l4 12 4-12-3-6"></path>
                <path d="M2 9h20"></path>
            </svg>
        </div>
        <div>
          <h2 style="font-weight: 800; font-size: 22px; color: #1a1a2e; margin-bottom: 4px; letter-spacing: -0.02em;">Suluu Business</h2>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 8px 0;">
          <span class="spinner" style="width: 36px; height: 36px; border: 3.5px solid #e2e8f0; border-top-color: #764ba2; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
          <div style="font-weight: 700; color: #764ba2; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">Синхронизация...</div>
        </div>
      </div>
    </div>
  ` : '';

  const syncingIcon = (state.ui.syncingCount > 0) ? `<i data-feather="refresh-cw" class="sync-icon-spin" style="width: 16px; height: 16px; margin-left: 8px; color: var(--primary);"></i>` : '';

  // Отрендерим переключатель салонов
  let businessSwitcherHtml = '';
  if (role === 'owner' && state.myBusinesses && state.myBusinesses.length > 0) {
    const options = state.myBusinesses.map(b => `
      <option value="${b.id}" ${b.id === state.ui.activeBusinessId ? 'selected' : ''}>${b.name}</option>
    `).join('');
    businessSwitcherHtml = `
      <div style="margin: 0 16px 12px; display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Салон</label>
        <select onchange="switchActiveBusiness(this.value)" style="width: 100%; padding: 8px 12px; border-radius: 10px; font-size: 13px; font-weight: 700; color: var(--text); border: 1px solid var(--border); background: var(--bg-secondary); outline: none; cursor: pointer;">
          ${options}
        </select>
      </div>
    `;
  } else if ((role === 'manager' || role === 'master') && state.myEmployments) {
    const approvedEmps = state.myEmployments.filter(e => e.status === 'approved');
    if (approvedEmps.length > 0) {
      const options = approvedEmps.map(e => `
        <option value="${e.business_id}" ${e.business_id === state.ui.activeBusinessId ? 'selected' : ''}>${e.business?.name || 'Салон'}</option>
      `).join('');
      businessSwitcherHtml = `
        <div style="margin: 0 16px 12px; display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Салон</label>
          <select onchange="switchActiveBusiness(this.value)" style="width: 100%; padding: 8px 12px; border-radius: 10px; font-size: 13px; font-weight: 700; color: var(--text); border: 1px solid var(--border); background: var(--bg-secondary); outline: none; cursor: pointer;">
            ${options}
          </select>
        </div>
      `;
    }
  }

  // Мобильный переключатель в шапке
  let topBarSwitcherHtml = '';
  if (role === 'owner' && state.myBusinesses && state.myBusinesses.length > 1) {
    const options = state.myBusinesses.map(b => `
      <option value="${b.id}" ${b.id === state.ui.activeBusinessId ? 'selected' : ''}>${b.name}</option>
    `).join('');
    topBarSwitcherHtml = `
      <select onchange="switchActiveBusiness(this.value)" style="background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid var(--border); font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 8px; outline: none; cursor: pointer; max-width: 120px; margin-left: 8px;">
        ${options}
      </select>
    `;
  } else if ((role === 'manager' || role === 'master') && state.myEmployments) {
    const approvedEmps = state.myEmployments.filter(e => e.status === 'approved');
    if (approvedEmps.length > 1) {
      const options = approvedEmps.map(e => `
        <option value="${e.business_id}" ${e.business_id === state.ui.activeBusinessId ? 'selected' : ''}>${e.business?.name || 'Салон'}</option>
      `).join('');
      topBarSwitcherHtml = `
        <select onchange="switchActiveBusiness(this.value)" style="background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid var(--border); font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 8px; outline: none; cursor: pointer; max-width: 120px; margin-left: 8px;">
          ${options}
        </select>
      `;
    }
  }

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
        
        <div style="margin-top: 16px;">
          ${businessSwitcherHtml}
        </div>

        <nav class="sidebar-menu" style="padding: 16px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1; overflow-x: hidden;">
          ${sidebarLinks}
        </nav>

        <div class="sidebar-footer" style="padding: 16px; border-top: 1px solid var(--border); overflow-x: hidden; display: flex; flex-direction: column; gap: 6px;">
          <div class="sidebar-business-name" style="font-size: 12px; font-weight: 600; padding: 0 12px 8px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 8px;">
            <i data-feather="user" style="width: 16px; height: 16px; min-width: 16px;"></i> 
            <span>${state.userProfile?.username} (${role === 'owner' ? 'Владелец' : role === 'manager' ? 'Менеджер' : role === 'super_admin' ? 'Админ' : 'Мастер'})</span>
          </div>
          <button onclick="window.forceAppUpdate()" title="Обновить приложение" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; color: var(--primary); border-color: var(--theme-200); background: rgba(99,102,241,0.05);">
            <i data-feather="refresh-cw" style="width: 16px; height: 16px; min-width: 16px;"></i>
            <span class="sidebar-action-text" style="flex-grow: 1; text-align: left;">Обновить приложение</span>
          </button>
          <button onclick="api.logout()" title="Выйти" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05);">
            <i data-feather="log-out" style="width: 16px; height: 16px; min-width: 16px;"></i>
            <span class="sidebar-action-text" style="flex-grow: 1; text-align: left;">Выйти</span>
          </button>
        </div>
      </aside>

      <header class="top-bar glass-island">
        <button onclick="setUI({ sidebarOpen: true })" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 4px; color: var(--text);">
          <i data-feather="menu"></i>
        </button>
        <div style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 6px;">
          <i data-feather="hexagon" style="width: 20px; height: 20px; color: var(--primary);"></i> 
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${businessName}</span> 
          ${topBarSwitcherHtml}
          ${syncingIcon}
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          ${page === 'bookings' ? `
            <button onclick="setUI({ showMobileSearch: !state.ui.showMobileSearch, showMobileFilters: false })" style="background: none; border: none; cursor: pointer; color: var(--text); padding: 4px;"><i data-feather="search" style="width: 20px; height: 20px;"></i></button>
            <button onclick="setUI({ showMobileFilters: !state.ui.showMobileFilters, showMobileSearch: false })" style="background: none; border: none; cursor: pointer; color: var(--text); padding: 4px;"><i data-feather="sliders" style="width: 20px; height: 20px;"></i></button>
          ` : ''}
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
          
          <div style="padding: 16px 16px 0;">
            ${businessSwitcherHtml}
          </div>

          <nav style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
            ${sidebarLinks}
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 12px 0;">
            <div style="font-size: 12px; font-weight: 600; padding: 0 12px 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <i data-feather="user" style="width: 18px; height: 18px;"></i> 
              <span>${state.userProfile?.username} (${role === 'owner' ? 'Владелец' : role === 'manager' ? 'Менеджер' : role === 'super_admin' ? 'Админ' : 'Мастер'})</span>
            </div>
            <button onclick="window.forceAppUpdate()" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 12px; font-weight: 700; color: var(--primary); border-color: var(--theme-200); background: rgba(99,102,241,0.05); cursor: pointer; margin-bottom: 8px;">
              <i data-feather="refresh-cw" style="width: 18px; height: 18px;"></i>
              <span style="flex-grow: 1; text-align: left;">Обновить приложение</span>
            </button>
            <button onclick="api.logout()" class="btn btn-secondary glass-interactive-card" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05); cursor: pointer;">
              <i data-feather="log-out" style="width: 18px; height: 18px;"></i>
              <span style="flex-grow: 1; text-align: left;">Выйти из аккаунта</span>
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
