// ============================================
// settings.js — Настройки профиля пользователя и салона
// ============================================

if (state.ui.settingsTab === undefined) state.ui.settingsTab = 'user_profile';

window.renderSettings = function () {
  const role = state.userProfile?.role || 'master';
  const biz = state.business || {};
  const schedule = biz.workSchedule || {};
  const daysTranslation = {
    mon: 'Понедельник',
    tue: 'Вторник',
    wed: 'Среда',
    thu: 'Четверг',
    fri: 'Пятница',
    sat: 'Суббота',
    sun: 'Воскресенье'
  };

  const scheduleRows = Object.keys(daysTranslation).map(dayKey => {
    const dayData = schedule[dayKey] || { enabled: false, start: '09:00', end: '20:00' };
    return `
      <tr>
        <td style="font-weight: 600; padding: 10px 16px;">${daysTranslation[dayKey]}</td>
        <td style="padding: 10px 16px;">
          <input type="checkbox" id="sched-${dayKey}-enabled" ${dayData.enabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
        </td>
        <td style="padding: 10px 16px;">
          <input type="time" id="sched-${dayKey}-start" class="form-input" value="${dayData.start || '09:00'}" style="padding: 6px 12px; width: 110px;">
        </td>
        <td style="padding: 10px 16px;">
          <input type="time" id="sched-${dayKey}-end" class="form-input" value="${dayData.end || '20:00'}" style="padding: 6px 12px; width: 110px;">
        </td>
      </tr>
    `;
  }).join('');

  const activeTab = state.ui.settingsTab || 'user_profile';
  
  // Доступные вкладки в зависимости от роли
  const tabs = [
    { id: 'user_profile', label: 'Мой профиль', icon: 'user' }
  ];

  // Профиль бизнеса и график доступны только Владельцам и Менеджерам
  if (role === 'owner' || role === 'manager') {
    tabs.push({ id: 'business_profile', label: 'Профиль салона', icon: 'briefcase' });
    tabs.push({ id: 'schedule', label: 'График салона', icon: 'calendar' });
  }

  const tabsHtml = `
    <div style="margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
      <div class="segment-tabs-container" style="display: flex; gap: 8px;">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="setUI({ settingsTab: '${tab.id}' })" class="segment-tab ${isActive ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="${tab.label}">
              <i data-feather="${tab.icon}" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
              <span>${tab.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'user_profile') {
    contentHtml = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Редактирование личного профиля -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;">
            <i data-feather="user" style="width: 18px; height: 18px;"></i> Личные настройки
          </h3>
          
          <form onsubmit="event.preventDefault(); handleSaveUserProfile();" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Имя пользователя (Логин)</label>
              <input type="text" id="user-username" class="form-input" value="${state.userProfile?.username || ''}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Почта (Email)</label>
              <input type="email" id="user-email" class="form-input" value="${state.userProfile?.email || ''}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Новый пароль (оставьте пустым для сохранения текущего)</label>
              <input type="password" id="user-password" class="form-input" placeholder="Минимум 6 символов">
            </div>
            
            <button type="submit" class="btn btn-primary" style="margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; width: fit-content;">
              <i data-feather="save" style="width: 16px; height: 16px;"></i> Сохранить профиль
            </button>
          </form>
        </div>

        <!-- Системная информация -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px; border-left: 5px solid var(--primary);">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;">
            <i data-feather="settings" style="width: 18px; height: 18px;"></i> Системная информация
          </h3>
          
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Версия системы:</span><span style="font-weight: 700;">2.3.0-PRO (PWA)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">База данных:</span><span style="font-weight: 700; color: #10b981;">PostgreSQL (Supabase)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Синхронизация:</span><span style="font-weight: 700; color: #10b981;">Активна (Real-time)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Тип аккаунта:</span><span style="font-weight: 700; text-transform: uppercase;">${role}</span></div>
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'business_profile') {
    contentHtml = `
      <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;">
          <i data-feather="briefcase" style="width: 18px; height: 18px;"></i> Профиль салона
        </h3>
        
        <form onsubmit="event.preventDefault(); handleSaveProfile();" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Название бизнеса</label>
            <input type="text" id="set-name" class="form-input" value="${biz.businessName || biz.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Краткое описание</label>
            <textarea id="set-desc" rows="2" class="form-textarea" placeholder="Салон красоты премиум-класса в центре города...">${biz.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Физический адрес</label>
            <input type="text" id="set-address" class="form-input" value="${biz.address || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Контактный телефон</label>
            <input type="tel" id="set-phone" class="form-input" value="${formatClientPhone(biz.phone)}" oninput="handlePhoneInput(event)">
          </div>
          <div class="form-group">
            <label class="form-label">Email для связи</label>
            <input type="email" id="set-email" class="form-input" value="${biz.email || ''}">
          </div>
          
          <button type="submit" class="btn btn-primary" style="margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; width: fit-content;">
            <i data-feather="save" style="width: 16px; height: 16px;"></i> Сохранить изменения
          </button>
        </form>
      </div>
    `;
  } else if (activeTab === 'schedule') {
    contentHtml = `
      <div class="card p-6">
        <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <i data-feather="calendar" style="width: 18px; height: 18px;"></i> График работы салона
        </h3>
        
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>День недели</th>
                <th>Рабочий</th>
                <th>Время начала</th>
                <th>Время окончания</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows}
            </tbody>
          </table>
        </div>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <button onclick="handleSaveSchedule()" class="btn btn-primary" style="width: auto; display: flex; align-items: center; gap: 6px;">
            <i data-feather="save" style="width: 16px; height: 16px;"></i> Сохранить график работы
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Заголовок страницы -->
      <div>
        <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Настройки</h1>
        <p style="color: var(--text-secondary); font-size: 14px;">Управление личной информацией и настройками салона</p>
      </div>

      <!-- Вкладки настроек -->
      ${tabsHtml}

      <!-- Область контента -->
      ${contentHtml}
    </div>
  `;
};

// Сохранение личного профиля пользователя
window.handleSaveUserProfile = async function () {
  const username = document.getElementById('user-username').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value.trim();

  if (!username) {
    showToast('Логин не может быть пустым', 'error');
    return;
  }
  if (!email) {
    showToast('Email не может быть пустым', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    await api.updateUserProfile(username, email, password);
    showToast('Профиль успешно обновлен', 'success');
    document.getElementById('user-password').value = '';
    
    // Обновляем данные пользователя
    const allData = await api.getAll();
    setState({
      userProfile: allData.userProfile
    });
  } catch (err) {
    showToast(err.message || 'Ошибка сохранения профиля', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Сохранение общей информации о бизнесе
window.handleSaveProfile = function () {
  const businessName = document.getElementById('set-name').value.trim();
  const description = document.getElementById('set-desc').value.trim();
  const address = document.getElementById('set-address').value.trim();
  let phone = document.getElementById('set-phone').value.trim();
  const email = document.getElementById('set-email').value.trim();

  phone = window.formatClientPhone(phone);

  showToast('Сохранение профиля...', 'info');

  api.updateSettings({ businessName, description, address, phone, email }).then(updated => {
    setState({ business: updated });
    showToast('Профиль салона успешно обновлен', 'success');
  }).catch(e => {
    showToast('Не удалось сохранить изменения', 'error');
  });
};

// Сохранение графика работы
window.handleSaveSchedule = function () {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const newSchedule = {};

  days.forEach(day => {
    newSchedule[day] = {
      enabled: document.getElementById(`sched-${day}-enabled`).checked,
      start: document.getElementById(`sched-${day}-start`).value,
      end: document.getElementById(`sched-${day}-end`).value
    };
  });

  showToast('Сохранение расписания...', 'info');

  api.updateSettings({ workSchedule: newSchedule }).then(updated => {
    setState({ business: updated });
    showToast('График работы успешно обновлен', 'success');
  }).catch(e => {
    showToast('Не удалось сохранить расписание', 'error');
  });
};
