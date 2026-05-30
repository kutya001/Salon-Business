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

  // Вкладки статусов (Desktop + Mobile)
  const statusTabs = [
    { id: '', label: 'ВСЕ ЗАПИСИ' },
    { id: 'pending', label: 'ЗАПИСАН' },
    { id: 'confirmed', label: 'ПОДТВЕРЖДЁН' },
    { id: 'completed', label: 'ВЫПОЛНЕН' },
    { id: 'cancelled', label: 'ОТМЕНА' }
  ];

  const statusTabsHtml = `
    <div style="display: flex; gap: 24px; border-bottom: 1px solid var(--border); overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px; scrollbar-width: none; -ms-overflow-style: none;">
      ${statusTabs.map(tab => {
        const isActive = (filters.status || '') === tab.id;
        return `
          <div onclick="setFilters({ status: '${tab.id}' })" style="font-size: 13px; font-weight: 700; color: ${isActive ? 'var(--primary)' : 'var(--text-secondary)'}; cursor: pointer; position: relative; white-space: nowrap; transition: color 0.2s;">
            ${tab.label}
            ${isActive ? '<div style="position: absolute; bottom: -9px; left: 0; right: 0; height: 2px; background: var(--primary); border-radius: 2px;"></div>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Отрисовка фильтров
  const masterOptions = state.masters.map(m => `
    <option value="${m.id}" ${filters.masterId === m.id ? 'selected' : ''}>${m.name}</option>
  `).join('');

  const filterBarHtml = `
    <!-- Mobile Filters Panel -->
    <div class="card p-4 md-hidden animate-scale-in" style="margin-bottom: 16px; display: ${state.ui.showMobileFilters ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
      <div style="display: flex; gap: 12px;">
        <div style="flex: 1;">
            <label class="form-label" style="font-size: 11px;">С даты</label>
            <input type="date" value="${filters.dateFrom || ''}" onchange="setFilters({ dateFrom: this.value })" class="form-input" style="padding: 8px 12px;">
        </div>
        <div style="flex: 1;">
            <label class="form-label" style="font-size: 11px;">По дату</label>
            <input type="date" value="${filters.dateTo || ''}" onchange="setFilters({ dateTo: this.value })" class="form-input" style="padding: 8px 12px;">
        </div>
      </div>
      <div style="display: flex; gap: 12px;">
        <select onchange="setFilters({ masterId: this.value })" class="form-select" style="flex: 1;">
          <option value="">👤 Мастера Все</option>
          ${masterOptions}
        </select>
        <select onchange="setFilters({ categoryId: this.value })" class="form-select" style="flex: 1;">
          <option value="">💅 Услуги Все</option>
        </select>
      </div>
    </div>
    
    <!-- Mobile Search Panel -->
    <div class="card p-3 md-hidden animate-scale-in" style="margin-bottom: 16px; display: ${state.ui.showMobileSearch ? 'flex' : 'none'}; align-items: center; position: relative;">
      <i data-feather="search" style="position: absolute; left: 24px; color: var(--text-secondary); width: 16px; height: 16px;"></i>
      <input type="text" placeholder="Поиск по клиенту, телефону..." value="${filters.searchQuery || ''}" oninput="debounce(() => setFilters({ searchQuery: this.value }))()" class="form-input" style="width: 100%; padding-left: 36px; border: none; background: var(--bg-secondary); box-shadow: none;">
    </div>

    <!-- Desktop Filters Panel -->
    <div class="card p-3 hidden md-flex" style="align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
      <div style="display: flex; align-items: center; flex: 1; min-width: 200px; position: relative;">
        <i data-feather="search" style="position: absolute; left: 16px; color: var(--text-secondary); width: 16px; height: 16px;"></i>
        <input type="text" placeholder="Поиск по клиенту, телефону..." value="${filters.searchQuery || ''}" oninput="debounce(() => setFilters({ searchQuery: this.value }))()" class="form-input" style="padding-left: 40px; border: none; background: var(--bg-secondary); width: 100%; box-shadow: none;">
      </div>
      
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">Дата:</span>
        <input type="date" value="${filters.dateFrom || ''}" onchange="setFilters({ dateFrom: this.value })" class="form-input" style="width: auto; padding: 6px 12px; font-size: 13px; border: none; background: var(--bg-secondary); box-shadow: none;">
        <button onclick="setFilters({ dateFrom: new Date().toISOString().split('T')[0], dateTo: '' })" class="btn btn-secondary" style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--primary);">Сегодня</button>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <select onchange="setFilters({ masterId: this.value })" class="form-select" style="width: auto; padding: 6px 12px; font-size: 13px; border: none; background: var(--bg-secondary); box-shadow: none;">
          <option value="">👤 Мастера Все</option>
          ${masterOptions}
        </select>
        <select class="form-select" style="width: auto; padding: 6px 12px; font-size: 13px; border: none; background: var(--bg-secondary); box-shadow: none;">
          <option value="">💅 Услуги Все</option>
        </select>
        <button class="btn btn-secondary" style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
          <i data-feather="columns" style="width: 14px; height: 14px;"></i> Столбцы
        </button>
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

  // Убрали старую FAB кнопку

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column;">
      
      <!-- Заголовок страницы и переключатель видов -->
      <div style="display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
        <div class="hidden md-flex" style="align-items: center; gap: 16px;">
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Записи салона</h1>
          <button onclick="showCreateBookingModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;">
            <i data-feather="plus" style="width: 16px; height: 16px;"></i> Добавить запись
          </button>
        </div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-left: auto;">
          <!-- Переключатель видов -->
          <div style="display: flex; background: var(--bg-secondary); padding: 4px; border-radius: 12px; gap: 4px;">
            <button onclick="toggleBookingsView('table')" class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto; background: ${viewMode === 'table' ? 'var(--bg)' : 'none'}; box-shadow: ${viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'}; color: ${viewMode === 'table' ? 'var(--text)' : 'var(--text-secondary)'}; display: flex; align-items: center; gap: 6px;">
              <i data-feather="list" style="width: 14px; height: 14px;"></i> <span class="hidden md-block">Таблица</span>
            </button>
            <button onclick="toggleBookingsView('timeline')" class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto; background: ${viewMode === 'timeline' ? 'var(--bg)' : 'none'}; box-shadow: ${viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'}; color: ${viewMode === 'timeline' ? 'var(--text)' : 'var(--text-secondary)'}; display: flex; align-items: center; gap: 6px;">
              <i data-feather="calendar" style="width: 14px; height: 14px;"></i> <span class="hidden md-block">Timeline</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Вкладки статусов -->
      ${statusTabsHtml}

      <!-- Панель фильтров -->
      ${filterBarHtml}

      <!-- Область контента -->
      ${viewHtml}
      
      <!-- Плавающая кнопка добавления записи (FAB) -->
      <button onclick="showCreateBookingModal()" class="md-hidden animate-scale-in" style="position: fixed; bottom: 110px; right: 20px; width: 60px; height: 60px; border-radius: 30px; background: var(--primary); color: white; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50;">
        <i data-feather="plus" style="width: 28px; height: 28px;"></i>
      </button>
    </div>
  `;
};

// Функция переключения режима просмотра записей
window.toggleBookingsView = function (mode) {
  setUI({ viewMode: mode });
};

// Вспомогательное: Рендеринг таблицы записей (и мобильных карточек)
function renderBookingsTable(bookings) {
  if (bookings.length === 0) {
    return `
      <div class="card p-12 text-center" style="color: var(--text-secondary);">
        <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="search" style="width: 56px; height: 56px;"></i></span>
        <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Записи не найдены</h3>
        <p style="font-size: 14px;">Попробуйте сбросить фильтры или создать новую запись</p>
      </div>
    `;
  }

  const mobileRows = bookings.map(b => {
    const statusColor = getStatusColor(b.status);
    const statusLabel = getStatusLabel(b.status);
    
    // Payment status indicator
    const isPaid = b.status === 'completed';
    const paymentIndicator = isPaid 
      ? `<div style="font-size: 10px; color: #10b981; display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;"><div style="width: 6px; height: 6px; border-radius: 3px; background: #10b981;"></div> Оплачено</div>`
      : `<div style="font-size: 10px; color: #ef4444; display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;"><div style="width: 6px; height: 6px; border-radius: 3px; background: #ef4444;"></div> Не оплачено</div>`;

    // Quick actions
    let actionBtnHtml = '';
    if (b.status === 'pending') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'confirmed')" title="Подтвердить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: var(--primary);"><i data-feather="check" style="width: 14px; height: 14px;"></i></button>
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'cancelled')" title="Отменить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #ef4444;"><i data-feather="x" style="width: 14px; height: 14px;"></i></button>
      `;
    } else if (b.status === 'confirmed') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'completed')" title="Завершить/Оплатить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #10b981;"><i data-feather="credit-card" style="width: 14px; height: 14px;"></i></button>
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'cancelled')" title="Отменить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #ef4444;"><i data-feather="x" style="width: 14px; height: 14px;"></i></button>
      `;
    }

    // Master Dropdown (styled as text on mobile)
    const masterText = `<span style="font-weight: 600; color: var(--text-secondary); font-size: 12px;">${b.masterName}</span>`;

    return `
      <div id="booking-${b.id}" class="card p-4" onclick="showBookingDetails('${b.id}')" style="margin-bottom: 12px; border-left: 4px solid ${b.status === 'completed' ? '#10b981' : b.status === 'confirmed' ? 'var(--primary)' : 'var(--text-secondary)'}; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 800; font-size: 14px;">${formatRelativeDate(b.date)} в <span style="color: var(--primary);">${formatTime(b.time)}</span></div>
            <div style="font-weight: 700; font-size: 15px; color: var(--text); margin-top: 4px; display: flex; align-items: center;">${b.clientName} <a href="tel:${b.clientPhone}" onclick="event.stopPropagation()" style="color: var(--primary); margin-left: 8px; padding: 4px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i data-feather="phone" style="width: 12px; height: 12px;"></i></a></div>
          </div>
          <div style="text-align: right;">
            <span class="badge ${statusColor}" style="font-size: 10px;">${statusLabel}</span>
            ${paymentIndicator}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; padding-top: 8px; border-top: 1px dashed var(--border);">
          <div>
            <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">${b.serviceName}</div>
            <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px;">
              <i data-feather="user" style="width: 12px; height: 12px; color: var(--text-secondary);"></i>
              ${masterText}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 14px; color: var(--text);">${formatPrice(b.price)}</div>
            <div style="display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px;">${actionBtnHtml}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const desktopRows = bookings.map(b => {
    const statusColor = getStatusColor(b.status);
    const statusLabel = getStatusLabel(b.status);
    
    // Payment status indicator
    const isPaid = b.status === 'completed';
    const paymentIndicator = isPaid 
      ? `<div style="font-size: 10px; color: #10b981; display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;"><div style="width: 6px; height: 6px; border-radius: 3px; background: #10b981;"></div> Оплачено</div>`
      : `<div style="font-size: 10px; color: #ef4444; display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;"><div style="width: 6px; height: 6px; border-radius: 3px; background: #ef4444;"></div> Не оплачено</div>`;

    // Quick actions
    let actionBtnHtml = '';
    if (b.status === 'pending') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'confirmed')" title="Подтвердить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: var(--primary);"><i data-feather="check" style="width: 14px; height: 14px;"></i></button>
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'cancelled')" title="Отменить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #ef4444;"><i data-feather="x" style="width: 14px; height: 14px;"></i></button>
      `;
    } else if (b.status === 'confirmed') {
      actionBtnHtml = `
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'completed')" title="Завершить/Оплатить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #10b981;"><i data-feather="credit-card" style="width: 14px; height: 14px;"></i></button>
        <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'cancelled')" title="Отменить" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #ef4444;"><i data-feather="x" style="width: 14px; height: 14px;"></i></button>
      `;
    }

    const masterSelect = `
      <select onchange="event.stopPropagation();" onclick="event.stopPropagation();" class="form-select" style="padding: 4px 24px 4px 8px; font-size: 12px; border: none; background: var(--bg-secondary); border-radius: 6px;">
        ${state.masters.map(m => `<option value="${m.id}" ${b.masterId === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
      </select>
    `;

    return `
      <tr id="booking-${b.id}" onclick="showBookingDetails('${b.id}')" style="cursor: pointer; transition: background 0.2s;">
        <td style="font-weight: 700;">${b.clientName}</td>
        <td style="color: var(--text-secondary); font-size: 13px;">${formatClientPhone(b.clientPhone)}</td>
        <td style="font-weight: 600;">${b.serviceName}</td>
        <td style="color: var(--text-secondary); font-size: 13px;">${formatRelativeDate(b.date)}</td>
        <td style="font-weight: 800; color: var(--primary);">${formatTime(b.time)}</td>
        <td>${masterSelect}</td>
        <td style="font-weight: 800; color: var(--text);">${formatPrice(b.price)}</td>
        <td>
          <span class="badge ${statusColor}">${statusLabel}</span>
          ${paymentIndicator}
        </td>
        <td>
          <div style="display: flex; gap: 4px; justify-content: flex-end;">${actionBtnHtml}</div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div>
      <div class="card p-0 hidden md-block" style="overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Клиент ↕</th>
                <th>Номер телефона ↕</th>
                <th>Услуга ↕</th>
                <th>Дата ↓</th>
                <th>Время ↕</th>
                <th>Мастер ↕</th>
                <th>Сумма ↕</th>
                <th>Статус ↕</th>
                <th style="text-align: right;">Действия</th>
              </tr>
            </thead>
            <tbody>
              ${desktopRows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="md-hidden">
        ${mobileRows}
      </div>
    </div>

  `;
}

// Вспомогательное: Рендеринг таймлайна по мастерам (День / Неделя / Месяц)
function renderBookingsTimeline(bookings) {
  if (state.masters.length === 0) {
    return `<div class="card p-8 text-center">Создайте сначала мастеров в разделе "Мастера"</div>`;
  }

  const mode = state.ui.timelineMode || 'day';
  const slotDateStr = state.ui.timelineDate || new Date().toISOString().split('T')[0];
  const slotDate = new Date(slotDateStr);

  let columns = [];
  let colTitle = '';
  
  if (mode === 'day') {
    // День: часы
    const hours = generateTimeSlots('09:00', '20:00', 60);
    columns = hours.map(h => ({ id: h, label: h, type: 'hour' }));
    colTitle = formatRelativeDate(slotDateStr);
  } else if (mode === 'week') {
    // Неделя: дни
    const startOfWeek = new Date(slotDate);
    startOfWeek.setDate(slotDate.getDate() - (slotDate.getDay() || 7) + 1); // Понедельник
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      columns.push({ id: dStr, label: `${dayNames[d.getDay()]} ${('0'+d.getDate()).slice(-2)}.${('0'+(d.getMonth()+1)).slice(-2)}`, type: 'day' });
    }
    colTitle = 'Неделя';
  } else if (mode === 'month') {
    // Месяц: дни
    const y = slotDate.getFullYear();
    const m = slotDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m, i);
      const dStr = d.toISOString().split('T')[0];
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      columns.push({ id: dStr, label: `${i} ${dayNames[d.getDay()]}`, type: 'day' });
    }
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    colTitle = `${monthNames[m]} ${y}`;
  }

  // Заголовки колонок
  const headersHtml = columns.map(col => `
    <th style="text-align: center; font-weight: 700; width: ${mode === 'day' ? '120px' : '150px'}; min-width: ${mode === 'day' ? '120px' : '150px'};">
      <div style="color: var(--text-secondary); font-size: 13px;">${col.label}</div>
    </th>
  `).join('');

  // Строки по мастерам
  const rowsHtml = state.masters.map(m => {
    const colsHtml = columns.map(col => {
      // Поиск записей
      let matchBookings = [];
      if (mode === 'day') {
        matchBookings = state.bookings.filter(b => b.masterId === m.id && b.date === slotDateStr && b.time.startsWith(col.id.split(':')[0]));
      } else {
        matchBookings = state.bookings.filter(b => b.masterId === m.id && b.date === col.id);
      }

      const bookingBlocks = matchBookings.map(b => {
        let actions = '';
        if (b.status === 'pending' || b.status === 'confirmed') {
          const nextAction = b.status === 'pending' ? 'confirmed' : 'completed';
          const nextIcon = b.status === 'pending' ? 'check' : 'credit-card';
          actions = `
            <div style="display: flex; gap: 4px; margin-top: 6px; justify-content: flex-end; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 4px;">
              <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', '${nextAction}')" style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 3px; cursor: pointer; box-shadow: 0 2px 4px rgba(16,185,129,0.2);"><i data-feather="${nextIcon}" style="width: 12px; height: 12px;"></i></button>
              <button onclick="event.stopPropagation(); handleUpdateBookingStatus('${b.id}', 'cancelled')" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 3px; cursor: pointer; box-shadow: 0 2px 4px rgba(239,68,68,0.2);"><i data-feather="x" style="width: 12px; height: 12px;"></i></button>
            </div>
          `;
        }

        const bgColor = b.status === 'completed' ? '#f0fdf4' : b.status === 'confirmed' ? 'var(--theme-50)' : b.status === 'pending' ? '#fffbeb' : '#f8fafc';
        const bdColor = b.status === 'completed' ? '#10b981' : b.status === 'confirmed' ? 'var(--primary)' : b.status === 'pending' ? '#f59e0b' : 'var(--border)';

        return `
          <div id="booking-${b.id}" onclick="showBookingDetails('${b.id}')" class="animate-scale-in" style="background: ${bgColor}; border: 1px solid ${bdColor}; border-left: 3px solid ${bdColor}; padding: 6px 8px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; text-align: left; font-size: 11px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 800; color: ${bdColor}; font-size: 10px;">${formatTime(b.time)}</span>
            </div>
            <div style="font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${b.clientName}</div>
            <div style="color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px;">${b.serviceName}</div>
            ${actions}
          </div>
        `;
      }).join('');

      return `<td style="padding: 8px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); vertical-align: top; background: var(--bg-secondary); min-height: 80px;">${bookingBlocks}</td>`;
    }).join('');

    return `
      <tr>
        <td style="font-weight: 700; background: var(--bg); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); position: sticky; left: 0; z-index: 10;">
          <div style="display: flex; flex-direction: column; gap: 2px; padding: 8px; max-width: 90px; overflow: hidden;">
            <div style="font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">${m.name.split(' ')[0]}</div>
            <div style="font-size: 9px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.specialization}</div>
          </div>
        </td>
        ${colsHtml}
      </tr>
    `;
  }).join('');

  return `
    <div class="card p-0" style="box-shadow: 0 4px 12px rgba(0,0,0,0.02); overflow: hidden;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 16px;">
        
        <div style="display: flex; align-items: center; gap: 4px; background: var(--bg-secondary); padding: 4px; border-radius: 10px;">
          <button onclick="setUI({ timelineMode: 'day' })" class="btn" style="padding: 6px 16px; font-size: 12px; border-radius: 8px; background: ${mode === 'day' ? 'var(--bg)' : 'transparent'}; box-shadow: ${mode === 'day' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'}; color: ${mode === 'day' ? 'var(--text)' : 'var(--text-secondary)'}; font-weight: ${mode === 'day' ? '700' : '500'}; transition: all 0.2s;">День</button>
          <button onclick="setUI({ timelineMode: 'week' })" class="btn" style="padding: 6px 16px; font-size: 12px; border-radius: 8px; background: ${mode === 'week' ? 'var(--bg)' : 'transparent'}; box-shadow: ${mode === 'week' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'}; color: ${mode === 'week' ? 'var(--text)' : 'var(--text-secondary)'}; font-weight: ${mode === 'week' ? '700' : '500'}; transition: all 0.2s;">Неделя</button>
          <button onclick="setUI({ timelineMode: 'month' })" class="btn" style="padding: 6px 16px; font-size: 12px; border-radius: 8px; background: ${mode === 'month' ? 'var(--bg)' : 'transparent'}; box-shadow: ${mode === 'month' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'}; color: ${mode === 'month' ? 'var(--text)' : 'var(--text-secondary)'}; font-weight: ${mode === 'month' ? '700' : '500'}; transition: all 0.2s;">Месяц</button>
        </div>

        <div style="display: flex; align-items: center; gap: 16px; background: var(--bg-secondary); padding: 4px 12px; border-radius: 12px;">
          <button onclick="
            const d = new Date('${slotDateStr}');
            if (state.ui.timelineMode === 'week') d.setDate(d.getDate() - 7);
            else if (state.ui.timelineMode === 'month') d.setMonth(d.getMonth() - 1);
            else d.setDate(d.getDate() - 1);
            setUI({ timelineDate: d.toISOString().split('T')[0] });
          " class="btn" style="padding: 4px; background: none; border: none; color: var(--text-secondary);"><i data-feather="chevron-left" style="width: 18px; height: 18px;"></i></button>
          
          <h3 style="font-weight: 800; font-size: 14px; color: var(--text); min-width: 100px; text-align: center; margin: 0;">${colTitle}</h3>
          
          <button onclick="
            const d = new Date('${slotDateStr}');
            if (state.ui.timelineMode === 'week') d.setDate(d.getDate() + 7);
            else if (state.ui.timelineMode === 'month') d.setMonth(d.getMonth() + 1);
            else d.setDate(d.getDate() + 1);
            setUI({ timelineDate: d.toISOString().split('T')[0] });
          " class="btn" style="padding: 4px; background: none; border: none; color: var(--text-secondary);"><i data-feather="chevron-right" style="width: 18px; height: 18px;"></i></button>
        </div>

      </div>
      <div style="overflow-x: auto; max-height: calc(100vh - 200px);">
        <table class="data-table" style="border-collapse: separate; border-spacing: 0;">
          <thead style="position: sticky; top: 0; z-index: 20; background: var(--bg);">
            <tr>
              <th style="width: 200px; min-width: 200px; background: var(--bg); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); position: sticky; left: 0; z-index: 30; padding: 12px;">Мастер</th>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
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
      if (window.render) window.render();
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
      <button onclick="handleUpdateBookingStatus('${b.id}', 'confirmed')" class="btn btn-primary" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-feather="thumbs-up" style="width: 16px; height: 16px;"></i> Подтвердить</button>
      <button onclick="handleUpdateBookingStatus('${b.id}', 'cancelled')" class="btn btn-danger" style="flex: 1; background: #dc2626; display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-feather="x" style="width: 16px; height: 16px;"></i> Отклонить</button>
    `;
  } else if (b.status === 'confirmed') {
    actionsHtml = `
      <button onclick="handleUpdateBookingStatus('${b.id}', 'completed')" class="btn btn-primary" style="flex: 1; background: #10b981; display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-feather="check-circle" style="width: 16px; height: 16px;"></i> Завершить сеанс</button>
      <button onclick="handleUpdateBookingStatus('${b.id}', 'no-show')" class="btn btn-secondary" style="flex: 1; color: #ef4444; border-color: rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-feather="user-x" style="width: 16px; height: 16px;"></i> Не пришел</button>
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
          <span style="font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px;">
            <i data-feather="${b.paymentMethod === 'card' ? 'credit-card' : b.paymentMethod === 'bonus' ? 'star' : 'dollar-sign'}" style="width: 14px; height: 14px; color: var(--primary);"></i>
            ${b.paymentMethod === 'card' ? 'Картой' : b.paymentMethod === 'bonus' ? 'Бонусы' : 'Наличные'}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">Заметки/Комментарий</span>
          <p style="background: var(--bg); padding: 10px; border-radius: 8px; font-size: 13px; color: var(--text); border: 1px solid var(--border);">${b.notes || 'Комментариев нет'}</p>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        ${actionsHtml}
        <button onclick="showBookingMessageModal('${b.id}')" class="btn btn-secondary" style="flex: 1; min-width: 140px; color: #3b82f6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.05); display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-feather="message-circle" style="width: 16px; height: 16px;"></i> Отправить сообщение</button>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: space-between;">
        <button onclick="showEditBookingModal('${b.id}')" class="btn btn-secondary" style="width: auto; display: flex; align-items: center; gap: 6px;">
          <i data-feather="edit-2" style="width: 14px; height: 14px;"></i> Редактировать
        </button>
        <button onclick="handleDeleteBooking('${b.id}')" class="btn btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.15); width: auto; display: flex; align-items: center; gap: 6px;">
          <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> Удалить запись
        </button>
      </div>
    </div>
  `;
};

// ------------------------------------------------------------------
// Модалка отправки сообщений
// ------------------------------------------------------------------

window.showBookingMessageModal = function (id) {
  const booking = state.bookings.find(b => b.id === id);
  if (!booking) return;
  
  const bizName = state.business ? (state.business.businessName || state.business.name || 'Салон') : 'Салон';
  // Устанавливаем дефолтный шаблон
  const defaultText = `Здравствуйте, ${booking.clientName}!\nНапоминаем о вашей записи на ${booking.serviceName} в ${bizName}.\nДата: ${formatDate(booking.date)}\nВремя: ${formatTime(booking.time)}\nЖдем вас!`;
  
  setUI({ modal: 'bookingMessage', modalData: { booking, messageText: defaultText } });
};

window.handleMessageTemplateSelect = function (templateType) {
  const md = state.ui.modalData;
  const b = md.booking;
  let text = '';
  
  const bizName = state.business ? (state.business.businessName || state.business.name || 'Салон') : 'Салон';
  
  if (templateType === 'reminder') {
    text = `Здравствуйте, ${b.clientName}!\nНапоминаем о вашей записи на ${b.serviceName} в ${bizName}.\nДата: ${formatDate(b.date)}\nВремя: ${formatTime(b.time)}\nЖдем вас!`;
  } else if (templateType === 'thanks') {
    text = `Здравствуйте, ${b.clientName}!\nСпасибо, что выбрали ${bizName}. Будем рады видеть вас снова!`;
  } else if (templateType === 'confirmation') {
    text = `Здравствуйте, ${b.clientName}!\nВаша запись на ${b.serviceName} в ${bizName} успешно подтверждена.\nДата: ${formatDate(b.date)}\nВремя: ${formatTime(b.time)}.`;
  }
  
  setUI({ modalData: { ...md, messageText: text } });
};

window.sendBookingMessage = function (platform) {
  const md = state.ui.modalData;
  const phone = formatClientPhone(md.booking.clientPhone).replace(/\D/g, '');
  const text = document.getElementById('message-text').value;
  
  if (platform === 'whatsapp') {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  } else if (platform === 'telegram') {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Текст скопирован! Вставьте его в чат Telegram.', 'info', 4000);
      const url = `https://t.me/+${phone}`;
      window.open(url, '_blank');
    }).catch(() => {
      showToast('Не удалось скопировать текст', 'error');
    });
  }
};

window.renderBookingMessageModal = function () {
  const md = state.ui.modalData;
  
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text); display: flex; align-items: center; gap: 8px;"><i data-feather="message-circle" style="width: 20px; height: 20px; color: var(--primary);"></i> Отправить сообщение</h3>
        <button onclick="setUI({ modal: 'viewBooking', modalData: md.booking })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);"><i data-feather="arrow-left"></i></button>
      </div>
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="handleMessageTemplateSelect('reminder')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto; display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 14px; height: 14px;"></i> Напоминание</button>
        <button onclick="handleMessageTemplateSelect('confirmation')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto; display: flex; align-items: center; gap: 4px;"><i data-feather="check" style="width: 14px; height: 14px;"></i> Подтверждение</button>
        <button onclick="handleMessageTemplateSelect('thanks')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto; display: flex; align-items: center; gap: 4px;"><i data-feather="heart" style="width: 14px; height: 14px;"></i> Спасибо</button>
      </div>

      <div class="form-group">
        <label class="form-label">Текст сообщения</label>
        <textarea id="message-text" class="form-textarea" rows="6" onchange="state.ui.modalData.messageText = this.value">${md.messageText}</textarea>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 8px;">
        <button onclick="sendBookingMessage('whatsapp')" class="btn" style="flex: 1; background: #25D366; color: white; border: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
          WhatsApp
        </button>
        <button onclick="sendBookingMessage('telegram')" class="btn" style="flex: 1; background: #0088cc; color: white; border: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
          Telegram
        </button>
      </div>
    </div>
  `;
};

// Открытие модалки создания/редактирования записи
window.showCreateBookingModal = function () {
  setUI({ 
    modal: 'createBooking', 
    modalData: {
      step: 1,
      isEdit: false,
      draft: {
        clientName: '',
        clientPhone: '',
        genderCategory: '',
        serviceId: '',
        masterId: '',
        date: '',
        time: '',
        paymentMethod: 'cash',
        notes: ''
      }
    } 
  });
};

window.showEditBookingModal = function (id) {
  const b = state.bookings.find(x => x.id === id);
  if (!b) return;
  
  // Ищем категорию услуги
  const service = state.services.find(s => s.id === b.serviceId);
  const categoryId = service ? service.categoryId : '';

  setUI({ 
    modal: 'createBooking', 
    modalData: {
      step: 1,
      isEdit: true,
      bookingId: id,
      draft: {
        clientName: b.clientName,
        clientPhone: formatClientPhone(b.clientPhone),
        genderCategory: service ? service.genderCategory : '',
        serviceId: b.serviceId,
        masterId: b.masterId,
        date: b.date,
        time: b.time,
        paymentMethod: b.paymentMethod || 'cash',
        notes: b.notes || ''
      }
    } 
  });
};

// Переход по шагам в модалке
window.setBookingWizardStep = function(step) {
  const data = { ...state.ui.modalData };
  
  // Сохраняем значения текущего шага
  if (data.step === 1) {
    const nameInput = document.getElementById('b-client-name');
    const phoneInput = document.getElementById('b-client-phone');
    if (nameInput && phoneInput) {
      if (!nameInput.value.trim() || !phoneInput.value.trim() || phoneInput.value.trim() === '+996') {
        return showToast('Пожалуйста, заполните имя и телефон', 'error');
      }
      data.draft.clientName = nameInput.value.trim();
      data.draft.clientPhone = phoneInput.value.trim();
    }
  } else if (data.step === 2) {
    // Категория выбирается по клику, тут сохранять нечего, но переход делаем ниже
  } else if (data.step === 3) {
    // Услуга выбирается по клику
  } else if (data.step === 4) {
    // Мастер выбирается по клику
  }

  data.step = step;
  setUI({ modalData: data });
};

window.handleWizardGenderSelect = function(genderCategory) {
  const data = { ...state.ui.modalData };
  data.draft.genderCategory = genderCategory;
  data.draft.serviceId = ''; // сбрасываем услугу при смене категории
  data.step = 3;
  setUI({ modalData: data });
};

window.handleWizardServiceSelect = function(serviceId) {
  const data = { ...state.ui.modalData };
  data.draft.serviceId = serviceId;
  data.draft.masterId = ''; // сбрасываем мастера при смене услуги
  data.step = 4;
  setUI({ modalData: data });
};

window.handleWizardMasterSelect = function(masterId) {
  const data = { ...state.ui.modalData };
  data.draft.masterId = masterId; // если '', то 'Любой'
  
  if (!data.draft.date) {
    data.draft.date = new Date().toISOString().split('T')[0];
  }
  if (!data.draft.time) {
    data.draft.time = new Date().toTimeString().substring(0, 5);
  }
  
  data.step = 5;
  setUI({ modalData: data });
};

window.handleWizardPaymentSelect = function(method) {
  const data = { ...state.ui.modalData };
  const d = document.getElementById('b-date');
  const t = document.getElementById('b-time');
  const n = document.getElementById('b-notes');
  if (d) data.draft.date = d.value;
  if (t) data.draft.time = t.value;
  if (n) data.draft.notes = n.value;
  
  data.draft.paymentMethod = method;
  setUI({ modalData: data });
};

window.renderBookingModal = function () {
  const md = state.ui.modalData;
  const step = md.step || 1;
  const draft = md.draft || {};

  const totalSteps = 5;
  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;

  let stepContent = '';

  if (step === 1) {
    stepContent = `
      <div class="form-group animate-slide-in-right">
        <label class="form-label">Имя клиента</label>
        <input type="text" id="b-client-name" class="form-input" placeholder="Иван Иванов" value="${draft.clientName}" onkeydown="if(event.key==='Enter') { event.preventDefault(); document.getElementById('b-client-phone').focus(); }" required autofocus>
      </div>
      <div class="form-group animate-slide-in-right" style="animation-delay: 0.1s;">
        <label class="form-label">Телефон клиента</label>
        <input type="tel" id="b-client-phone" class="form-input" placeholder="+996 555 123 456" value="${draft.clientPhone}" oninput="if(!this.value.startsWith('+996')) this.value='+996 ';" onkeydown="if(event.key==='Enter') { event.preventDefault(); setBookingWizardStep(2); }" required>
      </div>
      <button type="button" onclick="setBookingWizardStep(2)" class="btn btn-primary" style="margin-top: 10px;">Далее: Категория ➔</button>
    `;
  } else if (step === 2) {
    const genders = [
      { id: 'female', name: '👩 Женская' },
      { id: 'male', name: '👨 Мужская' },
      { id: 'any', name: '🧑 Любая' }
    ];
    let catsHtml = genders.map(c => `
      <button type="button" onclick="handleWizardGenderSelect('${c.id}')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 16px; margin-bottom: 8px;">
        <span style="font-weight: 700;">${c.name}</span>
      </button>
    `).join('');

    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">Выберите категорию (пол):</p>
        ${catsHtml}
        <button type="button" onclick="setBookingWizardStep(1)" class="btn btn-secondary" style="margin-top: 16px; border: none;">⬅ Назад</button>
      </div>
    `;
  } else if (step === 3) {
    const svcs = (state.services || []).filter(s => s.genderCategory === draft.genderCategory);
    
    const grouped = {};
    svcs.forEach(s => {
      const t = s.categoryName || 'Другое';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(s);
    });

    let svcsHtml = '';
    for (const typeName in grouped) {
      svcsHtml += `<h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin: 12px 0 8px 4px; font-weight: 800;">${typeName}</h4>`;
      svcsHtml += grouped[typeName].map(s => `
        <button type="button" onclick="handleWizardServiceSelect('${s.id}')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 14px; margin-bottom: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
          <span style="font-weight: 700;">${s.name}</span>
          <span style="font-size: 11px; color: var(--primary); font-weight: 800;">${formatPrice(s.price)} (${s.duration} мин)</span>
        </button>
      `).join('');
    }

    if (!svcsHtml) svcsHtml = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">В этой категории нет услуг</div>`;

    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">Выберите процедуру:</p>
        <div class="scrollbar-hide" style="max-height: 40vh; overflow-y: auto; padding-right: 4px;">
          ${svcsHtml}
        </div>
        <button type="button" onclick="setBookingWizardStep(2)" class="btn btn-secondary" style="margin-top: 16px; border: none;">⬅ Назад</button>
      </div>
    `;
  } else if (step === 4) {
    const masters = state.masters || [];
    let mastersHtml = `
      <button type="button" onclick="handleWizardMasterSelect('')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 14px; margin-bottom: 8px; border-color: var(--primary);">
        <span style="font-weight: 800; color: var(--primary);">👤 Любой мастер</span>
      </button>
    `;
    mastersHtml += masters.map(m => `
      <button type="button" onclick="handleWizardMasterSelect('${m.id}')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 14px; margin-bottom: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
        <span style="font-weight: 700;">${m.name}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">${m.specialization}</span>
      </button>
    `).join('');

    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">К какому мастеру записать?</p>
        ${mastersHtml}
        <button type="button" onclick="setBookingWizardStep(3)" class="btn btn-secondary" style="margin-top: 16px; border: none;">⬅ Назад</button>
      </div>
    `;
  } else if (step === 5) {
    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; gap: 12px; width: 100%;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Дата</label>
            <input type="date" id="b-date" class="form-input" value="${draft.date}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Время</label>
            <input type="time" id="b-time" class="form-input" value="${draft.time}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Способ оплаты</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" onclick="handleWizardPaymentSelect('cash')" class="btn ${draft.paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">💵 Наличные</button>
            <button type="button" onclick="handleWizardPaymentSelect('card')" class="btn ${draft.paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">💳 Карта</button>
            <button type="button" onclick="handleWizardPaymentSelect('bonus')" class="btn ${draft.paymentMethod === 'bonus' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">🌟 Бонусы</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Заметки / Пожелания</label>
          <textarea id="b-notes" rows="2" class="form-textarea" placeholder="Например: первый раз, аллергия...">${draft.notes}</textarea>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 10px;">
          <button type="button" onclick="setBookingWizardStep(4)" class="btn btn-secondary" style="flex: 1;">⬅ Назад</button>
          <button type="button" onclick="handleCreateBookingSubmit()" class="btn btn-primary" style="flex: 2;">${md.isEdit ? 'Сохранить изменения ✅' : 'Создать запись ✅'}</button>
        </div>
      </div>
    `;
  }

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Новая запись (Шаг ${step}/${totalSteps})</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <!-- Прогресс-бар -->
      <div style="height: 6px; background: var(--theme-50); border-radius: 3px; overflow: hidden; margin-top: -10px;">
        <div style="height: 100%; width: ${progressPercent}%; background: var(--primary); transition: width 0.3s ease;"></div>
      </div>

      <form id="create-booking-form" onsubmit="event.preventDefault();" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 60vh; padding-right: 4px; overflow-x: hidden;">
        ${stepContent}
      </form>
    </div>
  `;
};

// Обработчик финальной отправки (Optimistic UI)
window.handleCreateBookingSubmit = function () {
  const md = state.ui.modalData;
  const draft = md.draft || {};
  
  // Сохраняем значения с 5 шага
  const dateInput = document.getElementById('b-date');
  const timeInput = document.getElementById('b-time');
  const notesInput = document.getElementById('b-notes');
  
  if (!dateInput.value || !timeInput.value) {
    return showToast('Укажите дату и время записи', 'error');
  }

  // Очистка номера перед сохранением (убираем всё кроме цифр, если начинается с 996 - отрезаем)
  let cleanPhone = draft.clientPhone.replace(/\D/g, '');
  if (cleanPhone.startsWith('996')) {
    cleanPhone = cleanPhone.slice(3);
  }

  const payload = {
    clientName: draft.clientName,
    clientPhone: cleanPhone,
    serviceId: draft.serviceId,
    masterId: draft.masterId, // Может быть пустой строкой, бэкенд должен обработать как "Любой"
    date: dateInput.value,
    time: timeInput.value,
    paymentMethod: draft.paymentMethod,
    notes: notesInput.value.trim(),
    status: md.isEdit ? (state.bookings.find(b => b.id === md.bookingId)?.status || 'pending') : 'pending'
  };

  // Оптимистичное обновление
  const tempId = md.isEdit ? md.bookingId : ('b_temp_' + Date.now());
  const service = state.services.find(s => s.id === payload.serviceId) || {};
  const master = state.masters.find(m => m.id === payload.masterId) || { name: 'Любой мастер' };
  
  const optimisticBooking = {
    id: tempId,
    clientId: 'temp_client',
    clientName: payload.clientName,
    clientPhone: payload.clientPhone,
    serviceId: payload.serviceId,
    serviceName: service.name || 'Неизвестная услуга',
    masterId: payload.masterId,
    masterName: master.name,
    date: payload.date,
    time: payload.time,
    duration: service.duration || 60,
    price: service.price || 0,
    status: payload.status,
    paymentMethod: payload.paymentMethod,
    notes: payload.notes
  };

  if (md.isEdit) {
    const idx = state.bookings.findIndex(b => b.id === tempId);
    if (idx !== -1) state.bookings[idx] = { ...state.bookings[idx], ...optimisticBooking };
  } else {
    state.bookings.push(optimisticBooking);
  }
  
  setUI({ modal: null, modalData: null });
  showToast(md.isEdit ? 'Изменения сохранены (синхронизация...)' : 'Запись добавлена (синхронизация...)', 'info');

  // Фоновая синхронизация
  const apiCall = md.isEdit ? api.updateBooking(tempId, payload) : api.createBooking(payload);
  
  apiCall.then(() => {
    return api.getAll(); // перезапрашиваем все данные для точности (клиенты, транзакции и т.д.)
  }).then(allData => {
    setState({
      bookings: allData.bookings,
      clients: allData.clients,
      transactions: allData.transactions,
      shifts: allData.shifts
    });
    showToast('Запись успешно синхронизирована!', 'success');
  }).catch(e => {
    showToast(e.message || 'Ошибка создания записи на сервере', 'error');
    setState({ bookings: state.bookings.filter(b => b.id !== tempId) });
  });
};
