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

  // 3. Записи на сегодня - расчет статистики по статусам
  const statusStats = {
    pending: { count: 0, sum: 0 },
    confirmed: { count: 0, sum: 0 },
    completed: { count: 0, sum: 0 },
    cancelled: { count: 0, sum: 0 }
  };
  
  todayBookings.forEach(b => {
    const status = b.status || 'pending';
    if (statusStats[status]) {
      statusStats[status].count += 1;
      statusStats[status].sum += parseFloat(b.price) || 0;
    }
  });

  const statsBarHtml = todayBookings.length === 0 ? '' : `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; border-bottom: 1px dashed var(--border); padding-bottom: 16px;">
      <!-- Pending (Записан) -->
      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span> Записан
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.pending.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${formatPrice(statusStats.pending.sum)}</div>
      </div>
      
      <!-- Confirmed (Подтвержден) -->
      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></span> Подтвержден
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.confirmed.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${formatPrice(statusStats.confirmed.sum)}</div>
      </div>

      <!-- Completed (Выполнен) -->
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> Выполнен
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.completed.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: #10b981;">${formatPrice(statusStats.completed.sum)}</div>
      </div>

      <!-- Cancelled (Отмена) -->
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444;"></span> Отмена
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text);">${statusStats.cancelled.count} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">зап.</span></div>
        <div style="font-size: 12px; font-weight: 700; color: #ef4444;">${formatPrice(statusStats.cancelled.sum)}</div>
      </div>
    </div>
  `;

  const todayBookingsListHtml = todayBookings.length === 0 
    ? `
      <div class="card p-12 text-center" style="color: var(--text-secondary); grid-column: 1 / -1; background: transparent; border: none;">
        <span style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--border);"><i data-feather="activity" style="width: 56px; height: 56px;"></i></span>
        <h3 style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">Нет записей на сегодня</h3>
        <p style="font-size: 13px;">Создайте новую запись или перейдите в раздел всех записей</p>
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

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 16px; flex-wrap: wrap;">
            <!-- Левая часть: Время, Аватар, Клиент и Услуга -->
            <div style="display: flex; align-items: center; gap: 14px; flex-grow: 1; min-width: 200px;">
              <div style="font-weight: 800; font-size: 14px; color: var(--primary); min-width: 48px; background: rgba(99, 102, 241, 0.1); padding: 4px 8px; border-radius: 8px; text-align: center;">
                ${time}
              </div>
              <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light), var(--primary)); color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);">
                ${initials}
              </div>
              <div>
                <h4 style="font-weight: 700; font-size: 14px; color: var(--text);">${b.clientName}</h4>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  ${b.serviceName} • <span style="color: var(--primary-light); font-weight: 600;">${b.masterName}</span>
                </p>
              </div>
            </div>

            <!-- Правая часть: Сумма, Статус и Действия -->
            <div style="display: flex; align-items: center; gap: 16px; justify-content: flex-end; flex-wrap: wrap;">
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span style="font-weight: 800; font-size: 14px; color: var(--text);">${formatPrice(b.price)}</span>
                <span class="badge ${statusColor}">${statusLabel}</span>
              </div>
              ${actionBtnHtml ? `<div style="display: flex; align-items: center;">${actionBtnHtml}</div>` : ''}
            </div>
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
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Главное</h1>
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
        ${statsBarHtml}
        <div style="display: flex; flex-direction: column;">
          ${todayBookingsListHtml}
        </div>
      </div>

    </div>
  `;
};
