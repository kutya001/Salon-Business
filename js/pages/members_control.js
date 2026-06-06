// ============================================
// members_control.js — Управление сотрудниками для владельцев
// ============================================

window.renderMembersControl = function () {
  const applications = state.jobApplications || [];

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');

  // Отрисовка заявок на рассмотрении
  const pendingHtml = pendingApps.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 24px; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
      <p style="font-size: 13px; margin: 0;">Новых заявок на вступление нет</p>
    </div>
  ` : pendingApps.map(app => {
    const roleText = app.role === 'manager' ? 'Менеджер' : 'Мастер';
    return `
      <div class="card" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.2); border-radius: 16px;">
        <div>
          <div style="font-weight: 800; font-size: 15px; color: var(--text);">${app.profiles?.username || 'Сотрудник'}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Должность: <span style="font-weight: 700; color: var(--primary);">${roleText}</span></div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'approved')" class="btn btn-primary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; background: #34d399; color: white;">
            Одобрить
          </button>
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'rejected')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2);">
            Отклонить
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Отрисовка действующих сотрудников
  const approvedHtml = approvedApps.length === 0 ? `
    <div style="color: var(--text-secondary); text-align: center; padding: 24px; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
      <p style="font-size: 13px; margin: 0;">В салоне пока нет одобренных сотрудников</p>
    </div>
  ` : approvedApps.map(app => {
    const roleText = app.role === 'manager' ? 'Менеджер' : 'Мастер';
    return `
      <div class="card glass-island" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);">
        <div>
          <div style="font-weight: 800; font-size: 15px; color: var(--text);">${app.profiles?.username || 'Сотрудник'}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Должность: <span style="font-weight: 700; color: var(--primary);">${roleText}</span></div>
        </div>
        <div>
          <button onclick="handleJobApplication('${app.id}', '${app.user_id}', '${app.role}', '${app.profiles?.username}', 'rejected')" class="btn btn-secondary" style="padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.02);">
            Исключить
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 24px 0; display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h1 style="font-weight: 800; font-size: 24px; color: var(--text); display: flex; align-items: center; gap: 8px;">
          <i data-feather="user-plus" style="color: var(--primary);"></i> Управление персоналом
        </h1>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Обрабатывайте входящие заявки от мастеров и менеджеров и управляйте списком сотрудников салона.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h2 style="font-weight: 700; font-size: 15px; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <i data-feather="clock" style="width: 16px; height: 16px;"></i> Заявки на рассмотрении
        </h2>
        ${pendingHtml}
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
        <h2 style="font-weight: 700; font-size: 15px; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <i data-feather="check-circle" style="width: 16px; height: 16px;"></i> Действующие сотрудники
        </h2>
        ${approvedHtml}
      </div>
    </div>
  `;
};

window.handleJobApplication = async function (memberId, userId, role, username, status) {
  setUI({ loading: true });
  try {
    const activeId = state.ui.activeBusinessId;
    await api.respondToJobApplication(memberId, activeId, userId, role, username, status);
    showToast(status === 'approved' ? 'Заявка успешно одобрена!' : 'Сотрудник исключен/отклонен', 'success');
    
    // Перезапрашиваем данные
    const allData = await api.getAll();
    setState({
      jobApplications: allData.jobApplications || [],
      masters: allData.masters || []
    });
  } catch (err) {
    showToast(err.message || 'Ошибка обработки заявки', 'error');
  } finally {
    setUI({ loading: false });
  }
};
