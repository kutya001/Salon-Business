// ============================================
// finance.js — Касса, транзакции и кассовые смены
// ============================================

window.renderFinance = function () {
  // Находим активную смену
  const activeShift = state.shifts.find(s => s.status === 'open');

  // Расчет балансов по кошелькам из транзакций
  let cashBalance = 0;
  let cardBalance = 0;
  let bonusBalance = 0;

  state.transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      if (t.paymentMethod === 'cash') cashBalance += amt;
      else if (t.paymentMethod === 'card') cardBalance += amt;
      else if (t.paymentMethod === 'bonus') bonusBalance += amt;
    } else if (t.type === 'expense') {
      if (t.paymentMethod === 'cash') cashBalance -= amt;
    }
  });

  // Отрисовка сменного блока
  let shiftBlockHtml = '';
  if (activeShift) {
    // Вычисляем показатели текущей смены
    const shiftTxs = state.transactions.filter(t => t.shiftId === activeShift.id);
    let shiftCashIncome = 0;
    let shiftCashExpense = 0;
    let shiftCard = 0;

    shiftTxs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        if (t.paymentMethod === 'cash') shiftCashIncome += amt;
        else if (t.paymentMethod === 'card') shiftCard += amt;
      } else if (t.type === 'expense') {
        if (t.paymentMethod === 'cash') shiftCashExpense += amt;
      }
    });

    const currentCashInDrawer = parseFloat(activeShift.openingCash) + shiftCashIncome - shiftCashExpense;

    shiftBlockHtml = `
      <div class="card p-6" style="background: linear-gradient(135deg, #10b981, #059669); color: white; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span class="badge" style="background: rgba(255,255,255,0.2); color: white; font-size: 10px;">🟢 СМЕНА ОТКРЫТА</span>
            <h3 style="font-weight: 800; font-size: 18px; margin-top: 4px;">Кассовая смена №${activeShift.id.substring(0, 5)}</h3>
            <p style="font-size: 12px; opacity: 0.85; margin-top: 2px;">Открыта: ${formatDate(activeShift.openedAt)} в ${formatTime(activeShift.openedAt.split('T')[1])}</p>
          </div>
          <button onclick="showCloseShiftModal('${activeShift.id}')" class="btn btn-secondary" style="color: #ef4444; border: none; background: white; padding: 10px 18px; border-radius: 12px; width: auto;">
            🔒 Закрыть смену
          </button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 14px;">
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase;">В кассе сейчас</div>
            <div style="font-size: 20px; font-weight: 800;">${formatPrice(currentCashInDrawer)}</div>
          </div>
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase;">Наличных внесено</div>
            <div style="font-size: 20px; font-weight: 800;">+${formatPrice(shiftCashIncome)}</div>
          </div>
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase;">Расход наличных</div>
            <div style="font-size: 20px; font-weight: 800; color: #fee2e2;">-${formatPrice(shiftCashExpense)}</div>
          </div>
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase;">Безнал (Карты)</div>
            <div style="font-size: 20px; font-weight: 800;">${formatPrice(shiftCard)}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    shiftBlockHtml = `
      <div class="card p-6" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; border-left: 5px solid #dc2626;">
        <div>
          <span class="badge badge-danger">🔴 СМЕНА ЗАКРЫТА</span>
          <h3 style="font-weight: 800; font-size: 16px; margin-top: 4px; color: var(--text);">Финансовые операции приостановлены</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">Откройте кассовую смену перед приемом наличных оплат и расходов</p>
        </div>
        <button onclick="showOpenShiftModal()" class="btn btn-primary" style="background: #10b981; width: auto; display: flex; align-items: center; gap: 8px;">
          🔑 Открыть новую смену
        </button>
      </div>
    `;
  }

  // Сбор HTML списка транзакций
  const transactionsRows = state.transactions.length === 0
    ? `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);">Транзакций пока нет</td></tr>`
    : state.transactions.slice(0, 10).map(t => {
        const isIncome = t.type === 'income';
        const color = isIncome ? '#10b981' : '#ef4444';
        const sign = isIncome ? '+' : '—';
        
        return `
          <tr>
            <td data-label="Дата">${formatDate(t.createdAt)}</td>
            <td data-label="Тип">
              <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">
                ${isIncome ? 'Приход' : 'Расход'}
              </span>
            </td>
            <td data-label="Назначение" style="font-weight: 600; text-align: left;">${t.description}</td>
            <td data-label="Оплата">${t.paymentMethod === 'card' ? '💳 Карта' : t.paymentMethod === 'bonus' ? '🌟 Бонус' : '💵 Наличные'}</td>
            <td data-label="Сумма" style="font-weight: 800; color: ${color};">${sign}${formatPrice(t.amount)}</td>
          </tr>
        `;
      }).join('');

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 28px;">
      
      <!-- Заголовок -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Касса и финансы</h1>
          <p style="color: var(--text-secondary); font-size: 14px;">Контроль кассовых смен, сейфа, приходов и расходов</p>
        </div>
        <button onclick="showCreateTransactionModal()" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
          💸 Создать транзакцию
        </button>
      </div>

      <!-- Кошельки -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="stat-card" style="background: var(--bg-secondary);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Сейф (Наличные)</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--text);">${formatPrice(cashBalance)}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Физические купюры в кассе</div>
        </div>
        <div class="stat-card" style="background: var(--bg-secondary);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Расчетный счет (Карты)</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--text);">${formatPrice(cardBalance)}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Электронные платежи и переводы</div>
        </div>
        <div class="stat-card" style="background: var(--bg-secondary);">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Бонусный баланс</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--text);">${formatPrice(bonusBalance)}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Виртуальные баллы гостей</div>
        </div>
      </div>

      <!-- Управление кассовой сменой -->
      ${shiftBlockHtml}

      <!-- Таблица транзакций -->
      <div class="card p-6">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 14px;">
          <h3 style="font-weight: 800; font-size: 17px; color: var(--text);">Последние транзакции</h3>
        </div>
        <div class="data-table-container">
          <table class="data-table mobile-table-card">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th style="text-align: left;">Назначение операции</th>
                <th>Оплата</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsRows}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

// Открытие модалки добавления транзакции
window.showCreateTransactionModal = function () {
  setUI({ modal: 'createTransaction', modalData: null });
};

window.renderTransactionModal = function () {
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Ввод транзакции вручную</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="tx-form" onsubmit="event.preventDefault(); handleTransactionSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Тип транзакции</label>
          <select id="tx-type" class="form-select" required>
            <option value="income">📈 Приход (Поступление средств)</option>
            <option value="expense">📉 Расход (Выплата зарплаты, закуп материалов)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Сумма (сом)</label>
          <input type="number" id="tx-amount" class="form-input" placeholder="1000" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Способ оплаты</label>
          <select id="tx-payment" class="form-select" required>
            <option value="cash">💵 Наличные</option>
            <option value="card">💳 Безналичный (Карта/Перевод)</option>
            <option value="bonus">🌟 Бонусы</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Назначение / Описание</label>
          <input type="text" id="tx-desc" class="form-input" placeholder="Закупка лаков, выплата ЗП мастеру..." required>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          Подтвердить и внести
        </button>
      </form>
    </div>
  `;
};

// Сохранение транзакции
window.handleTransactionSubmit = async function () {
  const type = document.getElementById('tx-type').value;
  const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
  const paymentMethod = document.getElementById('tx-payment').value;
  const description = document.getElementById('tx-desc').value.trim();

  setUI({ loading: true });
  try {
    const tx = await api.createTransaction({ type, amount, description, paymentMethod });
    state.transactions.unshift(tx);
    
    // Обновляем смены, если транзакция привязалась к смене
    const allData = await api.getAll();
    setState({ shifts: allData.shifts });
    
    setUI({ modal: null });
    showToast('Транзакция успешно зафиксирована', 'success');
  } catch(e) {
    showToast('Не удалось сохранить транзакцию', 'error');
  } finally {
    setUI({ loading: false });
  }
};

// Смены
window.showOpenShiftModal = function () { setUI({ modal: 'openShift' }); };
window.renderOpenShiftModal = function () {
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Открытие кассовой смены</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>
      <form onsubmit="event.preventDefault(); handleOpenShiftSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Входящий остаток в кассе (наличные)</label>
          <input type="number" id="shift-opening-cash" class="form-input" placeholder="0" value="0" min="0" required>
        </div>
        <button type="submit" class="btn btn-primary" style="background: #10b981; margin-top: 10px;">
          🚀 Запустить смену
        </button>
      </form>
    </div>
  `;
};

window.handleOpenShiftSubmit = async function () {
  const openingCash = parseFloat(document.getElementById('shift-opening-cash').value) || 0;
  setUI({ loading: true });
  try {
    const shift = await api.openShift(openingCash);
    state.shifts.unshift(shift);
    setUI({ modal: null });
    showToast('Смена успешно открыта!', 'success');
  } catch(e) {
    showToast('Не удалось открыть смену', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.showCloseShiftModal = function (id) { setUI({ modal: 'closeShift', modalData: id }); };
window.renderCloseShiftModal = function () {
  const id = state.ui.modalData;
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Закрытие кассовой смены</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>
      <form onsubmit="event.preventDefault(); handleCloseShiftSubmit('${id}');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Фактический остаток наличных в кассе (инкассация)</label>
          <input type="number" id="shift-closing-cash" class="form-input" placeholder="Сумма в сом" min="0" required>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary);">Система автоматически сверит эту сумму с расчетной и покажет расхождения в случае их наличия.</p>
        <button type="submit" class="btn btn-primary" style="background: #dc2626; margin-top: 10px;">
          🔒 Закрыть смену и сдать отчет
        </button>
      </form>
    </div>
  `;
};

window.handleCloseShiftSubmit = async function (id) {
  const closingCash = parseFloat(document.getElementById('shift-closing-cash').value) || 0;
  setUI({ loading: true });
  try {
    const shift = await api.closeShift(id, closingCash);
    const idx = state.shifts.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.shifts[idx] = shift;
    }
    
    // Перезапрашиваем данные, чтобы баланс обновился
    const allData = await api.getAll();
    setState({ shifts: allData.shifts, transactions: allData.transactions });
    
    setUI({ modal: null, modalData: null });
    showToast('Смена успешно закрыта. Отчет сдан!', 'success');
  } catch(e) {
    showToast('Не удалось закрыть смену', 'error');
  } finally {
    setUI({ loading: false });
  }
};
