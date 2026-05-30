// ============================================
// services.js — Управление каталогом услуг
// ============================================

window.renderServices = function () {
  const activeTab = state.ui.selectedCategory || 'Все';

  // Фильтрация услуг по выбранной категории
  let filteredServices = [...state.services];
  if (activeTab !== 'Все') {
    filteredServices = filteredServices.filter(s => s.categoryId === activeTab);
  }

  // Отрисовка табов категорий
  const allTab = { id: 'Все', name: 'Все' };
  const tabsHtml = [allTab, ...state.categories].map(cat => {
    const isActive = activeTab === cat.id;
    return `
      <button onclick="handleSelectCategory('${cat.id}')" class="category-pill ${isActive ? 'active' : ''}" style="white-space: nowrap; padding: 10px 20px; border-radius: 9999px; font-weight: 700; font-size: 13px; border: 1px solid var(--border); background: ${isActive ? 'linear-gradient(135deg,var(--theme-500),var(--theme-600))' : 'var(--bg-secondary)'}; color: ${isActive ? '#ffffff' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s;">
        ${cat.name}
      </button>
    `;
  }).join('');

  // Список услуг по карточкам
  const cardsHtml = filteredServices.length === 0
    ? `
      <div class="card p-12 text-center" style="color: var(--text-secondary); grid-column: 1 / -1;">
        <span style="font-size: 56px; display: block; margin-bottom: 16px;">💇</span>
        <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">В категории нет услуг</h3>
        <p style="font-size: 14px; margin-bottom: 16px;">Добавьте новую процедуру, чтобы сделать ее доступной для записи</p>
        <button onclick="showCreateServiceModal()" class="btn btn-primary" style="width: auto;">Добавить услугу</button>
      </div>
    `
    : filteredServices.map(s => `
      <div class="card card-hover p-6" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
        <div>
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px;">
            <h3 style="font-weight: 800; font-size: 16px; color: var(--text);">${s.name}</h3>
            <span class="badge badge-info" style="font-size: 9px; padding: 2px 8px; text-transform: uppercase;">${s.categoryName}</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px;">
            ${s.description || 'Описание услуги отсутствует.'}
          </p>
        </div>

        <div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 14px; margin-bottom: 14px;">
            <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">🕒 ${s.duration} мин</span>
            <span style="font-weight: 800; font-size: 18px; color: var(--primary);">${formatPrice(s.price)}</span>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button onclick="showEditServiceModal('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto;">
              ✏️ Изменить
            </button>
            <button onclick="handleDeleteService('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15);">
              🗑 Удалить
            </button>
          </div>
        </div>
      </div>
    `).join('');

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 28px;">
      
      <!-- Заголовок страницы -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Услуги и прайс-лист</h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Каталог процедур салона, цены и продолжительность сеансов</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button onclick="showCategoriesModal()" class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px;">
            📁 Категории
          </button>
          <button onclick="showCreateServiceModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
            ➕ Добавить услугу
          </button>
        </div>
      </div>

      <!-- Лента категорий -->
      <div class="scrollbar-hide" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch;">
        ${tabsHtml}
      </div>

      <!-- Сетка карточек -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${cardsHtml}
      </div>

    </div>
  `;
};

// Функция переключения категории
window.handleSelectCategory = function (cat) {
  setUI({ selectedCategory: cat });
};

// Открытие модалки добавления услуги
window.showCreateServiceModal = function () {
  setUI({ modal: 'createService', modalData: null });
};

// Открытие модалки редактирования услуги
window.showEditServiceModal = function (id) {
  const service = state.services.find(s => s.id === id);
  if (!service) return;
  setUI({ modal: 'createService', modalData: service });
};

window.renderServiceModal = function () {
  const s = state.ui.modalData;
  const isEdit = !!s;

  const durationOptions = [15, 30, 45, 60, 90, 120, 150, 180].map(mins => `
    <option value="${mins}" ${(isEdit && parseInt(s.duration, 10) === mins) ? 'selected' : ''}>${mins} мин</option>
  `).join('');

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактировать услугу' : 'Добавить новую услугу'}</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="service-form" onsubmit="event.preventDefault(); handleServiceSubmit('${isEdit ? s.id : ''}');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Название услуги</label>
          <input type="text" id="s-name" class="form-input" placeholder="Классический маникюр" value="${isEdit ? s.name : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <div style="display: flex; gap: 8px;">
            <select id="s-category" class="form-select" required style="flex-grow: 1;">
              <option value="">Выберите категорию...</option>
              ${state.categories.map(c => `<option value="${c.id}" ${(isEdit && s.categoryId === c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
            <button type="button" onclick="handleQuickCreateCategory()" class="btn btn-secondary" style="width: auto; padding: 0 16px; display: flex; align-items: center; justify-content: center; font-size: 16px;">➕</button>
          </div>
        </div>
        <div style="display: flex; gap: 12px; width: 100%;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Стоимость (сом)</label>
            <input type="number" id="s-price" class="form-input" placeholder="800" min="0" value="${isEdit ? s.price : ''}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Длительность</label>
            <select id="s-duration" class="form-select" required>
              <option value="">Выберите...</option>
              ${durationOptions}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Описание услуги</label>
          <textarea id="s-description" rows="3" class="form-textarea" placeholder="Укажите детали процедуры, противопоказания, используемые материалы...">${isEdit ? s.description : ''}</textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Создать услугу'}
        </button>
      </form>
    </div>
  `;
};

// Отправка формы услуги (Фоновая синхронизация)
window.handleServiceSubmit = function (id) {
  const name = document.getElementById('s-name').value.trim();
  const categoryId = document.getElementById('s-category').value;
  const categoryName = state.categories.find(c => c.id === categoryId)?.name || '';
  const price = parseFloat(document.getElementById('s-price').value) || 0;
  const duration = parseInt(document.getElementById('s-duration').value, 10) || 60;
  const description = document.getElementById('s-description').value.trim();

  // Оптимистичное обновление
  const tempId = id || 'temp_' + Date.now();
  const serviceData = { id: tempId, name, categoryId, categoryName, price, duration, description, status: 'active' };

  if (id) {
    const idx = state.services.findIndex(s => s.id === id);
    if (idx !== -1) state.services[idx] = { ...state.services[idx], ...serviceData };
    showToast('Услуга обновлена', 'success');
  } else {
    state.services.push(serviceData);
    showToast('Услуга успешно добавлена в прайс!', 'success');
  }

  setUI({ modal: null, modalData: null });

  // Фоновая отправка на сервер
  if (id) {
    api.updateService(id, { name, categoryId, categoryName, price, duration, description }).catch(e => {
      showToast('Ошибка фоновой синхронизации услуги', 'error');
    });
  } else {
    api.createService({ name, categoryId, categoryName, price, duration, description }).then(result => {
      // Заменяем временный ID на реальный
      const idx = state.services.findIndex(s => s.id === tempId);
      if (idx !== -1) {
        state.services[idx] = result;
        setState({ services: state.services });
      }
    }).catch(e => {
      showToast('Ошибка фоновой синхронизации создания услуги', 'error');
      setState({ services: state.services.filter(s => s.id !== tempId) });
    });
  }
};

// Удаление услуги
window.handleDeleteService = function (id) {
  if (!confirm('Вы действительно хотите удалить эту услугу из каталога?')) return;
  
  // Оптимистичное обновление
  const backup = [...state.services];
  const services = state.services.filter(s => s.id !== id);
  setState({ services });
  showToast('Услуга удалена из списка', 'success');

  // Фоновая синхронизация
  api.deleteService(id).catch(e => {
    showToast('Не удалось удалить услугу на сервере', 'error');
    setState({ services: backup }); // откат
  });
};

// ----------------------------------------------------
// Модалка Управления Категориями
// ----------------------------------------------------

window.showCategoriesModal = function() {
  setUI({ modal: 'categories', modalData: null });
};

window.renderCategoriesModal = function() {
  const catsHtml = state.categories.length === 0 ? '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">Категорий пока нет</div>' :
    state.categories.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px;">
        <span style="font-weight: 700;">${c.name}</span>
        <button onclick="handleDeleteCategory('${c.id}')" class="btn" style="color: #ef4444; background: rgba(239,68,68,0.1); border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px;">Удалить</button>
      </div>
    `).join('');

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Справочник категорий</h3>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <div style="max-height: 50vh; overflow-y: auto;">
        ${catsHtml}
      </div>

      <form onsubmit="event.preventDefault(); handleCreateCategory();" style="display: flex; gap: 8px; margin-top: 10px; border-top: 1px solid var(--border); padding-top: 16px;">
        <input type="text" id="cat-name-input" class="form-input" placeholder="Новая категория..." required style="flex-grow: 1;">
        <button type="submit" class="btn btn-primary" style="white-space: nowrap;">➕ Добавить</button>
      </form>
    </div>
  `;
};

window.handleCreateCategory = function() {
  const input = document.getElementById('cat-name-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  const tempId = 'cat_temp_' + Date.now();
  const newCat = { id: tempId, name, status: 'active' };
  
  // Оптимистичное добавление
  state.categories.push(newCat);
  setUI({ modal: 'categories' }); // перерисовка модалки

  api.createCategory({ name }).then(result => {
    const idx = state.categories.findIndex(c => c.id === tempId);
    if (idx !== -1) {
      state.categories[idx] = result;
      setState({ categories: state.categories });
    }
  }).catch(e => {
    showToast('Ошибка при добавлении категории', 'error');
    setState({ categories: state.categories.filter(c => c.id !== tempId) });
  });
};

window.handleDeleteCategory = function(id) {
  if (!confirm('Удалить эту категорию?')) return;
  
  const backup = [...state.categories];
  setState({ categories: state.categories.filter(c => c.id !== id) });

  api.deleteCategory(id).catch(e => {
    showToast('Ошибка при удалении категории', 'error');
    setState({ categories: backup });
  });
};

window.handleQuickCreateCategory = function() {
  const name = prompt("Введите название новой категории:");
  if (!name || !name.trim()) return;
  const tempId = 'cat_temp_' + Date.now();
  const newCat = { id: tempId, name: name.trim(), status: 'active' };
  
  state.categories.push(newCat);
  
  const select = document.getElementById('s-category');
  if (select) {
    const option = document.createElement('option');
    option.value = tempId;
    option.text = newCat.name;
    select.appendChild(option);
    select.value = tempId;
  }

  api.createCategory({ name: name.trim() }).then(result => {
    const idx = state.categories.findIndex(c => c.id === tempId);
    if (idx !== -1) {
      state.categories[idx] = result;
      if (select && select.value === tempId) {
        select.value = result.id;
      }
      if (select) {
        const opt = Array.from(select.options).find(o => o.value === tempId);
        if (opt) opt.value = result.id;
      }
    }
  }).catch(e => {
    showToast('Ошибка при фоновом добавлении категории', 'error');
  });
};
