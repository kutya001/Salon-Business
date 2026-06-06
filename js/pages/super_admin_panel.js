// ============================================
// super_admin_panel.js — Глобальная панель суперадминистратора
// ============================================

if (state.ui.superAdminTab === undefined) state.ui.superAdminTab = 'stats';

// Переменные редактирования пользователя
if (state.ui.editingUserId === undefined) state.ui.editingUserId = null;
if (state.ui.adminEditUsername === undefined) state.ui.adminEditUsername = '';
if (state.ui.adminEditRole === undefined) state.ui.adminEditRole = '';
if (state.ui.adminEditPassword === undefined) state.ui.adminEditPassword = '';

// Переменные управления категориями
if (state.ui.editingGlobalCategoryId === undefined) state.ui.editingGlobalCategoryId = null;
if (state.ui.globalCategoryName === undefined) state.ui.globalCategoryName = '';

// Переменные управления услугами
if (state.ui.editingGlobalServiceId === undefined) state.ui.editingGlobalServiceId = null;
if (state.ui.globalServiceCategoryId === undefined) state.ui.globalServiceCategoryId = '';
if (state.ui.globalServiceName === undefined) state.ui.globalServiceName = '';
if (state.ui.globalServicePrice === undefined) state.ui.globalServicePrice = 0;
if (state.ui.globalServiceDuration === undefined) state.ui.globalServiceDuration = 60;
if (state.ui.globalServiceGender === undefined) state.ui.globalServiceGender = '';
if (state.ui.globalServiceDescription === undefined) state.ui.globalServiceDescription = '';

// Фильтры суперадмина
if (state.ui.adminTxFilterSalon === undefined) state.ui.adminTxFilterSalon = '';
if (state.ui.adminTxFilterType === undefined) state.ui.adminTxFilterType = '';
if (state.ui.adminUserSearch === undefined) state.ui.adminUserSearch = '';

window.renderSuperAdminPanel = function () {
  const activeTab = state.ui.superAdminTab || 'stats';
  const businesses = state.allBusinesses || [];
  const users = state.allUsers || [];
  const transactions = state.allTransactions || [];
  const members = state.allMembers || [];
  const globalCategories = state.globalCategories || [];
  const globalServices = state.globalServices || [];

  const tabs = [
    { id: 'stats', label: 'Статистика', icon: 'activity' },
    { id: 'users', label: 'Пользователи', icon: 'users' },
    { id: 'salons', label: 'Салоны', icon: 'briefcase' },
    { id: 'transactions', label: 'Все транзакции', icon: 'dollar-sign' },
    { id: 'global_catalog', label: 'Глобальные шаблоны', icon: 'book-open' }
  ];

  const tabsHtml = `
    <div style="margin-bottom: 24px; overflow-x: auto; scrollbar-width: none;">
      <div class="segment-tabs-container" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="setUI({ superAdminTab: '${tab.id}' })" class="segment-tab ${isActive ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;" title="${tab.label}">
              <i data-feather="${tab.icon}" style="width: 16px; height: 16px;"></i>
              <span>${tab.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'stats') {
    // Вкладка статистики
    const totalVolume = transactions.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const incomeVolume = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const expenseVolume = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    const statsCards = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="card p-5" style="border-left: 4px solid var(--primary); background: rgba(255,255,255,0.02);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Всего салонов</div>
          <div style="font-size: 28px; font-weight: 800; color: var(--text); margin-top: 6px;">${businesses.length}</div>
        </div>
        <div class="card p-5" style="border-left: 4px solid #10b981; background: rgba(255,255,255,0.02);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Пользователи (роли)</div>
          <div style="font-size: 28px; font-weight: 800; color: var(--text); margin-top: 6px;">${users.length}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
            Владельцы: ${users.filter(u => u.role === 'owner').length} | Мастера: ${users.filter(u => u.role === 'master').length}
          </div>
        </div>
        <div class="card p-5" style="border-left: 4px solid #3b82f6; background: rgba(255,255,255,0.02);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Транзакции системы</div>
          <div style="font-size: 28px; font-weight: 800; color: var(--text); margin-top: 6px;">${transactions.length}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Всего операций проведено</div>
        </div>
        <div class="card p-5" style="border-left: 4px solid #f59e0b; background: rgba(255,255,255,0.02);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Оборот средств</div>
          <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-top: 6px;">+${incomeVolume.toLocaleString()} сом</div>
          <div style="font-size: 11px; color: #ef4444; margin-top: 4px;">Расход: -${expenseVolume.toLocaleString()} сом</div>
        </div>
      </div>
    `;

    // Статистика сотрудников по салонам
    const salonStatsRows = businesses.map(biz => {
      const salonMembers = members.filter(m => m.business_id === biz.id);
      const approvedMembers = salonMembers.filter(m => m.status === 'approved');
      const pendingMembers = salonMembers.filter(m => m.status === 'pending');
      const ownerName = biz.profiles?.username || 'Не назначен';

      return `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 12px 16px; font-weight: 700; color: var(--text);">${biz.name}</td>
          <td style="padding: 12px 16px; color: var(--primary); font-weight: 600;">${ownerName}</td>
          <td style="padding: 12px 16px; text-align: center;"><span class="badge badge-success" style="background: rgba(16,185,129,0.1); color: #10b981; padding: 4px 8px; border-radius: 8px; font-weight: 700;">${approvedMembers.length}</span></td>
          <td style="padding: 12px 16px; text-align: center;">
            ${pendingMembers.length > 0 ? `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 4px 8px; border-radius: 8px; font-weight: 700; font-size: 12px;">${pendingMembers.length} ожидает</span>` : `<span style="color: var(--text-secondary); font-size: 12px;">0</span>`}
          </td>
        </tr>
      `;
    }).join('');

    contentHtml = `
      ${statsCards}
      <div class="card p-6">
        <h3 style="font-weight: 800; font-size: 17px; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i data-feather="grid" style="color: var(--primary);"></i> Статистика по салонам
        </h3>
        
        <div class="data-table-container">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid var(--border); color: var(--text-secondary);">
                <th style="padding: 10px 16px;">Название салона</th>
                <th style="padding: 10px 16px;">Владелец</th>
                <th style="padding: 10px 16px; text-align: center;">Сотрудников</th>
                <th style="padding: 10px 16px; text-align: center;">Заявки на работу</th>
              </tr>
            </thead>
            <tbody>
              ${salonStatsRows.length > 0 ? salonStatsRows : `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">Нет салонов для анализа</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (activeTab === 'users') {
    // Вкладка пользователей
    const searchQuery = (state.ui.adminUserSearch || '').toLowerCase();
    const filteredUsers = users.filter(user => {
      return (user.username || '').toLowerCase().includes(searchQuery) || (user.id || '').toLowerCase().includes(searchQuery);
    });

    const editingId = state.ui.editingUserId;

    const usersListHtml = filteredUsers.length === 0 ? `
      <div style="color: var(--text-secondary); text-align: center; padding: 20px; background: rgba(255,255,255,0.01); border-radius: 12px; border: 1px dashed var(--border);">
        Пользователи не найдены
      </div>
    ` : filteredUsers.map(user => {
      const isEditing = editingId === user.id;

      if (isEditing) {
        return `
          <div class="card p-5 animate-scale-in" style="border: 2px solid var(--primary); background: rgba(118,75,162,0.02); display: flex; flex-direction: column; gap: 14px;">
            <div style="font-weight: 800; font-size: 13px; color: var(--primary); text-transform: uppercase;">Редактирование профиля пользователя</div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Имя пользователя (Логин)</label>
                <input type="text" id="edit-username" value="${state.ui.adminEditUsername}" onchange="setUI({adminEditUsername: this.value})" class="form-input">
              </div>
              
              <div>
                <label class="form-label">Роль в системе</label>
                <select id="edit-role" onchange="setUI({adminEditRole: this.value})" class="form-input" style="cursor: pointer;">
                  <option value="owner" ${state.ui.adminEditRole === 'owner' ? 'selected' : ''}>owner (Владелец)</option>
                  <option value="manager" ${state.ui.adminEditRole === 'manager' ? 'selected' : ''}>manager (Менеджер)</option>
                  <option value="master" ${state.ui.adminEditRole === 'master' ? 'selected' : ''}>master (Мастер)</option>
                  <option value="super_admin" ${state.ui.adminEditRole === 'super_admin' ? 'selected' : ''}>super_admin (Суперадмин)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">Новый пароль (оставьте пустым для сохранения старого)</label>
              <input type="password" id="edit-password" value="${state.ui.adminEditPassword}" onchange="setUI({adminEditPassword: this.value})" placeholder="Минимум 6 символов" class="form-input">
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button onclick="saveAdminUserEdit('${user.id}')" class="btn btn-primary" style="background: #10b981; color: white; width: auto;">
                Сохранить
              </button>
              <button onclick="setUI({editingUserId: null})" class="btn btn-secondary" style="width: auto;">
                Отмена
              </button>
            </div>
          </div>
        `;
      }

      const roleColors = {
        super_admin: '#ef4444',
        owner: '#764ba2',
        manager: '#3b82f6',
        master: '#10b981'
      };
      const badgeBg = roleColors[user.role] || '#6b7280';

      return `
        <div class="card glass-island p-4" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 1px solid var(--border);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--text);">${user.username}</span>
              <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; color: white; background: ${badgeBg}; text-transform: uppercase;">
                ${user.role}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; font-family: monospace;">UUID: ${user.id}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button onclick="startAdminUserEdit('${user.id}', '${user.username}', '${user.role}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: auto; color: var(--primary); border-color: rgba(118,75,162,0.15);">
              Изменить
            </button>
            ${user.role !== 'super_admin' ? `
              <button onclick="deleteAdminUser('${user.id}', '${user.username}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15);">
                Удалить
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <input type="text" placeholder="Поиск пользователя по логину или UUID..." value="${state.ui.adminUserSearch}" oninput="setUI({ adminUserSearch: this.value })" class="form-input" style="flex-grow: 1;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${usersListHtml}
        </div>
      </div>
    `;

  } else if (activeTab === 'salons') {
    // Вкладка салонов
    const salonsListHtml = businesses.length === 0 ? `
      <div style="color: var(--text-secondary); text-align: center; padding: 20px; background: rgba(255,255,255,0.01); border-radius: 12px; border: 1px dashed var(--border);">
        Нет зарегистрированных салонов в системе
      </div>
    ` : businesses.map(biz => {
      const salonMembers = members.filter(m => m.business_id === biz.id);
      const ownerName = biz.profiles?.username || 'Неизвестен';

      return `
        <div class="card p-5" style="border: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; background: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div>
              <div style="font-weight: 800; font-size: 16px; color: var(--text);">${biz.name}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; font-family: monospace;">ID: ${biz.id}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: var(--text-secondary);">Владелец: </span>
              <span style="font-weight: 800; font-size: 13px; color: var(--primary);">${ownerName}</span>
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 700; font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Сотрудники салона (${salonMembers.length}):</div>
            ${salonMembers.length === 0 ? `<div style="font-size: 12px; color: var(--text-secondary);">Нет привязанных сотрудников</div>` : `
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${salonMembers.map(m => {
                  const roleColor = m.role === 'manager' ? '#3b82f6' : '#10b981';
                  const statusOpacity = m.status === 'approved' ? '1' : '0.5';
                  return `
                    <span style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); opacity: ${statusOpacity}; display: inline-flex; align-items: center; gap: 4px;">
                      <span>${m.profiles?.username || 'Сотрудник'}</span>
                      <span style="font-size: 9px; font-weight: 800; color: ${roleColor}; text-transform: uppercase;">(${m.role})</span>
                      ${m.status === 'pending' ? `<span style="font-size: 8px; background: #f59e0b; color: white; border-radius: 4px; padding: 1px 3px;">⏳</span>` : ''}
                    </span>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px;">
            <button onclick="deleteSalon('${biz.id}', '${biz.name}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15);">
              Удалить салон
            </button>
          </div>
        </div>
      `;
    }).join('');

    contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${salonsListHtml}
      </div>
    `;

  } else if (activeTab === 'transactions') {
    // Вкладка всех транзакций
    const filteredTxs = transactions.filter(t => {
      const matchSalon = !state.ui.adminTxFilterSalon || t.business_id === state.ui.adminTxFilterSalon;
      const matchType = !state.ui.adminTxFilterType || t.type === state.ui.adminTxFilterType;
      return matchSalon && matchType;
    });

    const salonOptions = businesses.map(biz => `
      <option value="${biz.id}" ${state.ui.adminTxFilterSalon === biz.id ? 'selected' : ''}>${biz.name}</option>
    `).join('');

    const txRows = filteredTxs.map(t => {
      const salonName = t.business?.name || 'Неизвестен';
      const isIncome = t.type === 'income';
      const amountColor = isIncome ? '#10b981' : '#ef4444';
      const amountPrefix = isIncome ? '+' : '-';
      const dateStr = t.transaction_date_time ? new Date(t.transaction_date_time).toLocaleString('ru-RU') : '---';

      return `
        <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
          <td style="padding: 10px 14px; font-weight: 700; color: var(--text);">${salonName}</td>
          <td style="padding: 10px 14px;">
            <span style="font-weight: 800; color: ${amountColor};">
              ${amountPrefix}${parseFloat(t.amount || 0).toLocaleString()} сом
            </span>
          </td>
          <td style="padding: 10px 14px; text-transform: capitalize; color: var(--text-secondary);">${t.description || 'Без описания'}</td>
          <td style="padding: 10px 14px; color: var(--text-secondary);">${dateStr}</td>
        </tr>
      `;
    }).join('');

    contentHtml = `
      <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 180px;">
            <label class="form-label" style="font-size: 11px;">Фильтр по салону</label>
            <select onchange="setUI({ adminTxFilterSalon: this.value })" class="form-input" style="cursor: pointer;">
              <option value="">Все салоны</option>
              ${salonOptions}
            </select>
          </div>
          
          <div style="flex: 1; min-width: 140px;">
            <label class="form-label" style="font-size: 11px;">Тип операции</label>
            <select onchange="setUI({ adminTxFilterType: this.value })" class="form-input" style="cursor: pointer;">
              <option value="">Все операции</option>
              <option value="income" ${state.ui.adminTxFilterType === 'income' ? 'selected' : ''}>Доходы</option>
              <option value="expense" ${state.ui.adminTxFilterType === 'expense' ? 'selected' : ''}>Расходы</option>
            </select>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid var(--border); color: var(--text-secondary);">
                <th style="padding: 10px 14px;">Салон</th>
                <th style="padding: 10px 14px;">Сумма</th>
                <th style="padding: 10px 14px;">Назначение</th>
                <th style="padding: 10px 14px;">Дата и время</th>
              </tr>
            </thead>
            <tbody>
              ${txRows.length > 0 ? txRows : `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">Транзакции не найдены</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (activeTab === 'global_catalog') {
    // Вкладка глобальных шаблонов услуг
    const isEditingCat = state.ui.editingGlobalCategoryId;
    const isEditingService = state.ui.editingGlobalServiceId;

    const catsHtml = globalCategories.map(cat => {
      const isCatSelected = state.ui.globalServiceCategoryId === cat.id;
      return `
        <div class="card p-3 glass-interactive-card" style="display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 13px; color: var(--text); cursor: pointer;" onclick="setUI({ globalServiceCategoryId: '${cat.id}' })">
            ${cat.name} ${isCatSelected ? '⭐️' : ''}
          </span>
          <div style="display: flex; gap: 4px;">
            <button onclick="startEditGlobalCategory('${cat.id}', '${cat.name}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px; width: auto; color: var(--primary);">✏️</button>
            <button onclick="deleteGlobalCategory('${cat.id}')" class="btn btn-secondary" style="padding: 4px 8px; font-size: 10px; width: auto; color: #ef4444;">❌</button>
          </div>
        </div>
      `;
    }).join('');

    const filteredServices = globalServices.filter(s => {
      return !state.ui.globalServiceCategoryId || s.category_id === state.ui.globalServiceCategoryId;
    });

    const servicesHtml = filteredServices.map(s => {
      const categoryName = globalCategories.find(c => c.id === s.category_id)?.name || 'Шаблон';
      return `
        <div class="card p-4" style="border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.01);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div>
              <div style="font-weight: 800; font-size: 14px; color: var(--text);">${s.name}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Категория: ${categoryName}</div>
            </div>
            <div style="font-weight: 800; font-size: 14px; color: #10b981;">
              ${s.price} сом / ${s.duration} мин
            </div>
          </div>
          ${s.description ? `<p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0;">${s.description}</p>` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 6px; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 4px;">
            <button onclick="startEditGlobalService('${s.id}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px; width: auto; color: var(--primary);">
              Изменить
            </button>
            <button onclick="deleteGlobalService('${s.id}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px; width: auto; color: #ef4444;">
              Удалить
            </button>
          </div>
        </div>
      `;
    }).join('');

    contentHtml = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Колонка 1: Категории -->
        <div class="card p-5" style="border: 1px solid var(--border); height: fit-content;">
          <h3 style="font-weight: 800; font-size: 15px; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i data-feather="folder" style="color: var(--primary);"></i> Категории шаблонов
          </h3>
          
          <div class="mb-4">
            <label class="form-label">${isEditingCat ? 'Редактировать категорию' : 'Добавить категорию'}</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="global-cat-name" placeholder="Название..." value="${state.ui.globalCategoryName}" onchange="setUI({ globalCategoryName: this.value })" class="form-input">
              <button onclick="saveGlobalCategory()" class="btn btn-primary" style="width: auto; padding: 10px 16px;">
                ${isEditingCat ? 'Ок' : '+'}
              </button>
            </div>
            ${isEditingCat ? `<button onclick="setUI({ editingGlobalCategoryId: null, globalCategoryName: '' })" style="font-size: 11px; color: #ef4444; background: none; border: none; cursor: pointer; margin-top: 4px; padding: 0;">Отмена</button>` : ''}
          </div>
          
          <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Все категории (клик для фильтра):</div>
            <div class="card p-3 glass-interactive-card" style="display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); margin-bottom: 8px; cursor: pointer;" onclick="setUI({ globalServiceCategoryId: '' })">
              <span style="font-weight: 700; font-size: 13px; color: var(--text);">
                Все шаблоны ${!state.ui.globalServiceCategoryId ? '⭐️' : ''}
              </span>
            </div>
            ${catsHtml}
          </div>
        </div>

        <!-- Колонка 2: Услуги шаблона -->
        <div class="lg:col-span-2 card p-5" style="border: 1px solid var(--border);">
          <h3 style="font-weight: 800; font-size: 15px; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i data-feather="scissors" style="color: var(--primary);"></i> Услуги в шаблоне
          </h3>

          <!-- Форма создания/редактирования услуги -->
          <div class="card p-4 mb-4" style="background: rgba(118,75,162,0.02); border: 1px dashed var(--primary); display: flex; flex-direction: column; gap: 10px;">
            <div style="font-weight: 800; font-size: 12px; color: var(--primary); text-transform: uppercase;">
              ${isEditingService ? 'Редактировать шаблон услуги' : 'Создать шаблон услуги'}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label" style="font-size: 11px;">Название услуги</label>
                <input type="text" id="gs-name" value="${state.ui.globalServiceName}" onchange="setUI({ globalServiceName: this.value })" class="form-input" placeholder="Мужская стрижка...">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px;">Категория шаблона</label>
                <select id="gs-cat" class="form-input" style="cursor: pointer;">
                  ${globalCategories.map(c => `<option value="${c.id}" ${state.ui.globalServiceCategoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size: 11px;">Цена шаблона (сом)</label>
                <input type="number" id="gs-price" value="${state.ui.globalServicePrice}" onchange="setUI({ globalServicePrice: parseFloat(this.value) })" class="form-input">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px;">Длительность шаблона (минут)</label>
                <input type="number" id="gs-duration" value="${state.ui.globalServiceDuration}" onchange="setUI({ globalServiceDuration: parseInt(this.value) })" class="form-input">
              </div>
            </div>
            <div>
              <label class="form-label" style="font-size: 11px;">Описание услуги</label>
              <textarea id="gs-desc" rows="2" class="form-textarea" placeholder="Описание...">${state.ui.globalServiceDescription}</textarea>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
              <button onclick="saveGlobalService()" class="btn btn-primary" style="width: auto; padding: 8px 16px;">
                ${isEditingService ? 'Сохранить шаблон' : 'Добавить шаблон'}
              </button>
              ${isEditingService ? `
                <button onclick="cancelEditGlobalService()" class="btn btn-secondary" style="width: auto; padding: 8px 16px;">
                  Отмена
                </button>
              ` : ''}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${servicesHtml.length > 0 ? servicesHtml : `<div style="text-align: center; color: var(--text-secondary); padding: 24px;">Нет услуг в данной категории</div>`}
          </div>
        </div>

      </div>
    `;
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px; padding: 24px 0;">
      <div>
        <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;">
          <i data-feather="shield" style="color: var(--primary);"></i> Панель Суперадминистратора
        </h1>
        <p style="color: var(--text-secondary); font-size: 14px;">Управление учетными записями, статистикой, транзакциями и шаблонами каталога</p>
      </div>

      <!-- Вкладки -->
      ${tabsHtml}

      <!-- Контент вкладки -->
      ${contentHtml}
    </div>
  `;
};

// USER CRUD OPERATIONS
window.startAdminUserEdit = function (userId, username, role) {
  setUI({
    editingUserId: userId,
    adminEditUsername: username,
    adminEditRole: role,
    adminEditPassword: ''
  });
};

window.saveAdminUserEdit = async function (userId) {
  const username = state.ui.adminEditUsername.trim();
  const role = state.ui.adminEditRole;
  const password = state.ui.adminEditPassword.trim();

  if (!username) {
    showToast('Логин не может быть пустым', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    await api.adminUpdateUser(userId, username, role, password);
    showToast('Пользователь успешно сохранен!', 'success');
    setUI({ editingUserId: null });
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      allUsers: allData.allUsers || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка обновления пользователя', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.deleteAdminUser = async function (userId, username) {
  if (!confirm(`Вы действительно хотите безвозвратно удалить пользователя "${username}"?`)) return;

  setUI({ loading: true });
  try {
    await api.adminDeleteUser(userId);
    showToast('Пользователь удален', 'success');
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      allUsers: allData.allUsers || [],
      allBusinesses: allData.allBusinesses || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка удаления пользователя', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// SALON CRUD OPERATIONS
window.deleteSalon = async function (salonId, salonName) {
  if (!confirm(`Вы действительно хотите удалить салон "${salonName}"? Это приведет к удалению всех связанных справочников, транзакций и записей!`)) return;

  setUI({ loading: true });
  try {
    const { error } = await supabaseClient.from('business').delete().eq('id', salonId);
    if (error) throw error;
    showToast('Салон успешно удален', 'success');
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      allBusinesses: allData.allBusinesses || [],
      allTransactions: allData.allTransactions || [],
      allMembers: allData.allMembers || []
    });
  } catch (err) {
    showToast('Не удалось удалить салон', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// GLOBAL CATEGORY CRUD OPERATIONS
window.startEditGlobalCategory = function (id, name) {
  setUI({
    editingGlobalCategoryId: id,
    globalCategoryName: name
  });
};

window.saveGlobalCategory = async function () {
  const name = state.ui.globalCategoryName.trim();
  if (!name) {
    showToast('Имя категории не может быть пустым', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    if (state.ui.editingGlobalCategoryId) {
      await api.updateGlobalCategory(state.ui.editingGlobalCategoryId, name);
      showToast('Категория шаблона обновлена', 'success');
    } else {
      await api.createGlobalCategory(name);
      showToast('Глобальная категория добавлена', 'success');
    }
    setUI({ editingGlobalCategoryId: null, globalCategoryName: '' });
    const allData = await api.getAll();
    setState({
      globalCategories: allData.globalCategories || []
    });
  } catch (err) {
    showToast('Ошибка при сохранении категории', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.deleteGlobalCategory = async function (id) {
  if (!confirm('Вы действительно хотите удалить эту глобальную категорию и все связанные с ней шаблоны услуг?')) return;

  setUI({ loading: true });
  try {
    await api.deleteGlobalCategory(id);
    showToast('Категория шаблона удалена', 'success');
    const allData = await api.getAll();
    setState({
      globalCategories: allData.globalCategories || [],
      globalServices: allData.globalServices || []
    });
  } catch (err) {
    showToast('Ошибка при удалении категории', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// GLOBAL SERVICE CRUD OPERATIONS
window.startEditGlobalService = function (id) {
  const service = state.globalServices.find(s => s.id === id);
  if (!service) return;

  setUI({
    editingGlobalServiceId: id,
    globalServiceName: service.name,
    globalServicePrice: service.price,
    globalServiceDuration: service.duration,
    globalServiceGender: service.gender_category || '',
    globalServiceDescription: service.description || '',
    globalServiceCategoryId: service.category_id
  });
};

window.cancelEditGlobalService = function () {
  setUI({
    editingGlobalServiceId: null,
    globalServiceName: '',
    globalServicePrice: 0,
    globalServiceDuration: 60,
    globalServiceGender: '',
    globalServiceDescription: ''
  });
};

window.saveGlobalService = async function () {
  const name = state.ui.globalServiceName.trim();
  const catSelect = document.getElementById('gs-cat');
  const catId = catSelect ? catSelect.value : state.ui.globalServiceCategoryId;
  const price = state.ui.globalServicePrice;
  const duration = state.ui.globalServiceDuration;
  const desc = document.getElementById('gs-desc') ? document.getElementById('gs-desc').value.trim() : state.ui.globalServiceDescription;

  if (!name) {
    showToast('Название услуги не может быть пустым', 'error');
    return;
  }
  if (!catId) {
    showToast('Выберите категорию', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    if (state.ui.editingGlobalServiceId) {
      await api.updateGlobalService(state.ui.editingGlobalServiceId, catId, name, price, duration, '', desc);
      showToast('Шаблон услуги успешно сохранен', 'success');
    } else {
      await api.createGlobalService(catId, name, price, duration, '', desc);
      showToast('Шаблон услуги добавлен', 'success');
    }
    cancelEditGlobalService();
    const allData = await api.getAll();
    setState({
      globalServices: allData.globalServices || []
    });
  } catch (err) {
    showToast('Не удалось сохранить шаблон услуги', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.deleteGlobalService = async function (id) {
  if (!confirm('Вы действительно хотите удалить этот шаблон услуги?')) return;

  setUI({ loading: true });
  try {
    await api.deleteGlobalService(id);
    showToast('Шаблон услуги удален', 'success');
    const allData = await api.getAll();
    setState({
      globalServices: allData.globalServices || []
    });
  } catch (err) {
    showToast('Ошибка при удалении шаблона услуги', 'error');
  } finally {
    setUI({ loading: false });
  }
};
