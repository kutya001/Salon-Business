// ============================================
// finance.js — Касса, транзакции, статьи, кошельки
// ============================================

window.renderFinance = function () {
  const activeTab = state.ui.financeTab || 'shifts';

  const tabs = [
    { id: 'shifts', label: 'КАССОВЫЕ СМЕНЫ' },
    { id: 'transactions', label: 'ТРАНЗАКЦИИ' },
    { id: 'categories', label: 'СТАТЬИ РАСХОДА/ПРИХОДА' },
    { id: 'wallets', label: 'КОШЕЛЬКИ' }
  ];

  const tabsHtml = `
    <div style="margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
      <div class="segment-tabs-container">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="setUI({ financeTab: '${tab.id}' })" class="segment-tab ${isActive ? 'active' : ''}" style="border: none; white-space: nowrap;">
              ${tab.label}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  let contentHtml = '';
  let fabAction = '';

  if (activeTab === 'shifts') {
    contentHtml = renderFinanceShifts();
  } else if (activeTab === 'transactions') {
    contentHtml = renderFinanceTransactions();
    fabAction = 'showCreateTransactionModal()';
  } else if (activeTab === 'categories') {
    contentHtml = renderFinanceCategories();
    fabAction = 'showCreateCategoryModal()';
  } else if (activeTab === 'wallets') {
    contentHtml = renderFinanceWallets();
    fabAction = 'showCreateWalletModal()';
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column;">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em;">Финансы</h1>
        </div>
      </div>

      ${tabsHtml}
      ${contentHtml}
      
      ${activeTab !== 'shifts' ? `
      <!-- Плавающая кнопка (FAB) -->
      <button onclick="${fabAction}" class="animate-scale-in" style="position: fixed; bottom: 110px; right: 20px; width: 60px; height: 60px; border-radius: 30px; background: var(--primary); color: white; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50;">
        <i data-feather="plus" style="width: 28px; height: 28px;"></i>
      </button>
      ` : ''}
    </div>
  `;
};

// ============================================
// Вкладка: Смены
// ============================================
window.renderFinanceShifts = function () {
  const activeShift = state.shifts.find(s => s.status === 'open');

  let shiftBlockHtml = '';
  if (activeShift) {
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
      <div class="glass-interactive-card p-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2)); border: 1px solid rgba(16,185,129,0.3); color: white; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span class="badge" style="background: rgba(16,185,129,0.3); color: #34d399; font-size: 10px;">🟢 СМЕНА ОТКРЫТА</span>
            <h3 style="font-weight: 800; font-size: 18px; margin-top: 4px; color: var(--text);">Кассовая смена №${activeShift.id.substring(0, 5)}</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Открыта: ${formatDate(activeShift.openedAt)} в ${formatTime(activeShift.openedAt.split('T')[1])}</p>
          </div>
          <button onclick="showCloseShiftModal('${activeShift.id}')" class="btn btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 10px 18px; border-radius: 12px; width: auto;">
            🔒 Закрыть смену
          </button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
          <div>
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">В кассе сейчас</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text);">${formatPrice(currentCashInDrawer)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Наличных внесено</div>
            <div style="font-size: 20px; font-weight: 800; color: #34d399;">+${formatPrice(shiftCashIncome)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Расход наличных</div>
            <div style="font-size: 20px; font-weight: 800; color: #f87171;">-${formatPrice(shiftCashExpense)}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Безнал (Карты)</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text);">${formatPrice(shiftCard)}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    shiftBlockHtml = `
      <div class="glass-interactive-card p-6" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; border-left: 5px solid #ef4444;">
        <div>
          <span class="badge badge-danger">🔴 СМЕНА ЗАКРЫТА</span>
          <h3 style="font-weight: 800; font-size: 16px; margin-top: 4px; color: var(--text);">Финансовые операции приостановлены</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">Откройте кассовую смену перед приемом оплат</p>
        </div>
        <button onclick="showOpenShiftModal()" class="btn btn-primary" style="background: #10b981; width: auto; display: flex; align-items: center; gap: 8px;">
          🔑 Открыть новую смену
        </button>
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${shiftBlockHtml}
      
      <div class="glass-interactive-card p-6">
        <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 12px;">История смен</h3>
        <p style="color: var(--text-secondary); font-size: 13px;">Здесь будет история предыдущих смен.</p>
      </div>
    </div>
  `;
};

// ============================================
// Вкладка: Транзакции
// ============================================
window.renderFinanceTransactions = function () {
  const transactionsRows = state.transactions.length === 0
    ? `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);">Транзакций пока нет</td></tr>`
    : state.transactions.map(t => {
        const isIncome = t.type === 'income';
        const color = isIncome ? '#10b981' : '#ef4444';
        const sign = isIncome ? '+' : '—';
        
        // Find category name
        const cats = state.settings?.categories || [];
        const cat = cats.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : (isIncome ? 'Приход' : 'Расход');
        
        // Find wallet name
        const wallets = state.settings?.wallets || [
          {id: 'cash', name: 'Наличные', icon: '💵'},
          {id: 'card', name: 'Карта', icon: '💳'}
        ];
        const wallet = wallets.find(w => w.id === t.paymentMethod) || {name: t.paymentMethod, icon: '💰'};

        return `
          <tr>
            <td data-label="Дата">${formatDate(t.createdAt)}</td>
            <td data-label="Тип">
              <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">${catName}</span>
            </td>
            <td data-label="Назначение" style="font-weight: 600; text-align: left;">${t.description}</td>
            <td data-label="Оплата">${wallet.icon} ${wallet.name}</td>
            <td data-label="Сумма" style="font-weight: 800; color: ${color};">${sign}${formatPrice(t.amount)}</td>
          </tr>
        `;
      }).join('');

  return `
    <div class="glass-interactive-card p-6">
      <div class="data-table-container">
        <table class="data-table mobile-table-card">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Категория</th>
              <th style="text-align: left;">Назначение</th>
              <th>Кошелек</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

// ============================================
// Вкладка: Кошельки
// ============================================
window.renderFinanceWallets = function () {
  const wallets = state.settings?.wallets || [
    { id: 'cash', name: 'Сейф (Наличные)', icon: '💵', type: 'cash' },
    { id: 'card', name: 'Расчетный счет (Карта)', icon: '💳', type: 'card' }
  ];

  // Высчитываем балансы (упрощенно)
  const balances = {};
  wallets.forEach(w => balances[w.id] = 0);
  
  state.transactions.forEach(t => {
    if (balances[t.paymentMethod] !== undefined) {
      if (t.type === 'income') balances[t.paymentMethod] += parseFloat(t.amount);
      else if (t.type === 'expense') balances[t.paymentMethod] -= parseFloat(t.amount);
    }
  });

  const walletCardsHtml = wallets.map(w => {
    return `
      <div class="glass-interactive-card p-6" style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-size: 24px;">${w.icon}</div>
          <button onclick="showEditWalletModal('${w.id}')" class="btn" style="padding: 4px; color: var(--text-secondary);"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i></button>
        </div>
        <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-top: 8px;">${w.name}</div>
        <div style="font-size: 24px; font-weight: 800; color: var(--text);">${formatPrice(balances[w.id] || 0)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${walletCardsHtml}
    </div>
  `;
};

// ============================================
// Вкладка: Статьи (Категории)
// ============================================
window.renderFinanceCategories = function () {
  const categories = state.settings?.categories || [
    { id: 'cat1', name: 'Оплата услуг', type: 'income' },
    { id: 'cat2', name: 'Закупка материалов', type: 'expense' },
    { id: 'cat3', name: 'Зарплата', type: 'expense' }
  ];

  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  const renderCatRow = (cat) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
      <span style="font-weight: 600; color: var(--text);">${cat.name}</span>
      <button onclick="showEditCategoryModal('${cat.id}')" class="btn" style="padding: 4px; color: var(--text-secondary);"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i></button>
    </div>
  `;

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-interactive-card p-6">
        <h3 style="font-weight: 800; color: #10b981; margin-bottom: 16px; font-size: 16px;">Статьи Прихода</h3>
        <div style="display: flex; flex-direction: column;">
          ${incomeCats.length > 0 ? incomeCats.map(renderCatRow).join('') : '<p style="font-size: 12px; color: var(--text-secondary);">Нет статей прихода</p>'}
        </div>
      </div>
      
      <div class="glass-interactive-card p-6">
        <h3 style="font-weight: 800; color: #ef4444; margin-bottom: 16px; font-size: 16px;">Статьи Расхода</h3>
        <div style="display: flex; flex-direction: column;">
          ${expenseCats.length > 0 ? expenseCats.map(renderCatRow).join('') : '<p style="font-size: 12px; color: var(--text-secondary);">Нет статей расхода</p>'}
        </div>
      </div>
    </div>
  `;
};

// ============================================
// Модалки
// ============================================

window.showCreateTransactionModal = function () {
  setUI({ modal: 'createTransaction', modalData: { type: 'income', paymentMethod: 'cash', categoryId: '' } });
};

window.renderTransactionModal = function () {
  const md = state.ui.modalData || { type: 'income', paymentMethod: 'cash' };
  
  const wallets = state.settings?.wallets || [
    { id: 'cash', name: 'Наличные', icon: '💵' },
    { id: 'card', name: 'Карта', icon: '💳' }
  ];
  
  const categories = state.settings?.categories || [
    { id: 'income_general', name: 'Общий приход', type: 'income' },
    { id: 'expense_general', name: 'Общий расход', type: 'expense' }
  ];
  
  const filteredCats = categories.filter(c => c.type === md.type);

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Ввод транзакции</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="tx-form" onsubmit="event.preventDefault(); handleTransactionSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Тип транзакции</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'income' } })" class="btn ${md.type === 'income' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📈 Приход</button>
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'expense' } })" class="btn ${md.type === 'expense' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📉 Расход</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Статья</label>
          <select id="tx-category" class="form-select" required>
            <option value="" disabled selected>Выберите статью...</option>
            ${filteredCats.map(c => `<option value="${c.id}" ${md.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Сумма (сом)</label>
          <input type="number" id="tx-amount" class="form-input" placeholder="1000" min="1" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Кошелек оплаты</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
            ${wallets.map(w => `
              <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, paymentMethod: '${w.id}' } })" class="btn ${md.paymentMethod === w.id ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; min-width: 100px; padding: 10px; font-size: 13px;">${w.icon} ${w.name}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Назначение / Описание</label>
          <input type="text" id="tx-desc" class="form-input" placeholder="Комментарий к операции..." required>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          Подтвердить и внести
        </button>
      </form>
    </div>
  `;
};

window.handleTransactionSubmit = async function () {
  const type = state.ui.modalData.type;
  const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
  const paymentMethod = state.ui.modalData.paymentMethod;
  const categoryId = document.getElementById('tx-category').value;
  const description = document.getElementById('tx-desc').value.trim();

  setUI({ loading: true });
  try {
    const tx = await api.createTransaction({ type, amount, description, paymentMethod, categoryId });
    state.transactions.unshift(tx);
    
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

// Смены (Modal functions)
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

// Заглушки для модалок категорий и кошельков (для отображения UI)
window.showCreateCategoryModal = function() {
  setUI({ modal: 'createCategory', modalData: { type: 'income', name: '' } });
};

window.renderCategoriesModal = function() {
  const md = state.ui.modalData || { type: 'income', name: '' };
  const isEdit = !!md.id;
  
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактировать статью' : 'Добавить статью'}</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form onsubmit="event.preventDefault(); handleCategorySubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Тип</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'income' } })" class="btn ${md.type === 'income' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📈 Приход</button>
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'expense' } })" class="btn ${md.type === 'expense' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📉 Расход</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Название статьи</label>
          <input type="text" id="cat-name" class="form-input" placeholder="Например: Закупка материалов" value="${md.name}" required>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Добавить'}
        </button>
      </form>
    </div>
  `;
};

window.handleCategorySubmit = async function() {
  const name = document.getElementById('cat-name').value.trim();
  const md = state.ui.modalData;
  const cats = [...(state.business.categories || [])];
  
  if (md.id) {
    const idx = cats.findIndex(c => c.id === md.id);
    if (idx !== -1) {
      cats[idx].name = name;
      cats[idx].type = md.type;
    }
  } else {
    cats.push({ id: 'cat_' + Date.now(), name, type: md.type });
  }

  setUI({ loading: true });
  try {
    const updated = await api.updateSettings({ categories: cats });
    setState({ business: updated });
    setUI({ modal: null });
    showToast('Статья успешно сохранена', 'success');
  } catch (e) {
    showToast('Не удалось сохранить', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.showEditCategoryModal = function(id) {
  const cats = state.business.categories || [];
  const cat = cats.find(c => c.id === id);
  if (cat) {
    setUI({ modal: 'categories', modalData: { ...cat } });
  }
};

// WALLETS
window.showCreateWalletModal = function() {
  setUI({ modal: 'createWallet', modalData: { name: '', icon: '💰', type: 'cash' } });
};

window.renderWalletModal = function() {
  const md = state.ui.modalData || { name: '', icon: '💰', type: 'cash' };
  const isEdit = !!md.id;
  
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактировать кошелек' : 'Новый кошелек'}</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form onsubmit="event.preventDefault(); handleWalletSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Название кошелька</label>
          <input type="text" id="wallet-name" class="form-input" placeholder="Например: Карта Optima" value="${md.name}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Иконка (Emoji)</label>
          <input type="text" id="wallet-icon" class="form-input" placeholder="💳" value="${md.icon}" required maxlength="2">
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Добавить'}
        </button>
      </form>
    </div>
  `;
};

window.handleWalletSubmit = async function() {
  const name = document.getElementById('wallet-name').value.trim();
  const icon = document.getElementById('wallet-icon').value.trim();
  const md = state.ui.modalData;
  const wallets = [...(state.business.wallets || [])];
  
  if (md.id) {
    const idx = wallets.findIndex(w => w.id === md.id);
    if (idx !== -1) {
      wallets[idx].name = name;
      wallets[idx].icon = icon || '💰';
    }
  } else {
    wallets.push({ id: 'wallet_' + Date.now(), name, icon: icon || '💰', type: 'card' });
  }

  setUI({ loading: true });
  try {
    const updated = await api.updateSettings({ wallets });
    setState({ business: updated });
    setUI({ modal: null });
    showToast('Кошелек успешно сохранен', 'success');
  } catch (e) {
    showToast('Не удалось сохранить', 'error');
  } finally {
    setUI({ loading: false });
  }
};

window.showEditWalletModal = function(id) {
  const wallets = state.business.wallets || [];
  const w = wallets.find(w => w.id === id);
  if (w) {
    setUI({ modal: 'createWallet', modalData: { ...w } });
  }
};
