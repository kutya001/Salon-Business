// ============================================
// masters.js — Управление сотрудниками салона (Мастера + Доступы)
// ============================================

window.renderMasters = function () {
  const userRole = state.userProfile?.role || 'master';
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const activeTab = state.ui.mastersActiveTab || 'masters';

  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

  // --- Вкладка "Мастера" ---
  const masterCardsHtml = state.masters.length === 0
    ? `
      <div class="card p-12 text-center" style="color: var(--text-secondary); grid-column: 1 / -1;">
        <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="users" style="width: 56px; height: 56px;"></i></span>
        <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Нет зарегистрированных мастеров</h3>
        <p style="font-size: 14px; margin-bottom: 16px;">Добавьте первого специалиста, чтобы принимать записи</p>
        <button onclick="showCreateMasterModal()" class="btn btn-primary" style="width: auto;">Добавить мастера</button>
      </div>
    `
    : state.masters.map(m => {
        const initials = getInitials(m.name);
        
        // Расчет статистики за текущий месяц
        const completedBookings = state.bookings.filter(b => 
          b.masterId === m.id && 
          b.status === 'completed' &&
          b.date.startsWith(currentMonthStr)
        );
        
        const count = completedBookings.length;
        const revenue = completedBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
        const commission = Math.round(revenue * (parseFloat(m.percentage || 40) / 100));

        return `
          <div class="card card-hover p-6" onclick="showMasterDetailsModal('${m.id}')" style="cursor: pointer; display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                ${initials}
              </div>
              <div style="flex-grow: 1;">
                <h3 style="font-weight: 800; font-size: 16px; color: var(--text);">${m.name}</h3>
                <p style="font-size: 12px; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">${m.specialization || 'Специалист'}</p>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 12px 0; display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Телефон:</span>
                <span style="font-weight: 600;">${formatClientPhone(m.phone)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Доля мастера:</span>
                <span style="font-weight: 700; color: var(--primary);">${m.percentage}%</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Рабочие часы:</span>
                <span style="font-weight: 600;">${formatMasterTime(m.workHoursStart)} - ${formatMasterTime(m.workHoursEnd)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Выручка (${new Date().toLocaleString('ru-RU', { month: 'long' })}):</span>
                <span style="font-weight: 700; color: #10b981;">${formatPrice(revenue)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Зарплата мастера:</span>
                <span style="font-weight: 700; color: var(--text);">${formatPrice(commission)}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="event.stopPropagation(); showEditMasterModal('${m.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto; display: flex; align-items: center; gap: 4px;">
                  <i data-feather="edit-2" style="width: 14px; height: 14px;"></i> Изменить
                </button>
                <button onclick="event.stopPropagation(); handleDeleteMaster('${m.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15); display: flex; align-items: center; gap: 4px;">
                  <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> Удалить
                </button>
            </div>
          </div>
        `;
      }).join('');

  // --- Вкладка "Сотрудники" (Заявки + Роли) ---
  const applications = state.jobApplications || [];
  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');

  const pendingHtml = pendingApps.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 24px; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
      <p style="font-size: 13px; margin: 0;">Новых заявок на вступление нет</p>
    </div>
  ` : pendingApps.map(app => {
    const roleText = app.role === 'manager' ? 'Менеджер' : 'Мастер';
    return `
      <div class="card" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.2); border-radius: 16px;">
        <div>
          <div style="font-weight: 800; font-size: 15px; color: var(--text);">${app.profiles?.username || 'Сотрудник'}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Запрошенная роль: <span style="font-weight: 700; color: var(--primary);">${roleText}</span></div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'approved')" class="btn btn-primary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; background: #34d399; color: white;">
            Одобрить
          </button>
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'rejected')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2);">
            Отклонить
          </button>
        </div>
      </div>
    `;
  }).join('');

  const approvedHtml = approvedApps.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 24px; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
      <p style="font-size: 13px; margin: 0;">В салоне пока нет одобренных сотрудников</p>
    </div>
  ` : approvedApps.map(app => {
    return `
      <div class="card glass-island" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);">
        <div>
          <div style="font-weight: 800; font-size: 15px; color: var(--text);">${app.profiles?.username || 'Сотрудник'}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span style="font-size: 12px; color: var(--text-secondary);">Доступ / Роль:</span>
            <select onchange="handleUpdateEmployeeRole('${app.id}', '${app.user_id}', this.value, '${app.profiles?.username}')" style="padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--text); border: 1px solid var(--border); background: var(--bg-secondary); cursor: pointer; outline: none;">
              <option value="master" ${app.role === 'master' ? 'selected' : ''}>Мастер (исполнитель)</option>
              <option value="manager" ${app.role === 'manager' ? 'selected' : ''}>Менеджер (администратор)</option>
            </select>
          </div>
        </div>
        <div>
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'rejected')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.02);">
            Исключить
          </button>
        </div>
      </div>
    `;
  }).join('');

  // --- Сборка контента страницы ---
  let contentHtml = '';
  if (activeTab === 'masters') {
    contentHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${masterCardsHtml}
      </div>
    `;
  } else {
    contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h2 style="font-weight: 700; font-size: 15px; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <i data-feather="clock" style="width: 16px; height: 16px;"></i> Заявки на рассмотрении
          </h2>
          ${pendingHtml}
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
          <h2 style="font-weight: 700; font-size: 15px; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <i data-feather="check-circle" style="width: 16px; height: 16px;"></i> Действующие сотрудники
          </h2>
          ${approvedHtml}
        </div>
      </div>
    `;
  }

  // --- Переключатели вкладок ---
  const tabsHtml = isOwnerOrManager ? `
    <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--border); padding-bottom: 0; margin-bottom: 8px;">
      <button onclick="setMastersTab('masters')" style="padding: 10px 16px; font-weight: 700; font-size: 14px; border: none; background: none; color: ${activeTab === 'masters' ? 'var(--primary)' : 'var(--text-secondary)'}; border-bottom: 2px solid ${activeTab === 'masters' ? 'var(--primary)' : 'transparent'}; margin-bottom: -2px; cursor: pointer; transition: all 0.2s;">
        Мастера
      </button>
      <button onclick="setMastersTab('employees')" style="padding: 10px 16px; font-weight: 700; font-size: 14px; border: none; background: none; color: ${activeTab === 'employees' ? 'var(--primary)' : 'var(--text-secondary)'}; border-bottom: 2px solid ${activeTab === 'employees' ? 'var(--primary)' : 'transparent'}; margin-bottom: -2px; cursor: pointer; transition: all 0.2s;">
        Управление доступом
      </button>
    </div>
  ` : '';

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 28px; padding-bottom: 80px;">
      
      <!-- Заголовок -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;">
            <i data-feather="users" style="width: 28px; height: 28px;"></i> Сотрудники салона
          </h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Управление доступом, ролями, сотрудниками и настройками мастеров</p>
        </div>
        ${activeTab === 'masters' ? `
          <button onclick="showCreateMasterModal()" class="hidden md-flex btn btn-primary animate-scale-in" style="align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;">
            <i data-feather="plus" style="width: 16px; height: 16px;"></i> Добавить мастера
          </button>
        ` : ''}
      </div>

      ${tabsHtml}

      ${contentHtml}
      
      <!-- Плавающая кнопка (FAB) только на вкладке мастеров -->
      ${activeTab === 'masters' ? `
        <button onclick="showCreateMasterModal()" class="md-hidden animate-scale-in" style="position: fixed; bottom: 106px; right: 20px; width: 56px; height: 56px; border-radius: 28px; background: var(--primary); color: white; border: none; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50; transition: transform 0.2s ease;">
          <i data-feather="plus" style="width: 24px; height: 24px;"></i>
        </button>
      ` : ''}
    </div>
  `;
};

window.setMastersTab = function (tab) {
  setUI({ mastersActiveTab: tab });
};

window.handleUpdateEmployeeRole = async function (memberId, userId, newRole, username) {
  setUI({ loading: true });
  try {
    await api.updateEmployeeRole(memberId, userId, newRole, username);
    showToast('Роль сотрудника успешно обновлена', 'success');
    const allData = await api.getAll();
    setState({
      jobApplications: allData.jobApplications || [],
      masters: allData.masters || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка изменения роли', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.handleJobApplication = async function (memberId, userId, role, username, status) {
  setUI({ loading: true });
  try {
    const activeId = state.ui.activeBusinessId;
    await api.respondToJobApplication(memberId, activeId, userId, role, username, status);
    showToast(status === 'approved' ? 'Заявка успешно одобрена!' : 'Сотрудник исключен/отклонен', 'success');
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      jobApplications: allData.jobApplications || [],
      masters: allData.masters || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка обработки заявки', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Открытие модалки создания мастера
window.showCreateMasterModal = function () {
  setUI({ modal: 'createMaster', modalData: { services: [] } });
};

window.showEditMasterModal = function (id) {
  const master = state.masters.find(m => m.id === id);
  if (!master) return;
  const mCopy = { ...master };
  try { mCopy.services = typeof mCopy.services === 'string' ? JSON.parse(mCopy.services) : (mCopy.services || []); } catch(e) { mCopy.services = []; }
  setUI({ modal: 'createMaster', modalData: mCopy });
};

window.toggleMasterService = function(id) {
  const current = state.ui.modalData.services || [];
  if (current.includes(id)) {
    state.ui.modalData.services = current.filter(x => x !== id);
  } else {
    state.ui.modalData.services = [...current, id];
  }
  setUI({ modalData: state.ui.modalData });
};

window.formatSvcDuration = function(durationStr) {
  if (!durationStr) return '';
  const parts = durationStr.split(':');
  if (parts.length < 2) return durationStr;
  const hrs = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  if (hrs > 0) {
    return `${hrs} ч${mins > 0 ? ` ${mins} мин` : ''}`;
  }
  return `${mins} мин`;
};

window.toggleMasterCategory = function(typeName) {
  const svcs = state.services || [];
  const categoryServices = svcs.filter(s => {
    let t = s.categoryName;
    if (!t && s.categoryId) t = state.categories.find(c => c.id === s.categoryId)?.name;
    return (t || 'Другое') === typeName;
  });
  const categorySvcIds = categoryServices.map(s => s.id);
  
  const current = state.ui.modalData.services || [];
  const allSelected = categorySvcIds.every(id => current.includes(id));
  
  if (allSelected) {
    // Деактивируем все услуги категории
    state.ui.modalData.services = current.filter(id => !categorySvcIds.includes(id));
  } else {
    // Активируем все услуги категории
    const newServices = [...current];
    categorySvcIds.forEach(id => {
      if (!newServices.includes(id)) {
        newServices.push(id);
      }
    });
    state.ui.modalData.services = newServices;
  }
  setUI({ modalData: state.ui.modalData });
};

window.showMasterDetailsModal = function(id) {
  const master = state.masters.find(m => m.id === id);
  if (!master) return;
  setUI({ modal: 'viewMaster', modalData: master });
};

window.renderMasterModal = function () {
  const m = state.ui.modalData || { services: [] }; // если передан мастер, значит режим редактирования
  const isEdit = !!m.id;
  const selectedServices = m.services || [];

  // Группировка услуг по категориям (видам)
  const svcs = state.services || [];
  const grouped = {};
  svcs.forEach(s => {
    let t = s.categoryName;
    if (!t && s.categoryId) t = state.categories.find(c => c.id === s.categoryId)?.name;
    t = t || 'Другое';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(s);
  });

  let svcsHtml = '';
  for (const typeName in grouped) {
    const categoryServices = grouped[typeName];
    const categorySvcIds = categoryServices.map(s => s.id);
    const selectedCount = categorySvcIds.filter(id => selectedServices.includes(id)).length;
    const allSelected = categorySvcIds.every(id => selectedServices.includes(id));
    const isSomeSelected = selectedCount > 0 && !allSelected;

    const catSafeId = typeName.replace(/[^a-zA-Z0-9]/g, '');

    svcsHtml += `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex-grow: 1;" onclick="toggleMasterCategory('${typeName}')">
          <input type="checkbox" id="chk-cat-${catSafeId}" ${allSelected ? 'checked' : ''} style="accent-color: var(--primary); width: 16px; height: 16px; pointer-events: none; ${isSomeSelected ? 'opacity: 0.7;' : ''}">
          <span style="font-size: 13px; font-weight: 700; color: var(--text);">${typeName}</span>
        </div>
        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">
          Выбрано: ${selectedCount} из ${categoryServices.length}
        </span>
      </div>
    `;

    svcsHtml += categoryServices.map(s => {
      const isSelected = selectedServices.includes(s.id);
      return `
        <div onclick="toggleMasterService('${s.id}')" style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; margin-bottom: 8px; cursor: pointer; background: ${isSelected ? 'rgba(99,102,241,0.05)' : 'var(--bg)'}; transition: all 0.2s ease;">
          <input type="checkbox" id="chk-svc-${s.id}" ${isSelected ? 'checked' : ''} style="accent-color: var(--primary); width: 16px; height: 16px; pointer-events: none;">
          <div style="font-weight: 600; font-size: 13px; color: var(--text); flex-grow: 1;">${s.name}</div>
          <span style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; font-weight: 500; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
            <span>${formatSvcDuration(s.duration)}</span>
            <span style="color: var(--primary); font-weight: 700;">${formatPrice(s.price)}</span>
          </span>
        </div>
      `;
    }).join('');
  }
  if (!svcsHtml) svcsHtml = `<div style="text-align:center; color: var(--text-secondary); padding: 10px;">Нет доступных услуг для выбора</div>`;

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактировать мастера' : 'Добавить нового специалиста'}</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);"><i data-feather="x"></i></button>
      </div>

      <form id="master-form" onsubmit="event.preventDefault(); handleMasterSubmit('${isEdit ? m.id : ''}');" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 70vh; padding-right: 4px;">
        <div class="form-group">
          <label class="form-label">ФИО мастера</label>
          <input type="text" id="m-name" class="form-input" placeholder="Алина Бакиева" value="${m.name || ''}" oninput="state.ui.modalData.name = this.value" required>
        </div>
        <div class="form-group">
          <label class="form-label">Номер телефона</label>
          <input type="tel" id="m-phone" class="form-input" placeholder="+996 555 111 222" value="${formatClientPhone(m.phone)}" oninput="handlePhoneInput(event); state.ui.modalData.phone = this.value" required>
        </div>
        <div class="form-group">
          <label class="form-label">Специализация (категория)</label>
          <select id="m-specialization" class="form-select" onchange="state.ui.modalData.specialization = this.value" required>
            <option value="">Выберите специализацию...</option>
            ${state.categories.map(c => `<option value="${c.name}" ${(m.specialization === c.name) ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Оказываемые услуги</label>
          <div class="scrollbar-hide" style="max-height: 250px; overflow-y: auto; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-secondary);">
            ${svcsHtml}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Процентная ставка от стоимости услуг (%)</label>
          <input type="number" id="m-percentage" class="form-input" placeholder="40" min="0" max="100" value="${m.percentage !== undefined ? m.percentage : '40'}" oninput="state.ui.modalData.percentage = this.value" required>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; width: 100%;">
          <div class="form-group">
            <label class="form-label">Начало работы</label>
            <input type="time" id="m-hours-start" class="form-input" value="${formatMasterTime(m.workHoursStart || '09:00')}" onchange="state.ui.modalData.workHoursStart = this.value" required>
          </div>
          <div class="form-group">
            <label class="form-label">Конец работы</label>
            <input type="time" id="m-hours-end" class="form-input" value="${formatMasterTime(m.workHoursEnd || '20:00')}" onchange="state.ui.modalData.workHoursEnd = this.value" required>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Добавить мастера'}
        </button>
      </form>
    </div>
  `;
};

// Отправка данных мастера на сервер
window.handleMasterSubmit = function (id) {
  const name = document.getElementById('m-name').value.trim();
  const phone = window.formatClientPhone(document.getElementById('m-phone').value.trim());
  const specialization = document.getElementById('m-specialization').value;
  const percentage = parseFloat(document.getElementById('m-percentage').value) || 40;
  const workHoursStart = document.getElementById('m-hours-start').value;
  const workHoursEnd = document.getElementById('m-hours-end').value;
  const services = JSON.stringify(state.ui.modalData.services || []);

  if (id) {
    const idx = state.masters.findIndex(m => m.id === id);
    if (idx !== -1) {
      state.masters[idx] = { ...state.masters[idx], name, phone, specialization, percentage, workHoursStart, workHoursEnd, services };
    }
    setUI({ modal: null, modalData: null });
    showToast('Сохранение мастера (синхронизация...)', 'info');
    
    api.updateMaster(id, { name, phone, specialization, percentage, workHoursStart, workHoursEnd, services }).then(result => {
      const currentIdx = state.masters.findIndex(m => m.id === id);
      if (currentIdx !== -1) state.masters[currentIdx] = result;
      showToast('Мастер успешно обновлен', 'success');
    }).catch(e => showToast('Ошибка при сохранении', 'error'));
  } else {
    const tempId = 'temp_' + Date.now();
    const tempMaster = { id: tempId, name, phone, specialization, percentage, workHoursStart, workHoursEnd, services, status: 'active' };
    state.masters.push(tempMaster);
    setUI({ modal: null, modalData: null });
    showToast('Добавление мастера (синхронизация...)', 'info');

    api.createMaster({ name, phone, specialization, percentage, workHoursStart, workHoursEnd, services }).then(result => {
      const idx = state.masters.findIndex(m => m.id === tempId);
      if (idx !== -1) state.masters[idx] = result;
      showToast('Мастер успешно добавлен!', 'success');
    }).catch(e => showToast('Ошибка при сохранении', 'error'));
  }
};

// Мягкое удаление мастера
window.handleDeleteMaster = function (id) {
  if (!confirm('Вы уверены, что хотите удалить этого мастера? Это действие нельзя отменить.')) return;
  
  const masters = state.masters.filter(m => m.id !== id);
  setState({ masters });
  showToast('Удаление мастера (синхронизация...)', 'info');
  
  api.deleteMaster(id).then(() => {
    showToast('Мастер удален', 'success');
  }).catch(e => showToast('Ошибка при удалении', 'error'));
};

window.renderMasterDetailsModal = function() {
  const m = state.ui.modalData;
  if (!m) return '';

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const completedBookings = state.bookings.filter(b => 
    b.masterId === m.id && 
    b.status === 'completed' &&
    b.date.startsWith(currentMonthStr)
  );
  
  const count = completedBookings.length;
  const revenue = completedBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  const commission = Math.round(revenue * (parseFloat(m.percentage || 40) / 100));

  return `
    <div class="scrollbar-hide" style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 16px; overflow: hidden;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); flex-shrink: 0;">
            ${getInitials(m.name)}
          </div>
          <div style="overflow: hidden;">
            <h3 style="font-weight: 800; font-size: 20px; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</h3>
            <p style="font-size: 13px; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.specialization || 'Специалист'}</p>
          </div>
        </div>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-feather="x"></i></button>
      </div>

      <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px; border: 1px solid var(--border); display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px;">
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Телефон</div>
          <a href="tel:${m.phone}" style="font-size: 14px; font-weight: 600; color: var(--primary); text-decoration: none; word-break: break-all;">${formatClientPhone(m.phone)}</a>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Рабочие часы</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text);">${formatMasterTime(m.workHoursStart)} - ${formatMasterTime(m.workHoursEnd)}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Доля мастера</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text);">${m.percentage}%</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Выполнено записей</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text);">${count} за месяц</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px;">Оказываемые услуги</h4>
        <div style="padding: 12px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 6px;">
          ${(() => {
            let mServicesArray = [];
            try { mServicesArray = typeof m.services === 'string' ? JSON.parse(m.services) : (m.services || []); } catch(e) {}
            const providedServices = (state.services || []).filter(s => mServicesArray.includes(s.id));
            return providedServices.length > 0 
              ? providedServices.map(s => `<span style="display: inline-block; padding: 4px 8px; background: rgba(99,102,241,0.1); color: var(--primary); font-size: 11px; font-weight: 700; border-radius: 6px;">${s.name}</span>`).join('')
              : '<span style="color: var(--text-secondary); font-size: 12px;">Услуги не назначены</span>';
          })()}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px;">Финансовая сводка (${new Date().toLocaleString('ru-RU', { month: 'long' })})</h4>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
          <span style="color: var(--text-secondary); font-size: 13px;">Общая выручка:</span>
          <span style="font-weight: 800; color: #10b981; font-size: 15px;">${formatPrice(revenue)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px;">
          <span style="color: var(--text-secondary); font-size: 13px; font-weight: 600;">К выплате мастеру:</span>
          <span style="font-weight: 800; color: var(--text); font-size: 18px;">${formatPrice(commission)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 8px;">
        <button onclick="showEditMasterModal('${m.id}')" class="btn btn-primary" style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px;">
          <i data-feather="edit-2" style="width: 16px; height: 16px;"></i> Редактировать профиль
        </button>
      </div>
    </div>`;
};
