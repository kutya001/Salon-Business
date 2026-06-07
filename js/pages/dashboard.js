// ============================================
// dashboard.js — Панель управления и аналитика
// ============================================

window.toggleDashboardFilters = function() {
  const f = state.ui.dashboardFilters || { periodType: 'today', dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], isOpen: false };
  setUI({
    dashboardFilters: {
      ...f,
      isOpen: !f.isOpen
    }
  });
};

window.setDashboardPeriod = function(type) {
  const todayStr = new Date().toISOString().split('T')[0];
  const f = state.ui.dashboardFilters || {};
  let dateFrom = '';
  let dateTo = '';
  
  if (type === 'today') {
    dateFrom = todayStr;
    dateTo = todayStr;
  }
  
  setUI({
    dashboardFilters: {
      ...f,
      periodType: type,
      dateFrom,
      dateTo
    }
  });
};

window.handleDashboardCustomDate = function() {
  const fromVal = document.getElementById('dash-date-from').value;
  const toVal = document.getElementById('dash-date-to').value;
  const f = state.ui.dashboardFilters || {};
  setUI({
    dashboardFilters: {
      ...f,
      periodType: 'custom',
      dateFrom: fromVal,
      dateTo: toVal
    }
  });
};

window.renderDashboard = function () {
  const todayStr = new Date().toISOString().split('T')[0];
  const userRole = state.userProfile?.role || 'master';
  const loggedInMaster = state.masters.find(m => m.user_id === state.userProfile?.id);
  const masterId = loggedInMaster?.id;
  const useFinance = state.business?.useFinance !== false;

  // Если мастер, показываем только его записи
  const dashboardBookings = userRole === 'master' 
    ? state.bookings.filter(b => b.masterId === masterId)
    : state.bookings;

  // Инициализация фильтров периода
  const filters = state.ui.dashboardFilters || { periodType: 'today', dateFrom: todayStr, dateTo: todayStr, isOpen: false };

  // Фильтруем записи по выбранному периоду
  let periodBookings = [];
  if (filters.periodType === 'today') {
    periodBookings = dashboardBookings.filter(b => b.date === todayStr);
  } else if (filters.periodType === 'custom') {
    periodBookings = dashboardBookings.filter(b => {
      let isOk = true;
      if (filters.dateFrom) isOk = isOk && b.date >= filters.dateFrom;
      if (filters.dateTo) isOk = isOk && b.date <= filters.dateTo;
      return isOk;
    });
  } else {
    // 'all' — все даты
    periodBookings = dashboardBookings;
  }

  // 1. Расчет метрик за период
  const activePeriodBookings = periodBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const completedPeriodBookings = periodBookings.filter(b => b.status === 'completed');

  // Выручка за выбранный период (или весь период)
  let periodRevenue = 0;
  if (useFinance) {
    let periodTransactions = state.transactions.filter(t => t.type === 'income');
    if (filters.periodType === 'today') {
      periodTransactions = periodTransactions.filter(t => t.createdAt.split('T')[0] === todayStr);
    } else if (filters.periodType === 'custom') {
      periodTransactions = periodTransactions.filter(t => {
        const d = t.createdAt.split('T')[0];
        let isOk = true;
        if (filters.dateFrom) isOk = isOk && d >= filters.dateFrom;
        if (filters.dateTo) isOk = isOk && d <= filters.dateTo;
        return isOk;
      });
    }
    periodRevenue = periodTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  } else {
    // Суммарный чек складывается из завершенных записей за период
    periodRevenue = completedPeriodBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  }

  // Количество клиентов, имеющих записи за период
  const periodClientsCount = new Set(periodBookings.map(b => b.clientId).filter(Boolean)).size;

  // Средний чек за период
  const avgCheck = completedPeriodBookings.length > 0 
    ? Math.round(completedPeriodBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0) / completedPeriodBookings.length) 
    : 0;

  // 2. Сбор данных для графиков доходов/записей
  const chartDays = [];
  const chartValues = [];
  
  // Определим диапазон дней для графика
  let dateRange = [];
  if (filters.periodType === 'custom' && filters.dateFrom && filters.dateTo) {
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays >= 2 && diffDays <= 12) {
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(filters.dateFrom);
        d.setDate(d.getDate() + i);
        dateRange.push(d);
      }
    } else if (diffDays > 12) {
      for (let i = 9; i >= 0; i--) {
        const d = new Date(filters.dateTo);
        d.setDate(d.getDate() - i);
        dateRange.push(d);
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(filters.dateFrom);
        d.setDate(d.getDate() - i);
        dateRange.push(d);
      }
    }
  } else {
    const endBaseDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endBaseDate);
      d.setDate(d.getDate() - i);
      dateRange.push(d);
    }
  }

  dateRange.forEach(d => {
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
    chartDays.push(label);

    let val = 0;
    if (useFinance) {
      val = userRole === 'master'
        ? dashboardBookings.filter(b => b.status === 'completed' && b.date === dateStr).reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
        : state.transactions
            .filter(t => t.type === 'income' && t.createdAt.split('T')[0] === dateStr)
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    } else {
      val = dashboardBookings.filter(b => b.status === 'completed' && b.date === dateStr).length;
    }
    chartValues.push(val);
  });

  const maxValue = Math.max(...chartValues, useFinance ? 1000 : 5);

  // 3. Расчет статистики по статусам за период
  const statusStats = {
    pending: { count: 0, sum: 0 },
    confirmed: { count: 0, sum: 0 },
    completed: { count: 0, sum: 0 },
    cancelled: { count: 0, sum: 0 }
  };
  
  periodBookings.forEach(b => {
    const status = b.status || 'pending';
    if (statusStats[status]) {
      statusStats[status].count += 1;
      statusStats[status].sum += parseFloat(b.price) || 0;
    }
  });

  const statsBarHtml = periodBookings.length === 0 ? '' : `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; border-bottom: 1px dashed var(--border); padding-bottom: 16px;">
      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span> Записан
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.pending.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${formatPrice(statusStats.pending.sum)}</div>
      </div>
      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></span> Подтвержден
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.confirmed.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${formatPrice(statusStats.confirmed.sum)}</div>
      </div>
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> Выполнен
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.completed.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: #10b981;">${formatPrice(statusStats.completed.sum)}</div>
      </div>
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444;"></span> Отмена
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.cancelled.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: #ef4444;">${formatPrice(statusStats.cancelled.sum)}</div>
      </div>
    </div>
  `;

  const periodLabel = filters.periodType === 'today' ? 'на сегодня' : 'за выбранный период';
  const periodBookingsListHtml = periodBookings.length === 0 
    ? `
      <div class="card p-12 text-center" style="color: var(--text-secondary); grid-column: 1 / -1; background: transparent; border: none;">
        <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="activity" style="width: 56px; height: 56px;"></i></span>
        <h3 style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">Нет записей ${periodLabel}</h3>
        <p style="font-size: 13px;">Создайте новую запись или измените фильтр периода</p>
      </div>
    `
    : periodBookings.map(b => {
        const time = formatTime(b.time);
        const initials = getInitials(b.clientName);
        const statusColor = getStatusColor(b.status);
        const statusLabel = getStatusLabel(b.status);
        
        let actionBtnHtml = '';
        if (userRole !== 'master') {
          if (b.status === 'pending') {
            actionBtnHtml = `
              <button onclick="handleUpdateBookingStatus('${b.id}', 'confirmed')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto; font-weight: 700; white-space: nowrap;">
                Подтвердить
              </button>
            `;
          } else if (b.status === 'confirmed') {
            actionBtnHtml = `
              <button onclick="handleUpdateBookingStatus('${b.id}', 'completed')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto; background: #10b981; border-color: #10b981; font-weight: 700; white-space: nowrap;">
                Завершить
              </button>
            `;
          }
        }
 
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-grow: 1; min-width: 0;">
              <div style="font-weight: 800; font-size: 12px; color: var(--primary); min-width: 42px; background: rgba(99, 102, 241, 0.1); padding: 3px 6px; border-radius: 6px; text-align: center; flex-shrink: 0;">
                ${time}
              </div>
              <div class="hidden md-flex" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light), var(--primary)); color: white; font-weight: 700; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); flex-shrink: 0;">
                ${initials}
              </div>
              <div style="display: flex; flex-direction: column; md:flex-direction: row; md:align-items: center; gap: 2px; md:gap: 8px; min-width: 0; flex-grow: 1;">
                <h4 style="font-weight: 700; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; md:max-width: 180px;">${b.clientName}</h4>
                <span class="hidden md-inline" style="color: var(--border);">|</span>
                <p style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; md:max-width: 250px; margin: 0;">
                  ${b.serviceName} • <span style="color: var(--primary-light); font-weight: 600;">${b.masterName ? b.masterName.split(' ')[0] : 'Мастер'}</span>
                </p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <div style="display: flex; flex-direction: row; align-items: center; gap: 6px; md:flex-direction: column; md:align-items: flex-end; md:gap: 2px;">
                <span style="font-weight: 800; font-size: 13px; color: var(--text);">${formatPrice(b.price)}</span>
                <span class="badge ${statusColor}" style="font-size: 9px; padding: 2px 6px; height: auto;">${statusLabel}</span>
              </div>
              ${actionBtnHtml ? `<div style="display: flex; align-items: center; flex-shrink: 0;">${actionBtnHtml.replace('padding: 6px 12px;', 'padding: 4px 8px; font-size: 11px;')}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

  // 4. Рейтинг мастеров за выбранный период
  let topMastersHtml = '';
  if (userRole !== 'master') {
    const masterStats = {};
    periodBookings.filter(b => b.status === 'completed').forEach(b => {
      if (!masterStats[b.masterId]) {
        masterStats[b.masterId] = { name: b.masterName || 'Любой мастер', count: 0, revenue: 0 };
      }
      masterStats[b.masterId].count += 1;
      masterStats[b.masterId].revenue += parseFloat(b.price) || 0;
    });
 
    const topMasters = Object.values(masterStats)
      .sort((a, b) => useFinance ? b.revenue - a.revenue : b.count - a.count)
      .slice(0, 5);
 
    topMastersHtml = topMasters.length === 0
      ? `
        <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
          Здесь появится рейтинг лучших мастеров
        </div>
      `
      : topMasters.map((m, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; font-size: 13px; color: var(--primary); min-width: 16px;">#${idx + 1}</span>
            <span style="font-weight: 600; font-size: 13px; color: var(--text);">${m.name}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 13px; color: var(--text);">
              ${useFinance ? formatPrice(m.revenue) : m.count + ' вып. записей'}
            </div>
            ${useFinance ? `<div style="font-size: 11px; color: var(--text-secondary);">${m.count} вып. услуг</div>` : ''}
          </div>
        </div>
      `).join('');
  }

  // Смена кассы отображается только владельцу или менеджеру при фильтре "Текущий день" и включенных финансах
  let shiftBannerHtml = '';
  if (useFinance && (userRole === 'owner' || userRole === 'manager') && filters.periodType === 'today') {
    const activeShift = state.shifts.find(s => s.status === 'open');
    if (activeShift) {
      shiftBannerHtml = `
        <div class="card p-6 animate-scale-in" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(16,185,129,0.1); border-radius: 50%; color: #10b981;">
                <i data-feather="check-circle" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text);">Кассовая смена открыта</div>
                <div style="font-size: 12px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i data-feather="clock" style="width: 12px; height: 12px;"></i> Идет рабочая смена за ${formatDate(activeShift.openedAt || new Date().toISOString())}
                </div>
              </div>
            </div>
            <button onclick="showCloseShiftModal('${activeShift.id}')" class="btn btn-secondary" style="width: auto; color: #ef4444; border-color: rgba(239,68,68,0.2);">Закрыть смену</button>
          </div>
        </div>
      `;
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastShift = state.shifts.find(s => s.openedAt && s.openedAt.startsWith(todayStr));
      let closedTitle = 'Кассовая смена закрыта';
      let closedDesc = 'Финансовые операции приостановлены. Откройте смену.';
      
      if (lastShift) {
        closedTitle = `Кассовая смена за ${formatDate(lastShift.openedAt || todayStr)} закрыта`;
        try {
          if (lastShift.closedAt) {
            const closedTimeStr = formatTime(lastShift.closedAt.split('T')[1] || lastShift.closedAt.split(' ')[1]);
            closedDesc = `Смена закрыта в ${closedTimeStr}. Финансовые операции приостановлены.`;
          }
        } catch(e) {}
      }
      shiftBannerHtml = `
        <div class="card p-6 animate-scale-in" style="display: flex; flex-direction: column; gap: 16px; border-left: 4px solid #ef4444;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(239,68,68,0.1); border-radius: 50%; color: #ef4444;">
                <i data-feather="x-circle" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text);">${closedTitle}</div>
                <div style="font-size: 12px; color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i data-feather="lock" style="width: 12px; height: 12px;"></i> ${closedDesc}
                </div>
              </div>
            </div>
            <button onclick="showOpenShiftModal()" class="btn btn-primary" style="background: #10b981; border-color: #10b981; width: auto;">Открыть смену</button>
          </div>
        </div>
      `;
    }
  }

  // Фильтры панели
  let filtersHtml = '';
  if (filters.isOpen) {
    filtersHtml = `
      <div class="card animate-slide-down" style="padding: 16px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 18px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <!-- Верхняя строка: Текущий день и Весь период -->
        <div style="display: flex; gap: 10px;">
          <button onclick="setDashboardPeriod('today')" class="btn ${filters.periodType === 'today' ? 'btn-primary' : 'btn-secondary'}" style="padding: 8px 16px; font-size: 13px; font-weight: 700; width: auto; height: auto; border-radius: 10px;">
            Текущий день
          </button>
          <button onclick="setDashboardPeriod('all')" class="btn ${filters.periodType === 'all' ? 'btn-primary' : 'btn-secondary'}" style="padding: 8px 16px; font-size: 13px; font-weight: 700; width: auto; height: auto; border-radius: 10px;">
            Весь период
          </button>
        </div>
        
        <!-- Нижняя строка: Даты От и До по горизонтали -->
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">От:</span>
            <input type="date" id="dash-date-from" class="form-input" value="${filters.dateFrom || ''}" onchange="handleDashboardCustomDate()" style="padding: 6px 12px; width: 145px; font-size: 13px; height: auto; border-radius: 10px;">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">До:</span>
            <input type="date" id="dash-date-to" class="form-input" value="${filters.dateTo || ''}" onchange="handleDashboardCustomDate()" style="padding: 6px 12px; width: 145px; font-size: 13px; height: auto; border-radius: 10px;">
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="animate-slide-up" style="display: flex; flex-direction: column; gap: 28px; padding-bottom: 80px;">
      
      <!-- Приветствие и кнопка новой записи -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${shiftBannerHtml}
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; margin: 0;">Главное</h1>
            <button onclick="toggleDashboardFilters()" style="background: none; border: none; cursor: pointer; color: ${filters.isOpen ? 'var(--primary)' : 'var(--text-secondary)'}; padding: 8px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="if(!${filters.isOpen}) this.style.color='var(--text-secondary)'" title="Фильтр по периоду">
              <i data-feather="filter" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">
              ${userRole === 'master' ? 'Обзор ваших показателей' : 'Обзор показателей вашего салона'}
            </p>
            ${userRole !== 'master' ? `
              <button onclick="showCreateBookingModal()" class="hidden md-flex btn btn-primary animate-scale-in" style="align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; width: auto;">
                <i data-feather="plus" style="width: 18px; height: 18px;"></i> Создать запись
              </button>
            ` : ''}
          </div>
        </div>
        ${filtersHtml}
      </div>
 
      <!-- Строка основных показателей -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <div class="stat-card">
          <div class="text-[10px] md:text-[12px] lg:text-[13px]" style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">
            Выручка
          </div>
          <div class="text-[18px] md:text-[22px] lg:text-[26px]" style="font-weight: 800; color: var(--text); margin-top: 2px;">
            ${formatPrice(periodRevenue)}
          </div>
          <div class="text-[10px] md:text-[11px] lg:text-[12px]" style="color: ${useFinance ? '#10b981' : 'var(--primary)'}; font-weight: 600; margin-top: 1px;">
            ${useFinance ? '💰 По кассе' : '📅 По записям'}
          </div>
        </div>
        
        <div class="stat-card">
          <div class="text-[10px] md:text-[12px] lg:text-[13px]" style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Записи за период</div>
          <div class="text-[18px] md:text-[22px] lg:text-[26px]" style="font-weight: 800; color: var(--text); margin-top: 2px;">${activePeriodBookings.length}</div>
          <div class="text-[10px] md:text-[11px] lg:text-[12px]" style="color: var(--text-secondary); font-weight: 600; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Всего: ${periodBookings.length}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-[10px] md:text-[12px] lg:text-[13px]" style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Клиентов в периоде</div>
          <div class="text-[18px] md:text-[22px] lg:text-[26px]" style="font-weight: 800; color: var(--text); margin-top: 2px;">${periodClientsCount}</div>
          <div class="text-[10px] md:text-[11px] lg:text-[12px]" style="color: var(--text-secondary); font-weight: 600; margin-top: 1px;">👤 Уникальных</div>
        </div>
        
        <div class="stat-card">
          <div class="text-[10px] md:text-[12px] lg:text-[13px]" style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Средний чек</div>
          <div class="text-[18px] md:text-[22px] lg:text-[26px]" style="font-weight: 800; color: var(--text); margin-top: 2px;">${formatPrice(avgCheck)}</div>
          <div class="text-[10px] md:text-[11px] lg:text-[12px]" style="color: var(--text-secondary); font-weight: 600; margin-top: 1px;">💳 Выполненный</div>
        </div>
      </div>
  
      <!-- График и Список записей -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- График выручки или записей -->
        <div class="card p-6 ${userRole === 'master' ? 'lg:col-span-3' : 'lg:col-span-2'}" style="display: flex; flex-direction: column; gap: 20px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">
            ${useFinance ? 'Статистика выручки' : 'Статистика выполненных записей'}
          </h3>
          
          <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding: 10px 0; border-bottom: 2px solid var(--border);">
            ${chartValues.map((val, idx) => {
              const pct = (val / maxValue) * 100;
              const label = chartDays[idx];
              const displayVal = useFinance
                ? (val > 0 ? (val >= 1000 ? Math.round(val / 100) / 10 + 'k' : val) : '')
                : (val > 0 ? val : '');
              return `
                <div style="display: flex; flex-direction: column; align-items: center; flex-grow: 1; height: 100%; justify-content: flex-end; gap: 8px;">
                  <div style="font-size: 10px; font-weight: 700; color: var(--text);">${displayVal}</div>
                  <div style="height: ${pct}%; width: 32px; background: linear-gradient(to top, var(--primary), var(--primary-light)); border-radius: 6px 6px 0 0; transition: height 0.5s ease-in-out;"></div>
                  <div style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
 
        ${userRole !== 'master' ? `
        <!-- Рейтинг мастеров -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">
            ${useFinance ? 'Рейтинг мастеров (Выручка)' : 'Рейтинг мастеров (Записи)'}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${topMastersHtml}
          </div>
        </div>
        ` : ''}
      </div>
 
      <!-- Список записей за период -->
      <div class="card p-6">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 14px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">Записи ${periodLabel}</h3>
          <a href="#" onclick="event.preventDefault(); navigate('bookings')" style="font-size: 13px; font-weight: 700; color: var(--primary);">Все записи →</a>
        </div>
        ${statsBarHtml}
        <div style="display: flex; flex-direction: column;">
          ${periodBookingsListHtml}
        </div>
      </div>
      
      <!-- Плавающая кнопка (FAB) -->
      ${userRole !== 'master' ? `
        <button onclick="showCreateBookingModal()" class="md-hidden animate-scale-in" style="position: fixed; bottom: 106px; right: 20px; width: 56px; height: 56px; border-radius: 28px; background: var(--primary); color: white; border: none; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50; transition: transform 0.2s ease;">
          <i data-feather="plus" style="width: 24px; height: 24px;"></i>
        </button>
      ` : ''}
 
    </div>
  `;
};
