// ============================================
// dashboard.js — Панель управления и аналитика
// ============================================

window.renderDashboard = function () {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Расчет метрик
  const todayBookings = state.bookings.filter(b => b.date === todayStr);
  const activeTodayBookings = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  
  const completedBookings = state.bookings.filter(b => b.status === 'completed');
  
  // Выручка за сегодня
  const todayRevenue = state.transactions
    .filter(t => t.type === 'income' && t.createdAt.split('T')[0] === todayStr)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // Общее количество клиентов
  const totalClients = state.clients.length;

  // Средний чек
  const avgCheck = completedBookings.length > 0 
    ? Math.round(completedBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0) / completedBookings.length) 
    : 0;

  // 2. Сбор данных для графиков доходов за последние 7 дней
  const chartDays = [];
  const chartRevenues = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
    
    const dayRev = state.transactions
      .filter(t => t.type === 'income' && t.createdAt.split('T')[0] === dateStr)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    chartDays.push(label);
    chartRevenues.push(dayRev);
  }

  const maxRevenue = Math.max(...chartRevenues, 1000);

  // 3. Записи на сегодня
  const todayBookingsListHtml = todayBookings.length === 0 
    ? `
      <div class="card p-12 text-center" style="color: var(--text-secondary); grid-column: 1 / -1;">
        <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="activity" style="width: 56px; height: 56px;"></i></span>
        <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Нет данных</h3>
        <p style="font-size: 14px;">Пока нет записей для отображения статистики</p>
      </div>
    `
    : todayBookings.map(b => {
        const time = formatTime(b.time);
        const initials = getInitials(b.clientName);
        const statusColor = getStatusColor(b.status);
        const statusLabel = getStatusLabel(b.status);
        
        let actionBtnHtml = '';
        if (b.status === 'pending') {
          actionBtnHtml = `
            <button onclick="handleUpdateBookingStatus('${b.id}', 'confirmed')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto;">
              Подтвердить
            </button>
          `;
        } else if (b.status === 'confirmed') {
          actionBtnHtml = `
            <button onclick="handleUpdateBookingStatus('${b.id}', 'completed')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; width: auto; background: #10b981;">
              Завершить
            </button>
          `;
        }

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="font-weight: 700; font-size: 15px; color: var(--primary); min-width: 45px;">${time}</div>
              <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--theme-100); color: var(--primary-dark); font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 13px;">
                ${initials}
              </div>
              <div>
                <h4 style="font-weight: 700; font-size: 14px; color: var(--text);">${b.clientName}</h4>
                <p style="font-size: 12px; color: var(--text-secondary);">${b.serviceName} • ${b.masterName}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(59,130,246,0.1); border-radius: 12px; color: #3b82f6;">
              <i data-feather="dollar-sign" style="width: 24px; height: 24px;"></i>
            </div>
            <span class="badge ${statusColor}">${statusLabel}</span>
            ${actionBtnHtml}
          </div>
        `;
      }).join('');

  // 4. Рейтинг мастеров за все время
  const masterStats = {};
  state.bookings.filter(b => b.status === 'completed').forEach(b => {
    if (!masterStats[b.masterId]) {
      masterStats[b.masterId] = { name: b.masterName, count: 0, revenue: 0 };
    }
    masterStats[b.masterId].count += 1;
    masterStats[b.masterId].revenue += parseFloat(b.price) || 0;
  });

  const topMasters = Object.values(masterStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topMastersHtml = topMasters.length === 0
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
          <div style="font-weight: 700; font-size: 13px; color: var(--text);">${formatPrice(m.revenue)}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">${m.count} вып. услуг</div>
        </div>
      </div>
    `).join('');

  return `
    <div class="animate-slide-up" style="display: flex; flex-direction: column; gap: 28px;">
      
      <!-- Приветствие и кнопка новой записи -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(16,185,129,0.1); border-radius: 50%; color: #10b981;">
                <i data-feather="check-circle" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text);">Касса открыта</div>
                <div style="font-size: 12px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 12px; height: 12px;"></i> Идет рабочая смена</div>
              </div>
            </div>
            <button onclick="showCloseShiftModal()" class="btn btn-secondary" style="width: auto; color: #ef4444; border-color: rgba(239,68,68,0.2);">Закрыть смену</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Аналитика и дашборд</h1>
            <p style="color: var(--text-secondary); font-size: 14px;">Обзор показателей вашего салона на сегодня</p>
          </div>
          <button onclick="showCreateBookingModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
            <i data-feather="plus" style="width: 18px; height: 18px;"></i> Создать запись
          </button>
        </div>
      </div>

      <!-- Строка основных показателей -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="stat-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Выручка сегодня</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text);">${formatPrice(todayRevenue)}</div>
          <div style="font-size: 12px; color: #10b981; font-weight: 600;">💰 По кассе транзакций</div>
        </div>
        
        <div class="stat-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Записи на сегодня</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text);">${activeTodayBookings.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Всего запланировано: ${todayBookings.length}</div>
        </div>
        
        <div class="stat-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Клиентов в базе</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text);">${totalClients}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Постоянных гостей</div>
        </div>
        
        <div class="stat-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Средний чек</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text);">${formatPrice(avgCheck)}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">По выполненным записям</div>
        </div>
      </div>

      <!-- График и Список записей -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- График выручки -->
        <div class="card p-6 lg:col-span-2" style="display: flex; flex-direction: column; gap: 20px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">Статистика выручки за 7 дней</h3>
          
          <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding: 10px 0; border-bottom: 2px solid var(--border);">
            ${chartRevenues.map((val, idx) => {
              const pct = (val / maxRevenue) * 100;
              const label = chartDays[idx];
              return `
                <div style="display: flex; flex-direction: column; align-items: center; flex-grow: 1; height: 100%; justify-content: flex-end; gap: 8px;">
                  <div style="font-size: 10px; font-weight: 700; color: var(--text);">${val > 0 ? Math.round(val / 100) / 10 + 'k' : ''}</div>
                  <div style="height: ${pct}%; width: 32px; background: linear-gradient(to top, var(--primary), var(--primary-light)); border-radius: 6px 6px 0 0; transition: height 0.5s ease-in-out;"></div>
                  <div style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Рейтинг мастеров -->
        <div class="card p-6" style="display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">Рейтинг мастеров</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${topMastersHtml}
          </div>
        </div>
      </div>

      <!-- Список записей на сегодня -->
      <div class="card p-6">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 14px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">Записи на сегодня</h3>
          <a href="#" onclick="event.preventDefault(); navigate('bookings')" style="font-size: 13px; font-weight: 700; color: var(--primary);">Все записи →</a>
        </div>
        <div style="display: flex; flex-direction: column;">
          ${todayBookingsListHtml}
        </div>
      </div>

    </div>
  `;
};
