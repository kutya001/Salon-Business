// ============================================
// bookings.js — Управление записями клиентов
// ============================================

window.renderBookings = function () {
  const filters = state.ui.filters;
  const viewMode = state.ui.viewMode || 'table';

  // Фильтрация записей
  let filteredBookings = [...state.bookings];
  
  if (filters.dateFrom) {
    filteredBookings = filteredBookings.filter(b => b.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    filteredBookings = filteredBookings.filter(b => b.date <= filters.dateTo);
  }
  if (filters.status) {
    filteredBookings = filteredBookings.filter(b => b.status === filters.status);
  }
  if (filters.masterId) {
    filteredBookings = filteredBookings.filter(b => b.masterId === filters.masterId);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filteredBookings = filteredBookings.filter(b => 
      b.clientName.toLowerCase().includes(q) || 
      b.clientPhone.includes(q) || 
      b.serviceName.toLowerCase().includes(q)
    );
  }

  // Отрисовка фильтров
  const masterOptions = state.masters.map(m => `
    <option value="${m.id}" ${filters.masterId === m.id ? 'selected' : ''}>${m.name}</option>
  `).join('');

  const filterBarHtml = `
    <div class="card p-5" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin-bottom: 24px;">
      <div class="form-group" style="flex: 1 1 180px;">
        <label class="form-label">С даты</label>
        <input type="date" value="${filters.dateFrom || ''}" onchange="setFilters({ dateFrom: this.value })" class="form-input">
      </div>
      <div class="form-group" style="flex: 1 1 180px;">
        <label class="form-label">По дату</label>
        <input type="date" value="${filters.dateTo || ''}" onchange="setFilters({ dateTo: this.value })" class="form-input">
      </div>
      <div class="form-group" style="flex: 1 1 180px;">
        <label class="form-label">Мастер</label>
        <select onchange="setFilters({ masterId: this.value })" class="form-select">
          <option value="">Все мастера</option>
          ${masterOptions}
        </select>
      </div>
      <div class="form-group" style="flex: 1 1 180px;">
        <label class="form-label">Статус</label>
        <select onchange="setFilters({ status: this.value })" class="form-select">
          <option value="">Все статусы</option>
          <option value="pending" ${filters.status === 'pending' ? 'selected' : ''}>Ожидает</option>
          <option value="confirmed" ${filters.status === 'confirmed' ? 'selected' : ''}>Подтверждена</option>
          <option value="completed" ${filters.status === 'completed' ? 'selected' : ''}>Завершена</option>
          <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>Отменена</option>
          <option value="no-show" ${filters.status === 'no-show' ? 'selected' : ''}>Не пришел</option>
        </select>
      </div>
      <div class="form-group" style="flex: 2 1 240px;">
        <label class="form-label">Поиск</label>
        <input type="text" placeholder="Имя клиента, телефон, услуга..." value="${filters.searchQuery || ''}" oninput="debounce(() => setFilters({ searchQuery: this.value }))()" class="form-input">
      </div>
    </div>
  `;

  // Отрисовка списка/таблицы или таймлайна
  let viewHtml = '';
  if (viewMode === 'table') {
    viewHtml = renderBookingsTable(filteredBookings);
  } else {
    viewHtml = renderBookingsTimeline(filteredBookings);
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column;">
      
      <!-- Заголовок страницы -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Записи клиентов</h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Календарь, сетка и список записей на процедуры</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          
          <!-- Переключатель видов -->
          <div style="display: flex; background: var(--theme-50); border: 1px solid var(--border); padding: 4px; border-radius: 12px; gap: 4px;">
            <button onclick="toggleBookingsView('table')" class="btn" style="padding: 8px 12px; font-size: 12px; border-radius: 8px; width: auto; background: ${viewMode === 'table' ? 'var(--bg-secondary)' : 'none'}; box-shadow: ${viewMode === 'table' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'}; color: ${viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)'};">
              📋 Список
            </button>
            <button onclick="toggleBookingsView('timeline')" class="btn" style="padding: 8px 12px; font-size: 12px; border-radius: 8px; width: auto; background: ${viewMode === 'timeline' ? 'var(--bg-secondary)' : 'none'}; box-shadow: ${viewMode === 'timeline' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'}; color: ${viewMode === 'timeline' ? 'var(--primary)' : 'var(--text-secondary)'};">
              📊 Сетка (Таймлайн)
            </button>
          </div>

          <button onclick="showCreateBookingModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
            ➕ Новая запись
          </button>
        </div>
      </div>

      <!-- Панель фильтров -->
      ${filterBarHtml}

      <!-- Область контента -->
      ${viewHtml}
    </div>
  `;
};

// Функция переключения режима просмотра записей
window.toggleBookingsView = function (mode) {
  setUI({ viewMode: mode });
};

// Вспомогательное: Рендеринг таблицы записей
function renderBookingsTable(bookings) {
  if (bookings.length === 0) {
    return `
      <div class="card p-12 text-center" style="color: var(--text-secondary);">
        <span style="font-size: 56px; display: block; margin-bottom: 16px;">🔍</span>
        <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Записи не найдены</h3>
        <p style="font-size: 14px;">Попробуйте сбросить фильтры или создать новую запись</p>
      </div>
    `;
  }

  const rows = bookings.map(b => {
    const statusColor = getStatusColor(b.status);
    const statusLabel = getStatusLabel(b.status);
    
    let actionBtnHtml = '';
    if (b.status === 'pending') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'confirmed')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto;">
          👍 Подтвердить
        </button>
      `;
    } else if (b.status === 'confirmed') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'completed')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto; color: #10b981; border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05);">
          ✅ Завершить
        </button>
      `;
    }

    return `
      <tr onclick="showBookingDetails('${b.id}')" style="cursor: pointer;">
        <td data-label="Дата и время" style="font-weight: 600;">
          <div style="font-size: 14px;">${formatRelativeDate(b.date)}</div>
          <div style="font-size: 12px; color: var(--primary); font-weight: 700;">${formatTime(b.time)}</div>
        </td>
        <td data-label="Клиент">
          <div style="font-weight: 700;">${b.clientName}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${b.clientPhone}</div>
        </td>
        <td data-label="Процедура">
          <div style="font-weight: 600;">${b.serviceName}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${b.duration} мин</div>
        </td>
        <td data-label="Мастер" style="font-weight: 600; color: var(--text-secondary);">${b.masterName}</td>
        <td data-label="Статус">
          <span class="badge ${statusColor}">${statusLabel}</span>
        </td>
        <td data-label="Стоимость" style="font-weight: 800; color: var(--text);">${formatPrice(b.price)}</td>
        <td data-label="Действия" style="display: flex; gap: 8px; justify-content: flex-end;">
          ${actionBtnHtml}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card p-2" style="overflow: hidden;">
      <div class="data-table-container">
        <table class="data-table mobile-table-card">
          <thead>
            <tr>
              <th>Дата и время</th>
              <th>Клиент</th>
              <th>Процедура</th>
              <th>Мастер</th>
              <th>Статус</th>
              <th>Стоимость</th>
              <th style="text-align: right;">Действия</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Вспомогательное: Рендеринг таймлайна по мастерам
function renderBookingsTimeline(bookings) {
  if (state.masters.length === 0) {
    return `<div class="card p-8 text-center">Создайте сначала мастеров в разделе "Мастера"</div>`;
  }

  const hours = generateTimeSlots('09:00', '20:00', 60);
  
  // Заголовки мастеров
  const masterHeaders = state.masters.map(m => `
    <th style="text-align: center; font-weight: 700; width: 220px; min-width: 220px;">
      ${m.name}
      <div style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">${m.specialization}</div>
    </th>
  `).join('');

  // Строки по часам
  const rows = hours.map(hour => {
    const cols = state.masters.map(m => {
      // Ищем записи этого мастера на этот час на выбранную дату (state.ui.filters.dateFrom)
      const slotDate = state.ui.filters.dateFrom || new Date().toISOString().split('T')[0];
      const matchBookings = bookings.filter(b => 
        b.masterId === m.id && 
        b.date === slotDate &&
        b.time.split(':')[0] === hour.split(':')[0]
      );

      const bookingBlocks = matchBookings.map(b => {
        const statusColor = getStatusColor(b.status);
        const statusLabel = getStatusLabel(b.status);
        return `
          <div onclick="showBookingDetails('${b.id}')" class="animate-scale-in" style="background: var(--bg); border: 2px solid var(--border); border-left-color: var(--primary); padding: 8px 12px; border-radius: 12px; margin-bottom: 6px; cursor: pointer; text-align: left; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.02);" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 800; font-size: 12px; color: var(--primary);">${formatTime(b.time)}</span>
              <span class="badge ${statusColor}" style="font-size: 9px; padding: 2px 6px;">${statusLabel}</span>
            </div>
            <div style="font-weight: 700; font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.clientName}</div>
            <div style="font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.serviceName} (${b.duration} мин)</div>
          </div>
        `;
      }).join('');

      return `
        <td style="padding: 10px; border-right: 1px solid var(--border); vertical-align: top; background: var(--bg-secondary);">
          ${bookingBlocks}
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td style="font-weight: 800; color: var(--primary); text-align: center; width: 70px; background: var(--theme-50); border-right: 1px solid var(--border);">${hour}</td>
        ${cols}
      </tr>
    `;
  }).join('');

  return `
    <div class="card p-2" style="overflow-x: auto;">
      <div style="min-width: 700px;">
        <table class="data-table" style="border: 1px solid var(--border);">
          <thead>
            <tr>
              <th style="width: 70px; background: var(--theme-50);">Время</th>
              ${masterHeaders}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Изменение статуса записи с перезагрузкой
window.handleUpdateBookingStatus = async function (id, newStatus) {
  setUI({ loading: true });
  try {
    const updated = await api.updateBooking(id, { status: newStatus });
    
    // Обновляем локальное состояние
    const idx = state.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.bookings[idx] = updated;
    }
    
    // Перезагружаем кассовые смены и транзакции при завершении записи
    if (newStatus === 'completed') {
      const allData = await api.getAll();
      setState({
        transactions: allData.transactions,
        shifts: allData.shifts,
        clients: allData.clients
      });
    }

    setUI({ modal: null, modalData: null });
    showToast('Статус записи успешно изменен', 'success');
  } catch(e) {
    showToast('Не удалось обновить статус', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Функция удаления записи
window.handleDeleteBooking = async function (id) {
  if (!confirm('Вы уверены, что хотите удалить эту запись? Действие необратимо.')) return;
  
  setUI({ loading: true });
  try {
    await api.deleteBooking(id);
    const bookings = state.bookings.filter(b => b.id !== id);
    setState({ bookings });
    setUI({ modal: null, modalData: null });
    showToast('Запись удалена', 'success');
  } catch(e) {
    showToast('Не удалось удалить запись', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Модалка просмотра деталей записи
window.showBookingDetails = function (id) {
  const booking = state.bookings.find(b => b.id === id);
  if (!booking) return;
  setUI({ modal: 'viewBooking', modalData: booking });
};

window.renderBookingDetailsModal = function () {
  const b = state.ui.modalData;
  if (!b) return '';
  const statusColor = getStatusColor(b.status);
  const statusLabel = getStatusLabel(b.status);

  let actionsHtml = '';
  if (b.status === 'pending') {
    actionsHtml = `
      <button onclick="handleUpdateBookingStatus('${b.id}', 'confirmed')" class="btn btn-primary" style="flex: 1;">👍 Подтвердить</button>
      <button onclick="handleUpdateBookingStatus('${b.id}', 'cancelled')" class="btn btn-danger" style="flex: 1; background: #dc2626;">❌ Отклонить</button>
    `;
  } else if (b.status === 'confirmed') {
    actionsHtml = `
      <button onclick="handleUpdateBookingStatus('${b.id}', 'completed')" class="btn btn-primary" style="flex: 1; background: #10b981;">✅ Завершить сеанс</button>
      <button onclick="handleUpdateBookingStatus('${b.id}', 'no-show')" class="btn btn-secondary" style="flex: 1; color: #ef4444; border-color: rgba(239,68,68,0.2);">🙅 Не пришел</button>
    `;
  }

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Детали записи</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Статус записи</span>
          <span class="badge ${statusColor}">${statusLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Дата и время</span>
          <span style="font-weight: 700; color: var(--text);">${formatDateTime(b.date, b.time)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Клиент</span>
          <span style="font-weight: 700; color: var(--text);">${b.clientName} (${b.clientPhone})</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Услуга</span>
          <span style="font-weight: 700; color: var(--text);">${b.serviceName} (${b.duration} мин)</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Мастер</span>
          <span style="font-weight: 700; color: var(--text);">${b.masterName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Стоимость</span>
          <span style="font-weight: 800; font-size: 16px; color: var(--primary);">${formatPrice(b.price)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Способ оплаты</span>
          <span style="font-weight: 700; color: var(--text);">${b.paymentMethod === 'card' ? '💳 Картой' : b.paymentMethod === 'bonus' ? '🌟 Бонусы' : '💵 Наличные'}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Заметки/Комментарий</span>
          <p style="background: var(--bg); padding: 10px; border-radius: 8px; font-size: 13px; color: var(--text); border: 1px solid var(--border);">${b.notes || 'Комментариев нет'}</p>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 10px;">
        ${actionsHtml}
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: flex-end;">
        <button onclick="handleDeleteBooking('${b.id}')" class="btn btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.15); width: auto;">
          🗑 Удалить запись
        </button>
      </div>
    </div>
  `;
};

// Открытие модалки создания записи
window.showCreateBookingModal = function () {
  setUI({ modal: 'createBooking', modalData: {} });
};

window.renderBookingModal = function () {
  const masterOptions = state.masters.map(m => `
    <option value="${m.id}">${m.name} (${m.specialization})</option>
  `).join('');

  const serviceOptions = state.services.map(s => `
    <option value="${s.id}">${s.name} — ${formatPrice(s.price)} (${s.duration} мин)</option>
  `).join('');

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Новая запись на процедуру</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="create-booking-form" onsubmit="event.preventDefault(); handleCreateBookingSubmit();" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 60vh; padding-right: 4px;">
        <div class="form-group">
          <label class="form-label">Имя клиента</label>
          <input type="text" id="b-client-name" class="form-input" placeholder="Иван Иванов" required>
        </div>
        <div class="form-group">
          <label class="form-label">Телефон клиента</label>
          <input type="tel" id="b-client-phone" class="form-input" placeholder="+996 555 123 456" required>
        </div>
        <div class="form-group">
          <label class="form-label">Выберите процедуру</label>
          <select id="b-service-id" class="form-select" required>
            <option value="">Выберите процедуру...</option>
            ${serviceOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Выберите мастера</label>
          <select id="b-master-id" class="form-select" required>
            <option value="">Выберите мастера...</option>
            ${masterOptions}
          </select>
        </div>
        <div style="display: flex; gap: 12px; width: 100%;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Дата</label>
            <input type="date" id="b-date" class="form-input" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Время</label>
            <input type="time" id="b-time" class="form-input" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Способ оплаты</label>
          <select id="b-payment" class="form-select">
            <option value="cash">💵 Наличные</option>
            <option value="card">💳 Карта / Банковский перевод</option>
            <option value="bonus">🌟 Бонусы</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Заметки / Пожелания</label>
          <textarea id="b-notes" rows="2" class="form-textarea" placeholder="Например: первый раз, дизайн ногтей, аллергия..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          Создать и подтвердить запись
        </button>
      </form>
    </div>
  `;
};

// Обработчик отправки создания записи
window.handleCreateBookingSubmit = async function () {
  const name = document.getElementById('b-client-name').value.trim();
  const phone = document.getElementById('b-client-phone').value.trim();
  const serviceId = document.getElementById('b-service-id').value;
  const masterId = document.getElementById('b-master-id').value;
  const date = document.getElementById('b-date').value;
  const time = document.getElementById('b-time').value;
  const paymentMethod = document.getElementById('b-payment').value;
  const notes = document.getElementById('b-notes').value.trim();

  setUI({ loading: true });
  try {
    const newBooking = await api.createBooking({
      clientName: name,
      clientPhone: phone,
      serviceId,
      masterId,
      date,
      time,
      paymentMethod,
      notes,
      status: 'confirmed' // создаем подтвержденной
    });

    // Обновляем список записей и клиентов
    const allData = await api.getAll();
    setState({
      bookings: allData.bookings,
      clients: allData.clients,
      transactions: allData.transactions,
      shifts: allData.shifts
    });

    setUI({ modal: null });
    showToast('Запись успешно добавлена!', 'success');
  } catch(e) {
    showToast(e.message || 'Ошибка создания записи', 'error');
  } finally {
    setUI({ loading: false });
  }
};
