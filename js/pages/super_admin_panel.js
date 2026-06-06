// ============================================
// super_admin_panel.js — Панель управления суперадминистратора
// ============================================

if (state.ui.editingUserId === undefined) state.ui.editingUserId = null;
if (state.ui.adminEditUsername === undefined) state.ui.adminEditUsername = '';
if (state.ui.adminEditRole === undefined) state.ui.adminEditRole = '';
if (state.ui.adminEditPassword === undefined) state.ui.adminEditPassword = '';

window.renderSuperAdminPanel = function () {
  const businesses = state.allBusinesses || [];
  const users = state.allUsers || [];
  const editingId = state.ui.editingUserId;

  const salonsListHtml = businesses.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 20px; background: rgba(255,255,255,0.01); border-radius: 12px; border: 1px dashed var(--border);">
      Нет зарегистрированных салонов
    </div>
  ` : businesses.map(biz => `
    <div class="card glass-island" style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.01);">
      <div>
        <div style="font-weight: 800; font-size: 14px; color: var(--text);">${biz.name}</div>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">ID: ${biz.id}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 12px; color: var(--text-secondary);">Владелец: </span>
        <span style="font-weight: 700; font-size: 12px; color: var(--primary);">${biz.profiles?.username || 'Неизвестен'}</span>
      </div>
    </div>
  `).join('');

  const usersListHtml = users.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 20px; background: rgba(255,255,255,0.01); border-radius: 12px; border: 1px dashed var(--border);">
      Нет зарегистрированных пользователей
    </div>
  ` : users.map(user => {
    const isEditing = editingId === user.id;

    if (isEditing) {
      return `
        <div class="card" style="padding: 16px; border: 2px solid var(--primary); border-radius: 16px; background: rgba(118,75,162,0.05); display: flex; flex-direction: column; gap: 12px;">
          <div style="font-weight: 800; font-size: 13px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">Редактирование пользователя</div>
          
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px;">
              <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Логин</label>
              <input type="text" id="edit-username" value="${state.ui.adminEditUsername}" onchange="setUI({adminEditUsername: this.value})"
                style="width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; background:#fff; color:#1a1a2e; box-sizing:border-box;">
            </div>
            
            <div style="flex: 1; min-width: 140px;">
              <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Роль</label>
              <select id="edit-role" onchange="setUI({adminEditRole: this.value})"
                style="width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; background:#fff; color:#1a1a2e; cursor:pointer; box-sizing:border-box;">
                <option value="owner" ${state.ui.adminEditRole === 'owner' ? 'selected' : ''}>owner (Владелец)</option>
                <option value="manager" ${state.ui.adminEditRole === 'manager' ? 'selected' : ''}>manager (Менеджер)</option>
                <option value="master" ${state.ui.adminEditRole === 'master' ? 'selected' : ''}>master (Мастер)</option>
                <option value="super_admin" ${state.ui.adminEditRole === 'super_admin' ? 'selected' : ''}>super_admin (Админ)</option>
              </select>
            </div>
          </div>

          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Новый пароль (оставьте пустым, если не хотите менять)</label>
            <input type="password" id="edit-password" value="${state.ui.adminEditPassword}" onchange="setUI({adminEditPassword: this.value})" placeholder="Минимум 6 символов"
              style="width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--border); font-size:13px; background:#fff; color:#1a1a2e; box-sizing:border-box;">
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
            <button onclick="saveAdminUserEdit('${user.id}')" class="btn btn-primary" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; background: #34d399; color: white;">
              Сохранить
            </button>
            <button onclick="setUI({editingUserId: null})" class="btn btn-secondary" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--text-secondary);">
              Отмена
            </button>
          </div>
        </div>
      `;
    }

    const roleBadgeColor = user.role === 'super_admin' ? '#ef4444' : user.role === 'owner' ? '#764ba2' : user.role === 'manager' ? '#3b82f6' : '#10b981';
    
    return `
      <div class="card glass-island" style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.01);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 14px; color: var(--text);">${user.username}</span>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 8px; color: white; background: ${roleBadgeColor}; text-transform: uppercase;">
              ${user.role}
            </span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">ID: ${user.id}</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="startAdminUserEdit('${user.id}', '${user.username}', '${user.role}')" class="btn btn-secondary" style="padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: var(--primary); border-color: rgba(118,75,162,0.2); background: rgba(118,75,162,0.02);">
            Редактировать
          </button>
          ${user.role !== 'super_admin' ? `
            <button onclick="deleteAdminUser('${user.id}', '${user.username}')" class="btn btn-secondary" style="padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.02);">
              Удалить
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 24px 0; display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h1 style="font-weight: 800; font-size: 24px; color: var(--text); display: flex; align-items: center; gap: 8px;">
          <i data-feather="shield" style="color: var(--primary);"></i> Панель Суперадминистратора
        </h1>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Глобальное управление салонами красоты, справочниками и учетными записями пользователей.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 24px; @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }">
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h2 style="font-weight: 700; font-size: 16px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <i data-feather="users" style="width: 18px; height: 18px; color: var(--primary);"></i> Пользователи системы
          </h2>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${usersListHtml}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <h2 style="font-weight: 700; font-size: 16px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            <i data-feather="briefcase" style="width: 18px; height: 18px; color: var(--primary);"></i> Салоны красоты
          </h2>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${salonsListHtml}
          </div>
        </div>

      </div>
    </div>
  `;
};

window.startAdminUserEdit = function (userId, username, role) {
  setUI({
    editingUserId: userId,
    adminEditUsername: username,
    adminEditRole: role,
    adminEditPassword: ''
  });
};

window.saveAdminUserEdit = async function (userId) {
  const username = state.ui.adminEditUsername.trim();
  const role = state.ui.adminEditRole;
  const password = state.ui.adminEditPassword.trim();

  if (!username) {
    showToast('Логин не может быть пустым', 'error');
    return;
  }

  setUI({ loading: true });
  try {
    await api.adminUpdateUser(userId, username, role, password);
    showToast('Пользователь успешно сохранен!', 'success');
    setUI({ editingUserId: null });
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      allUsers: allData.allUsers || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка обновления пользователя', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.deleteAdminUser = async function (userId, username) {
  if (!confirm(`Вы действительно хотите безвозвратно удалить пользователя "${username}"?`)) return;

  setUI({ loading: true });
  try {
    await api.adminDeleteUser(userId);
    showToast('Пользователь удален', 'success');
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      allUsers: allData.allUsers || [],
      allBusinesses: allData.allBusinesses || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка удаления пользователя', 'error');
  } finally {
    setUI({ loading: false });
  }
};
