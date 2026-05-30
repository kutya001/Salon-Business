// ============================================
// masters.js — Управление мастерами салона
// ============================================

window.renderMasters = function () {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

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
                <p style="font-size: 12px; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">${m.specialization}</p>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 12px 0; display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Телефон:</span>
                <span style="font-weight: 600;">${m.phone}</span>
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

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 28px;">
      
      <!-- Заголовок -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;"><i data-feather="star" style="width: 28px; height: 28px;"></i> Мастера и расписание</h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Управление командой профессионалов и расчетом заработных плат</p>
        </div>
        <button onclick="showCreateMasterModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;">
          <i data-feather="plus" style="width: 16px; height: 16px;"></i> Добавить
        </button>
      </div>

      <!-- Сетка карточек -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${masterCardsHtml}
      </div>

    </div>
  `;
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
    const t = s.categoryName || 'Другое';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(s);
  });

  let svcsHtml = '';
  for (const typeName in grouped) {
    svcsHtml += `<h4 style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-top: 12px; margin-bottom: 8px;">${typeName}</h4>`;
    svcsHtml += grouped[typeName].map(s => {
      const isSelected = selectedServices.includes(s.id);
      return `
        <div onclick="toggleMasterService('${s.id}')" style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; cursor: pointer; background: ${isSelected ? 'rgba(99,102,241,0.05)' : 'var(--bg)'};">
          <input type="checkbox" onchange="event.stopPropagation(); toggleMasterService('${s.id}');" ${isSelected ? 'checked' : ''} style="accent-color: var(--primary); width: 16px; height: 16px; cursor: pointer;">
          <div style="flex: 1; font-weight: 600; font-size: 13px;">${s.name}</div>
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

      <form id="master-form" onsubmit="event.preventDefault(); handleMasterSubmit('${isEdit ? m.id : ''}');" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 60vh; padding-right: 4px;">
        <div class="form-group">
          <label class="form-label">ФИО мастера</label>
          <input type="text" id="m-name" class="form-input" placeholder="Алина Бакиева" value="${isEdit ? m.name : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Номер телефона</label>
          <input type="tel" id="m-phone" class="form-input" placeholder="+996 555 111 222" value="${isEdit ? m.phone : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Специализация (категория)</label>
          <select id="m-specialization" class="form-select" required>
            <option value="">Выберите специализацию...</option>
            ${state.categories.map(c => `<option value="${c.name}" ${(isEdit && m.specialization === c.name) ? 'selected' : ''}>${c.name}</option>`).join('')}
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
          <input type="number" id="m-percentage" class="form-input" placeholder="40" min="0" max="100" value="${isEdit ? m.percentage : '40'}" required>
        </div>
        
        <div style="display: flex; gap: 12px; width: 100%;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Начало работы</label>
            <input type="time" id="m-hours-start" class="form-input" value="${isEdit ? formatMasterTime(m.workHoursStart) : '09:00'}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Конец работы</label>
            <input type="time" id="m-hours-end" class="form-input" value="${isEdit ? formatMasterTime(m.workHoursEnd) : '20:00'}" required>
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
window.handleMasterSubmit = async function (id) {
  const name = document.getElementById('m-name').value.trim();
  const phone = document.getElementById('m-phone').value.trim();
  const specialization = document.getElementById('m-specialization').value;
  const percentage = parseFloat(document.getElementById('m-percentage').value) || 40;
  const workHoursStart = document.getElementById('m-hours-start').value;
  const workHoursEnd = document.getElementById('m-hours-end').value;
  const services = JSON.stringify(state.ui.modalData.services || []);

  setUI({ loading: true });
  try {
    let result;
    if (id) {
      // Редактирование
      result = await api.updateMaster(id, { name, phone, specialization, percentage, workHoursStart, workHoursEnd, services });
      const idx = state.masters.findIndex(m => m.id === id);
      if (idx !== -1) {
        state.masters[idx] = result;
      }
      showToast('Мастер успешно обновлен', 'success');
    } else {
      // Создание нового
      result = await api.createMaster({ name, phone, specialization, percentage, workHoursStart, workHoursEnd, services });
      state.masters.push(result);
      showToast('Мастер успешно добавлен!', 'success');
    }

    setUI({ modal: null, modalData: null });
  } catch(e) {
    showToast('Ошибка при сохранении', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Мягкое удаление мастера
window.handleDeleteMaster = async function (id) {
  if (!confirm('Вы уверены, что хотите удалить этого мастера? Это действие нельзя отменить.')) return;
  
  setUI({ loading: true });
  try {
    await api.deleteMaster(id);
    const masters = state.masters.filter(m => m.id !== id);
    setState({ masters });
    showToast('Мастер удален', 'success');
  } catch(e) {
    showToast('Ошибка при удалении', 'error');
  } finally {
    setUI({ loading: false });
  }
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
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            ${getInitials(m.name)}
          </div>
          <div>
            <h3 style="font-weight: 800; font-size: 20px; color: var(--text); margin: 0;">${m.name}</h3>
            <p style="font-size: 13px; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">${m.specialization}</p>
          </div>
        </div>
        <button onclick="setUI({ modal: null, modalData: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);"><i data-feather="x"></i></button>
      </div>

      <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px; border: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Телефон</div>
          <a href="tel:${m.phone}" style="font-size: 14px; font-weight: 600; color: var(--primary); text-decoration: none;">${m.phone}</a>
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
        <div style="padding: 12px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
          ${(() => {
            let mServicesArray = [];
            try { mServicesArray = typeof m.services === 'string' ? JSON.parse(m.services) : (m.services || []); } catch(e) {}
            const providedServices = (state.services || []).filter(s => mServicesArray.includes(s.id));
            return providedServices.length > 0 
              ? providedServices.map(s => `<span style="display: inline-block; padding: 4px 8px; background: rgba(99,102,241,0.1); color: var(--primary); font-size: 11px; font-weight: 700; border-radius: 6px; margin: 0 4px 4px 0;">${s.name}</span>`).join('')
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
    </div>
  `;
};
