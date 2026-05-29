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
          <div style="font-size: 12px; color: var(--text-secondary);">${formatClientPhone(b.clientPhone)}</div>
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

      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        ${actionsHtml}
        <button onclick="showBookingMessageModal('${b.id}')" class="btn btn-secondary" style="flex: 1; min-width: 140px; color: #3b82f6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.05);">💬 Отправить сообщение</button>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: space-between;">
        <button onclick="showEditBookingModal('${b.id}')" class="btn btn-secondary" style="width: auto;">
          ✏️ Редактировать
        </button>
        <button onclick="handleDeleteBooking('${b.id}')" class="btn btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.15); width: auto;">
          🗑 Удалить запись
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
  
  // Устанавливаем дефолтный шаблон
  const defaultText = `Здравствуйте, ${booking.clientName}!\nНапоминаем о вашей записи на ${booking.serviceName}\nДата: ${formatDate(booking.date)}\nВремя: ${formatTime(booking.time)}\nЖдем вас!`;
  
  setUI({ modal: 'bookingMessage', modalData: { booking, messageText: defaultText } });
};

window.handleMessageTemplateSelect = function (templateType) {
  const md = state.ui.modalData;
  const b = md.booking;
  let text = '';
  
  if (templateType === 'reminder') {
    text = `Здравствуйте, ${b.clientName}!\nНапоминаем о вашей записи на ${b.serviceName}\nДата: ${formatDate(b.date)}\nВремя: ${formatTime(b.time)}\nЖдем вас!`;
  } else if (templateType === 'thanks') {
    text = `Здравствуйте, ${b.clientName}!\nСпасибо, что выбрали наш салон. Будем рады видеть вас снова!`;
  } else if (templateType === 'confirmation') {
    text = `Здравствуйте, ${b.clientName}!\nВаша запись на ${b.serviceName} успешно подтверждена.\nДата: ${formatDate(b.date)}\nВремя: ${formatTime(b.time)}.`;
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
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">💬 Отправить сообщение</h3>
        <button onclick="setUI({ modal: 'viewBooking', modalData: md.booking })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">⬅</button>
      </div>
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="handleMessageTemplateSelect('reminder')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto;">⏰ Напоминание</button>
        <button onclick="handleMessageTemplateSelect('confirmation')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto;">✅ Подтверждение</button>
        <button onclick="handleMessageTemplateSelect('thanks')" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto;">❤️ Спасибо</button>
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
        categoryId: '',
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
        categoryId: categoryId,
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

window.handleWizardCategorySelect = function(categoryId) {
  const data = { ...state.ui.modalData };
  data.draft.categoryId = categoryId;
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
  data.step = 5;
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
        <input type="text" id="b-client-name" class="form-input" placeholder="Иван Иванов" value="${draft.clientName}" required autofocus>
      </div>
      <div class="form-group animate-slide-in-right" style="animation-delay: 0.1s;">
        <label class="form-label">Телефон клиента</label>
        <input type="tel" id="b-client-phone" class="form-input" placeholder="+996 555 123 456" value="${draft.clientPhone}" oninput="if(!this.value.startsWith('+996')) this.value='+996 ';" required>
      </div>
      <button type="button" onclick="setBookingWizardStep(2)" class="btn btn-primary" style="margin-top: 10px;">Далее: Категория ➔</button>
    `;
  } else if (step === 2) {
    const cats = state.categories || [];
    let catsHtml = cats.map(c => `
      <button type="button" onclick="handleWizardCategorySelect('${c.id}')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 16px; margin-bottom: 8px;">
        <span style="font-weight: 700;">${c.name}</span>
      </button>
    `).join('');
    
    if (!catsHtml) catsHtml = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">Нет доступных категорий</div>`;

    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">Выберите категорию услуг:</p>
        ${catsHtml}
        <button type="button" onclick="setBookingWizardStep(1)" class="btn btn-secondary" style="margin-top: 16px; border: none;">⬅ Назад</button>
      </div>
    `;
  } else if (step === 3) {
    const svcs = (state.services || []).filter(s => s.categoryId === draft.categoryId);
    let svcsHtml = svcs.map(s => `
      <button type="button" onclick="handleWizardServiceSelect('${s.id}')" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; padding: 14px; margin-bottom: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
        <span style="font-weight: 700;">${s.name}</span>
        <span style="font-size: 11px; color: var(--primary); font-weight: 800;">${formatPrice(s.price)} (${s.duration} мин)</span>
      </button>
    `).join('');

    if (!svcsHtml) svcsHtml = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">В этой категории нет услуг</div>`;

    stepContent = `
      <div class="animate-slide-in-right" style="display: flex; flex-direction: column;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">Выберите процедуру:</p>
        ${svcsHtml}
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
            <button type="button" onclick="state.ui.modalData.draft.paymentMethod='cash'; setUI({ modalData: state.ui.modalData })" class="btn ${draft.paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">💵 Наличные</button>
            <button type="button" onclick="state.ui.modalData.draft.paymentMethod='card'; setUI({ modalData: state.ui.modalData })" class="btn ${draft.paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">💳 Карта</button>
            <button type="button" onclick="state.ui.modalData.draft.paymentMethod='bonus'; setUI({ modalData: state.ui.modalData })" class="btn ${draft.paymentMethod === 'bonus' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">🌟 Бонусы</button>
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
    status: md.isEdit ? (state.bookings.find(b => b.id === md.bookingId)?.status || 'confirmed') : 'confirmed'
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
