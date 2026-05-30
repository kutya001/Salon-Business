// ============================================
// settings.js — Настройки бизнес-профиля
// ============================================

window.renderSettings = function () {
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

  const activeTab = state.ui.settingsTab || 'profile';
  const tabs = [
    { id: 'profile', label: 'Профиль', icon: 'user' },
    { id: 'schedule', label: 'График салона', icon: 'calendar' },
    { id: 'security', label: 'Безопасность', icon: 'lock' }
  ];

  const tabsHtml = `
    <div style="margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
      <div class="segment-tabs-container">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="setUI({ settingsTab: '${tab.id}' })" class="segment-tab ${isActive ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="${tab.label}">
              <i data-feather="${tab.icon}" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
              <span class="hidden md-inline">${tab.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'profile') {
    contentHtml = `
      <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;"><i data-feather="briefcase" style="width: 18px; height: 18px;"></i> Профиль салона</h3>
        
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
            <input type="tel" id="set-phone" class="form-input" value="${biz.phone || ''}">
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
        <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px; margin-bottom: 16px;"><i data-feather="calendar" style="width: 18px; height: 18px;"></i> График работы салона</h3>
        
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
  } else if (activeTab === 'security') {
    contentHtml = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Управление Пин-кодом -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;"><i data-feather="lock" style="width: 18px; height: 18px;"></i> Безопасность (PIN-код)</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">Установите 4-значный цифровой пин-код для ограничения доступа к панели Suluu Business. Если вы настраиваете его впервые, поле старого пин-кода можно оставить пустым.</p>
          
          <form onsubmit="event.preventDefault(); handlePinChangeSubmit();" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Старый PIN-код (4 цифры)</label>
              <input type="password" id="pin-old" class="form-input" pattern="[0-9]*" inputmode="numeric" maxlength="4" placeholder="••••">
            </div>
            <div class="form-group">
              <label class="form-label">Новый PIN-код (4 цифры)</label>
              <input type="password" id="pin-new" class="form-input" pattern="[0-9]*" inputmode="numeric" maxlength="4" placeholder="••••" required>
            </div>
            <div class="form-group">
              <label class="form-label">Подтверждение нового PIN-кода</label>
              <input type="password" id="pin-confirm" class="form-input" pattern="[0-9]*" inputmode="numeric" maxlength="4" placeholder="••••" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; width: fit-content;">
              <i data-feather="key" style="width: 16px; height: 16px;"></i> Установить / Изменить
            </button>
          </form>
        </div>

        <!-- Подключение бэкенда -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px; border-left: 5px solid var(--primary);">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text); display: flex; align-items: center; gap: 8px;"><i data-feather="settings" style="width: 18px; height: 18px;"></i> Системная информация</h3>
          
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Версия:</span><span style="font-weight: 700;">1.0.0 (PWA)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Платформа:</span><span style="font-weight: 700;">GitHub Pages & Google Sheets</span></div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <span style="color: var(--text-secondary); font-weight: 600;">Google Apps Script Web App URL:</span>
              <input type="text" value="${api.gasUrl}" readonly style="width:100%; font-family: monospace; font-size: 11px; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text-secondary);">
            </div>
          </div>
          
          <div style="margin-top: auto; border-top: 1px solid var(--border); padding-top: 16px; display: flex; justify-content: flex-end;">
            <button onclick="handleDisconnect()" class="btn btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.15); width: auto; display: flex; align-items: center; gap: 6px;">
              <i data-feather="power" style="width: 16px; height: 16px;"></i> Отключить бэкенд
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Заголовок страницы -->
      <div>
        <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Настройки</h1>
        <p style="color: var(--text-secondary); font-size: 14px;">Управление информацией о салоне, расписанием и безопасностью</p>
      </div>

      <!-- Вкладки настроек -->
      ${tabsHtml}

      <!-- Область контента -->
      ${contentHtml}
    </div>
  `;
};

// Сохранение общей информации о бизнесе
window.handleSaveProfile = async function () {
  const businessName = document.getElementById('set-name').value.trim();
  const description = document.getElementById('set-desc').value.trim();
  const address = document.getElementById('set-address').value.trim();
  let phone = document.getElementById('set-phone').value.trim();
  const email = document.getElementById('set-email').value.trim();

  // Очистка номера перед сохранением
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('996')) {
    phone = phone.slice(3);
  }

  setUI({ loading: true });
  try {
    const updated = await api.updateSettings({ businessName, description, address, phone, email });
    setState({ business: updated });
    showToast('Профиль успешно обновлен', 'success');
  } catch(e) {
    showToast('Не удалось сохранить изменения', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Переключение темы оформления
window.handleChangeTheme = async function (themeId) {
  setUI({ loading: true });
  try {
    const updated = await api.updateSettings({ theme: themeId });
    setState({ business: updated });
    
    // Мгновенное применение темы во всем приложении
    if (window.ThemeManager) {
      window.ThemeManager.setTheme(themeId);
    }
    
    showToast('Тема оформления успешно изменена', 'success');
  } catch(e) {
    showToast('Не удалось обновить тему', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Сохранение графика работы
window.handleSaveSchedule = async function () {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const newSchedule = {};

  days.forEach(day => {
    newSchedule[day] = {
      enabled: document.getElementById(`sched-${day}-enabled`).checked,
      start: document.getElementById(`sched-${day}-start`).value,
      end: document.getElementById(`sched-${day}-end`).value
    };
  });

  setUI({ loading: true });
  try {
    const updated = await api.updateSettings({ workSchedule: newSchedule });
    setState({ business: updated });
    showToast('График работы успешно обновлен', 'success');
  } catch(e) {
    showToast('Не удалось сохранить расписание', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Изменение PIN-кода
window.handlePinChangeSubmit = async function () {
  const oldPin = document.getElementById('pin-old').value.trim();
  const newPin = document.getElementById('pin-new').value.trim();
  const confirmPin = document.getElementById('pin-confirm').value.trim();

  const isDigits = /^\d{4}$/;
  if (!isDigits.test(newPin)) {
    showToast('Новый PIN-код должен состоять ровно из 4 цифр!', 'error');
    return;
  }
  if (newPin !== confirmPin) {
    showToast('Новые PIN-коды не совпадают', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    await api.changePassword(oldPin, newPin);
    document.getElementById('pin-old').value = '';
    document.getElementById('pin-new').value = '';
    document.getElementById('pin-confirm').value = '';
    showToast('PIN-код доступа успешно изменен!', 'success');
  } catch(e) {
    showToast(e.message || 'Ошибка смены PIN-кода', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Отключение бэкенда (сброс)
window.handleDisconnect = function () {
  if (confirm('Вы действительно хотите отключить бэкенд? Все данные будут удалены из кэша приложения, потребуется настроить скрипт заново.')) {
    localStorage.removeItem('gas_url');
    localStorage.removeItem('auth_token');
    location.reload();
  }
};
