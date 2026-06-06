// ============================================
// job_search.js — Поиск салонов и подача заявок для сотрудников
// ============================================

if (state.ui.salonSearchQuery === undefined) state.ui.salonSearchQuery = '';

window.renderJobSearch = function () {
  const query = state.ui.salonSearchQuery.toLowerCase();
  const salons = state.allSalons || [];
  const employments = state.myEmployments || [];

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(query)
  );

  const listHtml = filteredSalons.length === 0 ? `
    <div class="card text-center" style="padding: 40px; background: var(--bg-secondary); border-radius: 20px;">
      <i data-feather="search" style="width: 48px; height: 48px; color: var(--text-secondary); margin: 0 auto 12px; display: block;"></i>
      <h3 style="font-weight: 700; font-size: 16px; color: var(--text);">Салоны не найдены</h3>
      <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Попробуйте изменить поисковый запрос</p>
    </div>
  ` : filteredSalons.map(salon => {
    // Проверяем статус заявки в этот салон
    const emp = employments.find(e => e.business_id === salon.id);
    let actionButton = '';
    
    if (emp) {
      if (emp.status === 'approved') {
        actionButton = `
          <span style="background: rgba(52,211,153,0.15); color: #34d399; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(52,211,153,0.3); display: inline-flex; align-items: center; gap: 4px;">
            <i data-feather="check" style="width: 14px; height: 14px;"></i> Сотрудник
          </span>
        `;
      } else if (emp.status === 'pending') {
        actionButton = `
          <span style="background: rgba(251,191,36,0.15); color: #fbbf24; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(251,191,36,0.3); display: inline-flex; align-items: center; gap: 4px;">
            <i data-feather="clock" style="width: 14px; height: 14px;"></i> На рассмотрении
          </span>
        `;
      } else {
        actionButton = `
          <span style="background: rgba(239,68,68,0.15); color: #ef4444; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(239,68,68,0.3); display: inline-flex; align-items: center; gap: 4px;">
            <i data-feather="x" style="width: 14px; height: 14px;"></i> Отклонено
          </span>
        `;
      }
    } else {
      actionButton = `
        <button onclick="submitJobApplication('${salon.id}')" class="btn btn-primary" style="padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <i data-feather="send" style="width: 14px; height: 14px;"></i> Отправить заявку
        </button>
      `;
    }

    return `
      <div class="card glass-island" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); transition: transform 0.2s;">
        <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
          <h3 style="font-weight: 800; font-size: 16px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${salon.name}</h3>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary);">
            <i data-feather="user" style="width: 12px; height: 12px;"></i>
            <span>Владелец: ${salon.profiles?.username || 'Неизвестен'}</span>
          </div>
        </div>
        <div>
          ${actionButton}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 24px 0; display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h1 style="font-weight: 800; font-size: 24px; color: var(--text); display: flex; align-items: center; gap: 8px;">
          <i data-feather="briefcase" style="color: var(--primary);"></i> Трудоустройство
        </h1>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Найдите салон красоты и отправьте заявку на работу, чтобы получить доступ к его расписанию.</p>
      </div>

      <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 12px; border-radius: 16px; background: var(--bg-secondary); border: 1px solid var(--border);">
        <i data-feather="search" style="color: var(--text-secondary); width: 20px; height: 20px;"></i>
        <input type="text" placeholder="Поиск салона по названию..." value="${state.ui.salonSearchQuery}" oninput="setUI({ salonSearchQuery: this.value })"
          style="background: transparent; border: none; outline: none; width: 100%; color: var(--text); font-size: 14px;">
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h2 style="font-weight: 700; font-size: 15px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Доступные салоны</h2>
        ${listHtml}
      </div>
    </div>
  `;
};

window.submitJobApplication = async function (businessId) {
  const role = state.userProfile?.role || 'master';
  setUI({ loading: true });
  try {
    await api.applyForJob(businessId, role);
    showToast('Заявка успешно отправлена!', 'success');
    const allData = await api.getAll();
    setState({ 
      myEmployments: allData.myEmployments || [] 
    });
  } catch (err) {
    showToast(err.message || 'Ошибка при отправке заявки', 'error');
  } finally {
    setUI({ loading: false });
  }
};
