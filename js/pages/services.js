// ============================================
// services.js — Управление каталогом услуг (с поддержкой шаблонов)
// ============================================

window.renderServices = function () {
  const activeTab = state.ui.servicesMainTab || 'services'; // 'services', 'categories', or 'templates'
  const viewMode = state.ui.servicesViewMode || 'cards';

  const combinedTabsHtml = `
    <div style="display: flex; justify-content: center; margin-bottom: 24px; width: 100%; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
      <div class="segment-tabs-container" style="display: inline-flex; align-items: center; flex-wrap: nowrap;">
        <button onclick="setUI({ servicesMainTab: 'services' })" class="segment-tab ${activeTab === 'services' ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="Услуги">
          <i data-feather="scissors" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span class="hidden md-inline">Услуги салона</span>
        </button>
        <button onclick="setUI({ servicesMainTab: 'categories' })" class="segment-tab ${activeTab === 'categories' ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="Виды услуг">
          <i data-feather="tag" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span class="hidden md-inline">Виды услуг</span>
        </button>
        <button onclick="setUI({ servicesMainTab: 'templates' })" class="segment-tab ${activeTab === 'templates' ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="Шаблоны">
          <i data-feather="book-open" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span class="hidden md-inline">Шаблоны (50+)</span>
        </button>
        
        ${activeTab === 'services' ? `
          <div style="width: 1px; height: 24px; background: var(--border); margin: 0 4px;"></div>
          
          <button onclick="setUI({ servicesViewMode: 'cards' })" class="segment-tab ${viewMode === 'cards' ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="Карточки">
            <i data-feather="grid" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
            <span class="hidden md-inline">Карточки</span>
          </button>
          <button onclick="setUI({ servicesViewMode: 'table' })" class="segment-tab ${viewMode === 'table' ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="Таблица">
            <i data-feather="list" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
            <span class="hidden md-inline">Таблица</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'categories') {
    // Вкладка "Виды услуг"
    const catsHtml = state.categories.length === 0 ? '<div style="color: var(--text-secondary); text-align: center; padding: 40px;">Виды услуг пока не добавлены</div>' :
      state.categories.map(c => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 12px; transition: all 0.2s;">
          <span style="font-weight: 800; font-size: 15px; color: var(--text);">${c.name}</span>
          <div style="display: flex; gap: 8px;">
            ${hasPermission('services_edit') ? `<button onclick="const n = prompt('Новое название:', '${c.name}'); if(n && n.trim()) { const idx = state.categories.findIndex(x=>x.id==='${c.id}'); if(idx!==-1) { state.categories[idx].name=n.trim(); setState({categories: state.categories}); showToast('Синхронизация...', 'info'); } api.updateCategory('${c.id}', {name: n.trim()}).then(()=>showToast('Сохранено', 'success')).catch(()=>showToast('Ошибка', 'error')); }" class="btn btn-secondary" style="padding: 8px; border-radius: 8px;" title="Редактировать">
              <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
            </button>` : ''}
            ${hasPermission('services_edit') ? `<button onclick="handleDeleteCategory('${c.id}')" class="btn btn-secondary" style="color: #ef4444; background: rgba(239,68,68,0.1); border: none; padding: 8px; border-radius: 8px;" title="Удалить">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>` : ''}
          </div>
        </div>
      `).join('');

    contentHtml = `
      <div class="animate-fade-in">
        ${hasPermission('services_edit') ? `<form onsubmit="event.preventDefault(); handleCreateCategory();" style="display: flex; gap: 12px; margin-bottom: 24px; max-width: 600px;">
          <input type="text" id="cat-name-input" class="form-input" placeholder="Введите название нового вида (например: Стрижки, Массаж)..." required style="flex-grow: 1;">
          <button type="submit" class="btn btn-primary" style="white-space: nowrap; padding: 0 24px;"><i data-feather="plus" style="width: 16px; height: 16px; margin-right: 8px;"></i> Создать вид</button>
        </form>` : ''}
        <div style="max-width: 600px;">
          ${catsHtml}
        </div>
      </div>
    `;

  } else if (activeTab === 'templates') {
    // Вкладка "Шаблоны услуг"
    if (state.ui.templatesDraft === null || state.ui.templatesDraft === undefined) {
      state.ui.templatesDraft = state.services
        .map(s => s.global_service_id)
        .filter(Boolean);
    }
    const draft = state.ui.templatesDraft || [];
    const collapsedGroups = state.ui.collapsedTemplateCategories || {};

    const groupedTemplates = {};
    state.globalCategories.forEach(gc => {
      groupedTemplates[gc.id] = { name: gc.name, items: [] };
    });
    state.globalServices.forEach(gs => {
      if (groupedTemplates[gs.category_id]) {
        groupedTemplates[gs.category_id].items.push(gs);
      }
    });

    const currentActive = state.services
      .map(s => s.global_service_id)
      .filter(Boolean);
    const toAdd = draft.filter(id => !currentActive.includes(id));
    const toRemove = currentActive.filter(id => !draft.includes(id));
    const hasChanges = toAdd.length > 0 || toRemove.length > 0;
    const totalChangesCount = toAdd.length + toRemove.length;

    let savePanelHtml = '';
    if (hasPermission('services_edit')) {
      savePanelHtml = `
        <div class="card shadow-lg" style="padding: 16px 20px; background: ${hasChanges ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${hasChanges ? 'var(--primary)' : 'var(--border)'}; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="flex-grow: 1; min-width: 200px;">
            <h3 style="font-weight: 800; font-size: 15px; color: var(--text); display: flex; align-items: center; gap: 8px; margin: 0;">
              <i data-feather="book-open" style="width: 18px; height: 18px; color: var(--primary);"></i> Выбор шаблонов услуг (50+)
            </h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0; line-height: 1.4;">
              ${hasChanges 
                ? `Несохраненные изменения: <b>+${toAdd.length}</b> добавлено, <b>-${toRemove.length}</b> удалено. Нажмите «Сохранить», чтобы применить.` 
                : 'Отметьте нужные шаблоны галочками и нажмите кнопку сохранения.'}
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${hasChanges ? `
              <button onclick="setUI({ templatesDraft: null })" class="btn btn-secondary" style="width: auto; padding: 10px 18px; font-weight: 700; border-color: rgba(239,68,68,0.2); color: #ef4444; border-radius: 12px; height: auto;">
                Сбросить
              </button>
            ` : ''}
            <button onclick="handleSaveTemplates()" class="btn ${hasChanges ? 'btn-primary animate-pulse' : 'btn-secondary'}" ${!hasChanges ? 'disabled' : ''} style="width: auto; padding: 10px 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; border-radius: 12px; height: auto;">
              <i data-feather="save" style="width: 16px; height: 16px;"></i> Сохранить
            </button>
          </div>
        </div>
      `;
    }

    let templatesHtml = '';
    for (const gcId in groupedTemplates) {
      const group = groupedTemplates[gcId];
      if (group.items.length === 0) continue;

      const isCollapsed = !!collapsedGroups[gcId];
      const serviceIds = group.items.map(gs => gs.id);
      const selectedInGroup = serviceIds.filter(id => draft.includes(id));
      const isAllSelected = serviceIds.every(id => draft.includes(id));
      const isSomeSelected = selectedInGroup.length > 0 && !isAllSelected;

      let itemsListHtml = '';
      if (!isCollapsed) {
        itemsListHtml = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style="margin-top: 12px; animation: fadeIn 0.2s ease-out;">
            ${group.items.map(gs => {
              const isActive = draft.includes(gs.id);
              return `
                <div class="card glass-island" style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-radius: 16px; border: 1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}; background: ${isActive ? 'rgba(99,102,241,0.03)' : 'rgba(255,255,255,0.01)'}; transition: all 0.2s ease;">
                  <div>
                    <div style="font-weight: 800; font-size: 14px; color: var(--text);">${gs.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: flex; gap: 12px; font-weight: 500;">
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 12px; height: 12px; color: var(--primary);"></i> ${gs.duration} мин</span>
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-feather="dollar-sign" style="width: 12px; height: 12px; color: var(--primary);"></i> ${formatPrice(gs.price)}</span>
                    </div>
                  </div>
                  <div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                      <input type="checkbox" ${isActive ? 'checked' : ''} onchange="handleToggleTemplateDraft('${gs.id}', this.checked)"
                        style="opacity: 0; width: 0; height: 0; display: none;">
                      <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; transition: .3s; border-radius: 24px; border: 1px solid var(--border); display: block;">
                        <span style="position: absolute; content: ''; height: 16px; width: 16px; left: ${isActive ? '23px' : '3px'}; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; display: block; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                      </span>
                    </label>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      const chevronIcon = isCollapsed ? 'chevron-right' : 'chevron-down';

      templatesHtml += `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 14px; padding: 10px 16px; flex-wrap: wrap;">
            <!-- Левая часть: Сворачивание и Название -->
            <div onclick="toggleTemplateGroupCollapse('${gcId}')" style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; min-width: 200px;">
              <i data-feather="${chevronIcon}" style="width: 18px; height: 18px; color: var(--text-secondary);"></i>
              <h2 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em;">
                ${group.name} <span style="color: var(--text-secondary); font-size: 13px; font-weight: 600; text-transform: none; letter-spacing: 0;">(${selectedInGroup.length} из ${group.items.length})</span>
              </h2>
            </div>
            
            <!-- Правая часть: Выбор всей группы разом -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <label for="grp-select-all-${gcId}" style="font-size: 12px; font-weight: 700; color: var(--text-secondary); cursor: pointer; user-select: none;">Выбрать все</label>
              <input type="checkbox" id="grp-select-all-${gcId}" ${isAllSelected ? 'checked' : ''} onchange="handleToggleTemplateGroupAll('${gcId}', this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; ${isSomeSelected ? 'opacity: 0.6;' : ''}">
            </div>
          </div>
          ${itemsListHtml}
        </div>
      `;
    }

    contentHtml = `
      <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
        ${savePanelHtml}
        ${templatesHtml}
      </div>
    `;

  } else {
    // Вкладка "Услуги салона"
    const collapsedCategories = state.ui.collapsedCategories || {};
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
          <p style="font-size: 14px; margin-bottom: 16px;">Добавьте индивидуальную процедуру или выберите готовые в разделе «Шаблоны».</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="showCreateServiceModal()" class="btn btn-primary">Добавить услугу</button>
            <button onclick="setUI({ servicesMainTab: 'templates' })" class="btn btn-secondary">Использовать шаблоны</button>
          </div>
        </div>
      `;
    } else {
      for (const catId in grouped) {
        const group = grouped[catId];
        if (group.items.length === 0) continue;

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
                        <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600; display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 12px; height: 12px;"></i> ${s.duration}</span>
                        <span style="font-weight: 800; font-size: 18px; color: var(--primary);">${formatPrice(s.price)}</span>
                      </div>
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        ${hasPermission('services_edit') ? `<button onclick="showEditServiceModal('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; width: auto;"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i></button>` : ''}
                        ${hasPermission('services_delete') ? `<button onclick="handleDeleteService('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15);"><i data-feather="trash-2" style="width: 14px; height: 14px;"></i></button>` : ''}
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
                              <i data-feather="clock" style="width: 14px; height: 14px; color: var(--primary);"></i> ${s.duration}
                            </div>
                          </td>
                          <td style="padding: 16px; font-weight: 800; color: var(--primary); font-size: 15px;">
                            ${formatPrice(s.price)}
                          </td>
                          <td style="padding: 16px; text-align: right;">
                            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                              ${hasPermission('services_edit') ? `<button onclick="showEditServiceModal('${s.id}')" class="btn btn-secondary" style="padding: 8px; border-radius: 8px; width: auto;" title="Редактировать">
                                <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                              </button>` : ''}
                              ${hasPermission('services_delete') ? `<button onclick="handleDeleteService('${s.id}')" class="btn btn-secondary" style="padding: 8px; border-radius: 8px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.15); background: rgba(239,68,68,0.05);" title="Удалить">
                                <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                              </button>` : ''}
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

  const fabAction = activeTab === 'services' ? 'showCreateServiceModal()' : activeTab === 'categories' ? `document.getElementById('cat-name-input')?.focus()` : '';

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 80px;">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Виды и Услуги</h1>
          ${activeTab !== 'templates' && hasPermission('services_edit') ? `
            <button onclick="${fabAction}" class="hidden md-flex btn btn-primary animate-scale-in" style="align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;">
              <i data-feather="plus" style="width: 16px; height: 16px;"></i> ${activeTab === 'services' ? 'Добавить услугу' : 'Добавить вид'}
            </button>
          ` : ''}
        </div>
      </div>

      ${combinedTabsHtml}

      ${contentHtml}

      <!-- Плавающая кнопка (FAB) -->
      <!-- Плавающая кнопка (FAB) -->
      ${activeTab !== 'templates' && hasPermission('services_edit') ? `
        <button onclick="${fabAction}" class="md-hidden animate-scale-in" style="position: fixed; bottom: 106px; right: 20px; width: 56px; height: 56px; border-radius: 28px; background: var(--primary); color: white; border: none; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50; transition: transform 0.2s ease;">
          <i data-feather="plus" style="width: 24px; height: 24px;"></i>
        </button>
      ` : ''}
    </div>
  `;
};

window.handleToggleTemplateDraft = function (globalServiceId, isChecked) {
  let draft = [...(state.ui.templatesDraft || [])];
  if (isChecked) {
    if (!draft.includes(globalServiceId)) {
      draft.push(globalServiceId);
    }
  } else {
    draft = draft.filter(id => id !== globalServiceId);
  }
  setUI({ templatesDraft: draft });
};

window.toggleTemplateGroupCollapse = function (gcId) {
  const collapsed = { ...(state.ui.collapsedTemplateCategories || {}) };
  collapsed[gcId] = !collapsed[gcId];
  setUI({ collapsedTemplateCategories: collapsed });
};

window.handleToggleTemplateGroupAll = function (gcId, isChecked) {
  const draft = [...(state.ui.templatesDraft || [])];
  const groupServices = state.globalServices.filter(gs => gs.category_id === gcId);
  const serviceIds = groupServices.map(gs => gs.id);

  let newDraft;
  if (isChecked) {
    newDraft = Array.from(new Set([...draft, ...serviceIds]));
  } else {
    newDraft = draft.filter(id => !serviceIds.includes(id));
  }
  setUI({ templatesDraft: newDraft });
};

window.handleSaveTemplates = async function () {
  const draft = state.ui.templatesDraft || [];
  const currentActive = state.services
    .map(s => s.global_service_id)
    .filter(Boolean);
  
  const toAdd = draft.filter(id => !currentActive.includes(id));
  const toRemove = currentActive.filter(id => !draft.includes(id));
  
  if (toAdd.length === 0 && toRemove.length === 0) {
    showToast('Нет изменений для сохранения', 'info');
    return;
  }
  
  setUI({ loading: true });
  showToast('Сохранение шаблонов...', 'info');
  
  try {
    const promises = [];
    toAdd.forEach(id => promises.push(api.toggleGlobalService(id, true)));
    toRemove.forEach(id => promises.push(api.toggleGlobalService(id, false)));
    
    await Promise.all(promises);
    
    showToast('Шаблоны успешно сохранены!', 'success');
    
    const allData = await api.getAll({ background: true });
    setState({
      services: allData.services || [],
      categories: allData.categories || []
    });
    
    setUI({ templatesDraft: null });
  } catch (err) {
    showToast(err.message || 'Ошибка сохранения шаблонов', 'error');
    setUI({ templatesDraft: null });
  } finally {
    setUI({ loading: false });
  }
};

window.handleSelectCategory = function (cat) {
  setUI({ selectedCategory: cat });
};

window.showCreateServiceModal = function () {
  setUI({ modal: 'createService', modalData: null });
};

window.showEditServiceModal = function (id) {
  const service = state.services.find(s => s.id === id);
  if (!service) return;
  setUI({ modal: 'createService', modalData: service });
};

window.renderServiceModal = function () {
  const s = state.ui.modalData;
  const isEdit = !!s;

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
            <input type="time" id="s-duration" class="form-input" value="${isEdit ? s.duration : '01:00'}" required>
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

window.handleServiceSubmit = function (id) {
  const name = document.getElementById('s-name').value.trim();
  const genderCategory = document.getElementById('s-gender').value;
  const categoryId = document.getElementById('s-category').value;
  const categoryName = state.categories.find(c => c.id === categoryId)?.name || '';
  const price = parseFloat(document.getElementById('s-price').value) || 0;
  const duration = document.getElementById('s-duration').value || '01:00';
  const description = document.getElementById('s-description').value.trim();

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

  if (id) {
    api.updateService(id, { name, genderCategory, categoryId, categoryName, price, duration, description }).catch(e => {
      showToast('Ошибка фоновой синхронизации услуги', 'error');
    });
  } else {
    api.createService({ name, genderCategory, categoryId, categoryName, price, duration, description }).then(result => {
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

window.handleDeleteService = function (id) {
  if (!confirm('Вы действительно хотите удалить эту услугу из каталога?')) return;
  
  const backup = [...state.services];
  const services = state.services.filter(s => s.id !== id);
  setState({ services });
  showToast('Услуга удалена из списка', 'success');

  api.deleteService(id).catch(e => {
    showToast('Не удалось удалить услугу на сервере', 'error');
    setState({ services: backup });
  });
};

window.handleCreateCategory = function() {
  const input = document.getElementById('cat-name-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  const tempId = 'cat_temp_' + Date.now();
  const newCat = { id: tempId, name, status: 'active' };
  
  state.categories.push(newCat);
  setState({ categories: state.categories });

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
