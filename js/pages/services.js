// ============================================
// services.js — Управление каталогом услуг
// ============================================

window.renderServices = function () {
  const activeTab = state.ui.servicesMainTab || 'services'; // 'services' or 'categories'
  const viewMode = state.ui.servicesViewMode || 'cards';

  // Вкладки главные
  const mainTabsHtml = `
    <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
      <button onclick="setUI({ servicesMainTab: 'services' })" class="btn" style="font-size: 16px; font-weight: 800; border: none; background: transparent; padding: 8px 16px; color: ${activeTab === 'services' ? 'var(--primary)' : 'var(--text-secondary)'}; position: relative;">
        Услуги
        ${activeTab === 'services' ? '<div style="position: absolute; bottom: -13px; left: 0; right: 0; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0;"></div>' : ''}
      </button>
      <button onclick="setUI({ servicesMainTab: 'categories' })" class="btn" style="font-size: 16px; font-weight: 800; border: none; background: transparent; padding: 8px 16px; color: ${activeTab === 'categories' ? 'var(--primary)' : 'var(--text-secondary)'}; position: relative;">
        Виды услуг
        ${activeTab === 'categories' ? '<div style="position: absolute; bottom: -13px; left: 0; right: 0; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0;"></div>' : ''}
      </button>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'categories') {
    // Вкладка "Виды"
    const catsHtml = state.categories.length === 0 ? '<div style="color: var(--text-secondary); text-align: center; padding: 40px;">Виды услуг пока не добавлены</div>' :
      state.categories.map(c => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 12px; transition: all 0.2s;">
          <span style="font-weight: 800; font-size: 15px; color: var(--text);">${c.name}</span>
          <div style="display: flex; gap: 8px;">
            <button onclick="const n = prompt('Новое название вида:', '${c.name}'); if(n && n.trim()) { api.updateCategory('${c.id}', {name: n.trim()}).then(()=>api.getAll().then(d=>setState(d))); }" class="btn btn-secondary" style="padding: 8px; border-radius: 8px;" title="Редактировать">
              <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
            <button onclick="handleDeleteCategory('${c.id}')" class="btn btn-secondary" style="color: #ef4444; background: rgba(239,68,68,0.1); border: none; padding: 8px; border-radius: 8px;" title="Удалить">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `).join('');

    contentHtml = `
      <div class="animate-fade-in">
        <form onsubmit="event.preventDefault(); handleCreateCategory();" style="display: flex; gap: 12px; margin-bottom: 24px; max-width: 600px;">
          <input type="text" id="cat-name-input" class="form-input" placeholder="Введите название нового вида (например: Стрижки, Массаж)..." required style="flex-grow: 1;">
          <button type="submit" class="btn btn-primary" style="white-space: nowrap; padding: 0 24px;"><i data-feather="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i> Создать вид</button>
        </form>
        <div style="max-width: 600px;">
          ${catsHtml}
        </div>
      </div>
    `;

  } else {
    // Вкладка "Услуги"
    // Группировка услуг по Видам
    const collapsedCategories = state.ui.collapsedCategories || {};
    
    // Подготовка структуры для группировки
    const grouped = {};
    state.categories.forEach(c => {
      grouped[c.id] = { name: c.name, items: [] };
    });
    grouped['uncategorized'] = { name: 'Без категории', items: [] };

    state.services.forEach(s => {
      if (s.categoryId && grouped[s.categoryId]) {
        grouped[s.categoryId].items.push(s);
      } else {
        grouped['uncategorized'].items.push(s);
      }
    });

    if (state.services.length === 0) {
      contentHtml = `
        <div class="card p-12 text-center" style="color: var(--text-secondary);">
          <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="inbox" style="width: 56px; height: 56px;"></i></span>
          <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Список услуг пуст</h3>
          <p style="font-size: 14px; margin-bottom: 16px;">Добавьте новую процедуру, чтобы сделать ее доступной для записи</p>
          <button onclick="showCreateServiceModal()" class="btn btn-primary" style="margin: 0 auto;">Добавить услугу</button>
        </div>
      `;
    } else {
      for (const catId in grouped) {
        const group = grouped[catId];
        if (group.items.length === 0) continue; // Не показываем пустые группы

        const isCollapsed = collapsedCategories[catId];
        
        let itemsHtml = '';
        if (!isCollapsed) {
          if (viewMode === 'cards') {
            itemsHtml = `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                ${group.items.map(s => `
                  <div class="card card-hover p-6" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
                    <div>
                      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px;">
                        <h3 style="font-weight: 800; font-size: 16px; color: var(--text);">${s.name}</h3>
                      </div>
                      <p style="font-size: 13px; color: var(--text-secondary); min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px;">
                        ${s.description || 'Описание услуги отсутствует.'}
                      </p>
                    </div>
                    <div>
                      <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 14px; margin-bottom: 14px;">
                        <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600; display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 12px; height: 12px;"></i> ${s.duration} мин</span>
                        <span style="font-weight: 800; font-size: 18px; color: var(--primary);">${formatPrice(s.price)}</span>
                      </div>
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="showEditServiceModal('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; width: auto;"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i></button>
                        <button onclick="handleDeleteService('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15);"><i data-feather="trash-2" style="width: 14px; height: 14px;"></i></button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          } else {
            // Table view
            itemsHtml = `
              <div class="card mt-4" style="overflow: hidden; border-radius: 16px;">
                <div class="data-table-container">
                  <table class="data-table" style="min-width: 800px; width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
                        <th style="padding: 16px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: left;">Услуга</th>
                        <th style="padding: 16px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: left;">Длительность</th>
                        <th style="padding: 16px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: left;">Стоимость</th>
                        <th style="padding: 16px; font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${group.items.map(s => `
                        <tr class="table-row-hover" style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
                          <td style="padding: 16px;">
                            <div style="font-weight: 700; font-size: 14px; color: var(--text);">${s.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.description || 'Нет описания'}</div>
                          </td>
                          <td style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-secondary);">
                              <i data-feather="clock" style="width: 14px; height: 14px; color: var(--primary);"></i> ${s.duration} мин
                            </div>
                          </td>
                          <td style="padding: 16px; font-weight: 800; color: var(--primary); font-size: 15px;">
                            ${formatPrice(s.price)}
                          </td>
                          <td style="padding: 16px; text-align: right;">
                            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                              <button onclick="showEditServiceModal('${s.id}')" class="btn btn-secondary" style="padding: 8px; border-radius: 8px; width: auto;" title="Редактировать">
                                <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                              </button>
                              <button onclick="handleDeleteService('${s.id}')" class="btn btn-secondary" style="padding: 8px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15); background: rgba(239,68,68,0.05);" title="Удалить">
                                <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }
        }

        contentHtml += `
          <div style="margin-bottom: 24px;">
            <div onclick="setUI({ collapsedCategories: { ...state.ui.collapsedCategories, '${catId}': !${isCollapsed} } })" style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
              <i data-feather="${isCollapsed ? 'chevron-right' : 'chevron-down'}" style="width: 20px; height: 20px; color: var(--text-secondary);"></i>
              <h2 style="font-size: 18px; font-weight: 800; margin: 0; color: var(--text);">${group.name} <span style="color: var(--text-secondary); font-size: 14px; font-weight: 600; margin-left: 8px;">(${group.items.length})</span></h2>
            </div>
            ${itemsHtml}
          </div>
        `;
      }
    }
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Виды и Услуги</h1>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          ${activeTab === 'services' ? `
            <div style="display: flex; background: var(--bg-secondary); border-radius: 12px; padding: 4px; border: 1px solid var(--border);">
              <button onclick="setUI({ servicesViewMode: 'cards' })" class="btn" style="padding: 6px 12px; font-size: 12px; width: auto; border: none; background: ${viewMode === 'cards' ? 'var(--bg)' : 'transparent'}; color: ${viewMode === 'cards' ? 'var(--text)' : 'var(--text-secondary)'}; box-shadow: ${viewMode === 'cards' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'}; display: flex; align-items: center; gap: 6px;"><i data-feather="grid" style="width: 14px; height: 14px;"></i> Карточки</button>
              <button onclick="setUI({ servicesViewMode: 'table' })" class="btn" style="padding: 6px 12px; font-size: 12px; width: auto; border: none; background: ${viewMode === 'table' ? 'var(--bg)' : 'transparent'}; color: ${viewMode === 'table' ? 'var(--text)' : 'var(--text-secondary)'}; box-shadow: ${viewMode === 'table' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'}; display: flex; align-items: center; gap: 6px;"><i data-feather="list" style="width: 14px; height: 14px;"></i> Таблица</button>
            </div>
          ` : ''}
          <button onclick="${activeTab === 'services' ? 'showCreateServiceModal()' : 'document.getElementById(\\'cat-name-input\\')?.focus()'}" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;"><i data-feather="plus" style="width: 16px; height: 16px;"></i> ${activeTab === 'services' ? 'Добавить услугу' : 'Добавить вид'}</button>
        </div>
      </div>

      ${mainTabsHtml}

      ${contentHtml}
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
        <div style="display: flex; gap: 12px; width: 100%;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Пол (Категория)</label>
            <select id="s-gender" class="form-select" required>
              <option value="female" ${(isEdit && s.genderCategory === 'female') ? 'selected' : ''}>👩 Женская</option>
              <option value="male" ${(isEdit && s.genderCategory === 'male') ? 'selected' : ''}>👨 Мужская</option>
              <option value="any" ${(isEdit && s.genderCategory === 'any') ? 'selected' : ''}>🧑 Любая</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Вид услуги</label>
            <div style="display: flex; gap: 8px;">
              <select id="s-category" class="form-select" required style="flex-grow: 1;">
                <option value="">Выберите вид...</option>
                ${state.categories.map(c => `<option value="${c.id}" ${(isEdit && s.categoryId === c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
              <button type="button" onclick="handleQuickCreateCategory()" class="btn btn-secondary" style="width: auto; padding: 0 16px; display: flex; align-items: center; justify-content: center; font-size: 16px;">➕</button>
            </div>
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
  const genderCategory = document.getElementById('s-gender').value;
  const categoryId = document.getElementById('s-category').value;
  const categoryName = state.categories.find(c => c.id === categoryId)?.name || '';
  const price = parseFloat(document.getElementById('s-price').value) || 0;
  const duration = parseInt(document.getElementById('s-duration').value, 10) || 60;
  const description = document.getElementById('s-description').value.trim();

  // Оптимистичное обновление
  const tempId = id || 'temp_' + Date.now();
  const serviceData = { id: tempId, name, genderCategory, categoryId, categoryName, price, duration, description, status: 'active' };

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
    api.updateService(id, { name, genderCategory, categoryId, categoryName, price, duration, description }).catch(e => {
      showToast('Ошибка фоновой синхронизации услуги', 'error');
    });
  } else {
    api.createService({ name, genderCategory, categoryId, categoryName, price, duration, description }).then(result => {
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

window.handleCreateCategory = function() {
  const input = document.getElementById('cat-name-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  const tempId = 'cat_temp_' + Date.now();
  const newCat = { id: tempId, name, status: 'active' };
  
  // Оптимистичное добавление
  state.categories.push(newCat);
  setState({ categories: state.categories }); // перерисовка UI

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
