// ============================================
// clients.js — База клиентов
// ============================================

window.renderClients = function () {
  const query = state.ui.searchQuery || '';
  
  // Фильтрация клиентов по строке поиска
  let filteredClients = [...state.clients];
  if (query) {
    const q = query.toLowerCase();
    filteredClients = filteredClients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) || 
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  const rows = filteredClients.length === 0
    ? `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
          🔍 Клиенты не найдены
        </td>
      </tr>
    `
    : filteredClients.map(c => `
      <tr onclick="showClientDetails('${c.id}')" style="cursor: pointer;">
        <td data-label="Имя" style="font-weight: 700;">${c.name}</td>
        <td data-label="Телефон" style="font-weight: 600;">${formatClientPhone(c.phone)}</td>
        <td data-label="Email" style="color: var(--text-secondary);">${c.email || '—'}</td>
        <td data-label="Всего записей" style="font-weight: 600; text-align: center;">${c.totalBookings || 0}</td>
        <td data-label="Всего потрачено" style="font-weight: 800; color: var(--primary);">${formatPrice(c.totalSpent)}</td>
      </tr>
    `).join('');

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 28px;">
      
      <!-- Заголовок страницы -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Клиентская база</h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Список гостей, история процедур и суммарные траты</p>
        </div>
        <button onclick="showCreateClientModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
          ➕ Добавить клиента
        </button>
      </div>

      <!-- Панель поиска -->
      <div class="card p-5" style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px; color: var(--text-secondary);">🔍</span>
        <input type="text" placeholder="Поиск по имени, телефону или email..." value="${query}" oninput="setState({ ui: { ...state.ui, searchQuery: this.value } })" class="form-input" style="border: none; padding: 4px; font-size: 15px; width: 100%; box-shadow: none;">
      </div>

      <!-- Таблица клиентов -->
      <div class="card p-2" style="overflow: hidden;">
        <div class="data-table-container">
          <table class="data-table mobile-table-card">
            <thead>
              <tr>
                <th>Имя клиента</th>
                <th>Телефон</th>
                <th>Email</th>
                <th style="text-align: center;">Всего записей</th>
                <th>Суммарные траты</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

// Открытие модалки добавления клиента
window.showCreateClientModal = function () {
  setUI({ modal: 'createClient', modalData: null });
};

// Просмотр детальной карточки клиента
window.showClientDetails = function (id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  setUI({ modal: 'viewClient', modalData: client });
};

window.renderClientDetailsModal = function () {
  const c = state.ui.modalData;
  if (!c) return '';

  // Получаем историю записей этого клиента
  const clientBookings = state.bookings
    .filter(b => b.clientId === c.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const historyRows = clientBookings.length === 0
    ? `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 20px;">Нет истории визитов</td></tr>`
    : clientBookings.map(b => `
        <tr>
          <td style="font-weight: 600;">${formatDate(b.date)}</td>
          <td>${b.serviceName}</td>
          <td>${b.masterName}</td>
          <td><span class="badge ${getStatusColor(b.status)}">${getStatusLabel(b.status)}</span></td>
        </tr>
      `).join('');

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-height: 85vh;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Карточка клиента</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 4px;">
        
        <!-- Личная информация -->
        <div class="card p-4" style="background: var(--bg); display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary); font-weight: 600;">ФИО:</span><span style="font-weight: 700;">${c.name}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary); font-weight: 600;">Телефон:</span><span style="font-weight: 700;">${formatClientPhone(c.phone)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary); font-weight: 600;">Email:</span><span style="font-weight: 700;">${c.email || '—'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary); font-weight: 600;">Всего потрачено:</span><span style="font-weight: 800; color: var(--primary);">${formatPrice(c.totalSpent)}</span></div>
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            <span style="color: var(--text-secondary); font-weight: 600;">Заметки:</span>
            <p style="padding: 8px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border);">${c.notes || 'Заметок о клиенте нет'}</p>
          </div>
        </div>

        <!-- История процедур -->
        <h4 style="font-weight: 800; font-size: 14px; color: var(--text); margin-top: 8px;">История посещений (${clientBookings.length})</h4>
        <div class="data-table-container">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Услуга</th>
                <th>Мастер</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
        </div>

      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button onclick="showEditClientModal()" class="btn btn-secondary" style="width: auto;">✏️ Редактировать профиль</button>
      </div>
    </div>
  `;
};

// Открытие модалки редактирования клиента
window.showEditClientModal = function () {
  const client = state.ui.modalData;
  setUI({ modal: 'createClient', modalData: client });
};

window.renderClientModal = function () {
  const c = state.ui.modalData;
  const isEdit = !!c;

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактировать клиента' : 'Добавить клиента'}</h3>
        <button onclick="setUI({ modal: isEdit ? 'viewClient' : null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="client-form" onsubmit="event.preventDefault(); handleClientSubmit('${isEdit ? c.id : ''}');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Имя клиента</label>
          <input type="text" id="c-name" class="form-input" placeholder="Ольга Васильева" value="${isEdit ? c.name : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Номер телефона</label>
          <input type="tel" id="c-phone" class="form-input" placeholder="+996 555 777 888" value="${isEdit ? formatClientPhone(c.phone) : '+996 '}" oninput="if(!this.value.startsWith('+996')) this.value='+996 ';" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email (необязательно)</label>
          <input type="email" id="c-email" class="form-input" placeholder="olga@gmail.com" value="${isEdit ? c.email : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Заметки о клиенте</label>
          <textarea id="c-notes" rows="3" class="form-textarea" placeholder="Предпочтения, аллергия, особенности...">${isEdit ? c.notes : ''}</textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить профиль' : 'Добавить в базу'}
        </button>
      </form>
    </div>
  `;
};

// Отправка данных клиента
window.handleClientSubmit = async function (id) {
  const name = document.getElementById('c-name').value.trim();
  let phone = document.getElementById('c-phone').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const notes = document.getElementById('c-notes').value.trim();

  // Очистка номера перед сохранением (убираем всё кроме цифр, если начинается с 996 - отрезаем)
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('996')) {
    phone = phone.slice(3);
  }

  setUI({ loading: true });
  try {
    let result;
    if (id) {
      result = await api.updateClient(id, { name, phone, email, notes });
      const idx = state.clients.findIndex(c => c.id === id);
      if (idx !== -1) {
        state.clients[idx] = result;
      }
      showToast('Карточка клиента обновлена', 'success');
      setUI({ modal: 'viewClient', modalData: result });
    } else {
      result = await api.createClient({ name, phone, email, notes });
      state.clients.push(result);
      showToast('Клиент успешно добавлен в базу!', 'success');
      setUI({ modal: null, modalData: null });
    }
  } catch(e) {
    showToast('Ошибка сохранения клиента', 'error');
  } finally {
    setUI({ loading: false });
  }
};
