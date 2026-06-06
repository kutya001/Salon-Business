// ============================================
// finance.js — Касса, транзакции, статьи, кошельки
// ============================================

window.getCleanDate = function (dateVal) {
  if (!dateVal) return '';
  if (dateVal.includes('T')) return dateVal.split('T')[0];
  const firstPart = dateVal.split(' ')[0];
  if (firstPart.includes('.')) {
    const p = firstPart.split('.');
    if (p[0].length === 2) {
      return `${p[2]}-${p[1]}-${p[0]}`; // DD.MM.YYYY -> YYYY-MM-DD
    }
    return firstPart.replace(/\./g, '-');
  }
  return firstPart;
};

window.renderFinance = function () {
  let activeTab = state.ui.financeTab || 'shifts';

  const tabs = [
    { id: 'shifts', label: 'КАССОВЫЕ СМЕНЫ', icon: 'briefcase' },
    { id: 'transactions', label: 'ТРАНЗАКЦИИ', icon: 'trending-up' },
    { id: 'categories', label: 'СТАТЬИ РАСХОДА/ПРИХОДА', icon: 'layers' },
    { id: 'wallets', label: 'КОШЕЛЬКИ', icon: 'credit-card' }
  ];

  const allowedTabs = tabs.filter(tab => {
    if (tab.id === 'shifts') return hasPermission('finance_shifts');
    if (tab.id === 'transactions') return hasPermission('finance_transactions');
    if (tab.id === 'categories') return hasPermission('finance_categories');
    if (tab.id === 'wallets') return hasPermission('finance_wallets');
    return true;
  });

  if (allowedTabs.length > 0 && !allowedTabs.find(t => t.id === activeTab)) {
    activeTab = allowedTabs[0].id;
  }

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

  let topButtonHtml = '';
  if (activeTab !== 'shifts') {
    let btnText = 'Добавить';
    if (activeTab === 'transactions') btnText = 'Внести операцию';
    else if (activeTab === 'categories') btnText = 'Добавить статью';
    else if (activeTab === 'wallets') btnText = 'Добавить кошелек';
    
    topButtonHtml = `
      <button onclick="${fabAction}" class="hidden md-flex btn btn-primary animate-scale-in" style="align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;">
        <i data-feather="plus" style="width: 16px; height: 16px;"></i> ${btnText}
      </button>
    `;
  }

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; padding-bottom: 80px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; width: 100%; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
            <h1 class="hidden md-block" style="font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; margin: 0; flex-shrink: 0;">Финансы</h1>
            <div class="segment-tabs-container" style="display: inline-flex; flex-wrap: nowrap;">
              ${allowedTabs.map(tab => {
                const isActive = activeTab === tab.id;
                return `
                  <button onclick="setUI({ financeTab: '${tab.id}' })" class="segment-tab ${isActive ? 'active' : ''}" style="border: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; justify-content: center;" title="${tab.label}">
                    <i data-feather="${tab.icon}" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
                    <span class="hidden md-inline">${tab.label}</span>
                  </button>
                `;
              }).join('')}
            </div>
            <span class="md-hidden animate-fade-in" style="font-size: 12px; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.05em; margin-left: 10px; white-space: nowrap; text-transform: uppercase;">
              ${allowedTabs.find(t => t.id === activeTab)?.label || ''}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-left: auto;">
            ${topButtonHtml}
          </div>
        </div>
      </div>

      ${contentHtml}
      
      ${activeTab !== 'shifts' ? `
      <!-- Плавающая кнопка (FAB) -->
      <button onclick="${fabAction}" class="md-hidden animate-scale-in" style="position: fixed; bottom: 106px; right: 20px; width: 56px; height: 56px; border-radius: 28px; background: var(--primary); color: white; border: none; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50; transition: transform 0.2s ease;">
        <i data-feather="plus" style="width: 24px; height: 24px;"></i>
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

  window.parseShiftDateTimeStr = (dateStr, timeStr) => {
    if (!dateStr) return new Date(0);
    let day = 1, month = 0, year = 1970;
    const parts = dateStr.match(/^(\d{2})[-.](\d{2})[-.](\d{4})/);
    if (parts) {
      day = parseInt(parts[1], 10);
      month = parseInt(parts[2], 10) - 1;
      year = parseInt(parts[3], 10);
    } else {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    
    let h = 0, m = 0, s = 0;
    if (timeStr && timeStr.includes(':')) {
      const tParts = timeStr.split(':');
      h = parseInt(tParts[0], 10) || 0;
      m = parseInt(tParts[1], 10) || 0;
      s = parseInt(tParts[2], 10) || 0;
    }
    return new Date(year, month, day, h, m, s);
  };

  window.getShiftPrettyName = (s) => {
    if (s.date) {
      return `Смена ${s.date.replace(/-/g, '.')}`;
    }
    if (s.openedAt && s.openedAt.includes('T')) {
      const datePart = s.openedAt.split('T')[0];
      const parts = datePart.split('-');
      return `Смена ${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return `Смена №${s.id.substring(0, 5)}`;
  };

  window.getShiftDuration = (shift) => {
    if (shift.status === 'open') return 'Смена открыта';
    const openDate = window.parseShiftDateTimeStr(shift.date || shift.openedAt, shift.openedAt);
    const closeDate = window.parseShiftDateTimeStr(shift.date || shift.closedAt, shift.closedAt);
    const diffMs = closeDate - openDate;
    if (isNaN(diffMs) || diffMs < 0) return '—';
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

  window.formatShiftDateTime = (dateVal, timeVal) => {
    if (!dateVal) return '—';
    try {
      // Если это новая структура (дата содержит дефис и не содержит T)
      if (dateVal.includes('-') && !dateVal.includes('T')) {
        const prettyDate = dateVal.replace(/-/g, '.');
        if (timeVal) {
          return `${prettyDate} в ${timeVal.substring(0, 5)}`;
        }
        return prettyDate;
      }
      
      // Если это старая структура (dateVal - это openedAt в ISO формате)
      const partsISO = dateVal.split('T');
      return `${formatDate(partsISO[0])} в ${formatTime(partsISO[1])}`;
    } catch (e) {
      return dateVal;
    }
  };

  let shiftBlockHtml = '';
  if (activeShift) {
    const activeShiftDateClean = window.getCleanDate(activeShift.date || activeShift.openedAt);
    const shiftTxs = state.transactions.filter(t => {
      if (t.shiftId && activeShift.id) return t.shiftId === activeShift.id;
      const txDateClean = window.getCleanDate(t.transactionDateTime || t.createdAt);
      return txDateClean === activeShiftDateClean;
    });
    const cashWallet = (state.wallets || []).find(w => w.type === 'cash' || w.name === 'Наличные');
    const cashWalletId = cashWallet ? cashWallet.id : 'cash';

    let shiftCashIncome = 0;
    let shiftCashExpense = 0;
    let shiftCard = 0;

    shiftTxs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const isCash = t.paymentMethod === cashWalletId || t.paymentMethod === 'cash';
      
      if (t.type === 'income') {
        if (isCash) shiftCashIncome += amt;
        else shiftCard += amt;
      } else if (t.type === 'expense') {
        if (isCash) shiftCashExpense += amt;
      }
    });

    const currentCashInDrawer = parseFloat(activeShift.openingCash) + shiftCashIncome - shiftCashExpense;

    shiftBlockHtml = `
      <div class="glass-interactive-card p-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2)); border: 1px solid rgba(16,185,129,0.3); color: white; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span class="badge" style="background: rgba(16,185,129,0.3); color: #34d399; font-size: 10px;">🟢 СМЕНА ОТКРЫТА</span>
            <h3 style="font-weight: 800; font-size: 18px; margin-top: 4px; color: var(--text);">Кассовая смена №${activeShift.id.substring(0, 5)}</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Открыта: ${formatShiftDateTime(activeShift.date || activeShift.openedAt, activeShift.openedAt)}</p>
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

  let shiftsRowsHtml = '';
  if (state.shifts.length === 0) {
    shiftsRowsHtml = `<div style="text-align: center; padding: 30px; color: var(--text-secondary);">Смен пока не зарегистрировано</div>`;
  } else {
    shiftsRowsHtml = state.shifts.map(s => {
      const isOpen = s.status === 'open';
      const badgeColor = isOpen ? 'badge-success' : 'badge-danger';
      const statusText = isOpen ? '🟢 Открыта' : '🔴 Закрыта';
      
      const openedTimeOnly = s.openedAt ? (s.openedAt.includes(':') ? s.openedAt.substring(0, 5) : formatTime(s.openedAt.split('T')[1])) : '—';
      const closedTimeOnly = s.closedAt ? (s.closedAt.includes(':') ? s.closedAt.substring(0, 5) : formatTime(s.closedAt.split('T')[1])) : '—';
      
      let actionBtn = '';
      if (isOpen) {
        actionBtn = `<button onclick="event.stopPropagation(); showCloseShiftModal('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: auto; color: #ef4444; border-color: rgba(239,68,68,0.2); font-weight: 700;">🔒 Закрыть</button>`;
      } else {
        actionBtn = `<button onclick="event.stopPropagation(); handleReopenShift('${s.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: auto; color: var(--primary); border-color: var(--theme-200); font-weight: 700;">🔑 Переоткрыть</button>`;
      }

      return `
        <div class="card p-4" onclick="showShiftDetailsModal('${s.id}')" style="cursor: pointer; margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px; border-left: 4px solid ${isOpen ? '#10b981' : '#ef4444'}; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 800; font-size: 15px; color: var(--text);">${window.getShiftPrettyName(s)}</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                <span>⏱️ <b>Открыта:</b> ${openedTimeOnly}</span>
                ${!isOpen ? `<span>🔒 <b>Закрыта:</b> ${closedTimeOnly}</span>` : ''}
                <span>⏳ <b>Длительность:</b> ${window.getShiftDuration(s)}</span>
              </div>
            </div>
            <span class="badge ${badgeColor}">${statusText}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8px; border-top: 1px dashed var(--border);">
            <div>
              <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">В кассе:</div>
              <div style="font-weight: 800; color: var(--text); font-size: 14px;">${formatPrice(isOpen ? s.openingCash : s.closingCash)}</div>
            </div>
            <div>
              ${actionBtn}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${shiftBlockHtml}
      
      <div class="glass-interactive-card p-6">
        <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 16px;">Журнал кассовых смен</h3>
        <div style="display: flex; flex-direction: column;">
          ${shiftsRowsHtml}
        </div>
      </div>
    </div>
  `;
};

// ============================================
// Вкладка: Транзакции
// ============================================
window.renderFinanceTransactions = function () {
  const filters = state.ui.txFilters || { search: '', type: '', categoryId: '', paymentMethod: '', dateFrom: '', dateTo: '' };
  
  let filteredTxs = [...state.transactions];
  
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    filteredTxs = filteredTxs.filter(t => 
      (t.description && t.description.toLowerCase().includes(q)) || 
      String(t.amount).includes(q)
    );
  }
  
  if (filters.type) {
    filteredTxs = filteredTxs.filter(t => t.type === filters.type);
  }
  
  if (filters.categoryId) {
    filteredTxs = filteredTxs.filter(t => t.categoryId === filters.categoryId);
  }
  
  if (filters.paymentMethod) {
    filteredTxs = filteredTxs.filter(t => t.paymentMethod === filters.paymentMethod);
  }
  
  if (filters.dateFrom) {
    filteredTxs = filteredTxs.filter(t => {
      const txDateClean = window.getCleanDate(t.transactionDateTime || t.createdAt);
      return txDateClean && txDateClean >= filters.dateFrom;
    });
  }
  
  if (filters.dateTo) {
    filteredTxs = filteredTxs.filter(t => {
      const txDateClean = window.getCleanDate(t.transactionDateTime || t.createdAt);
      return txDateClean && txDateClean <= filters.dateTo;
    });
  }

  // Отрисовка строк таблицы для десктопа
  const pcTransactionsRows = filteredTxs.length === 0
    ? `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">Ничего не найдено</td></tr>`
    : filteredTxs.map(t => {
        const isIncome = t.type === 'income';
        const color = isIncome ? '#10b981' : '#ef4444';
        const sign = isIncome ? '+' : '—';
        
        // Find category name
        const cats = state.transactionCategories || [];
        const cat = cats.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : (isIncome ? 'Приход' : 'Расход');
        
        // Find wallet name
        const wallets = state.wallets || [];
        const wallet = wallets.find(w => w.id === t.paymentMethod) || {name: t.paymentMethod, icon: '💰'};

        return `
          <tr onclick="window.showTransactionDetailsModal('${t.id}')" style="cursor: pointer; transition: all 0.2s ease;">
            <td data-label="Дата">${formatDate(t.transactionDateTime || t.createdAt)}</td>
            <td data-label="Тип">
              <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">${catName}</span>
            </td>
            <td data-label="Назначение" style="font-weight: 600; text-align: left; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.description}</td>
            <td data-label="Оплата">${wallet.icon} ${wallet.name}</td>
            <td data-label="Сумма" style="font-weight: 800; color: ${color};">${sign}${formatPrice(t.amount)}</td>
            <td style="text-align: right;" onclick="event.stopPropagation();">
              <div style="display: inline-flex; gap: 4px;">
                <button onclick="window.showTransactionDetailsModal('${t.id}')" class="btn" style="padding: 4px; color: var(--text-secondary); background: none; border: none; cursor: pointer;" title="Просмотр">
                  <i data-feather="eye" style="width: 14px; height: 14px;"></i>
                </button>
                <button onclick="window.showEditTransactionModal('${t.id}')" class="btn" style="padding: 4px; color: var(--primary); background: none; border: none; cursor: pointer;" title="Редактировать">
                  <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                </button>
                <button onclick="window.handleDeleteTransaction('${t.id}')" class="btn" style="padding: 4px; color: #ef4444; background: none; border: none; cursor: pointer;" title="Удалить">
                  <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

  // Отрисовка карточек для мобильных
  const mobileTransactionsCards = filteredTxs.length === 0
    ? `<div style="text-align: center; padding: 30px; color: var(--text-secondary);">Ничего не найдено</div>`
    : filteredTxs.map(t => {
        const isIncome = t.type === 'income';
        const color = isIncome ? '#10b981' : '#ef4444';
        const sign = isIncome ? '+' : '—';
        
        // Find category name
        const cats = state.transactionCategories || [];
        const cat = cats.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : (isIncome ? 'Приход' : 'Расход');
        
        // Find wallet name
        const wallets = state.wallets || [];
        const wallet = wallets.find(w => w.id === t.paymentMethod) || {name: t.paymentMethod, icon: '💰'};

        return `
          <div class="card p-4" onclick="window.showTransactionDetailsModal('${t.id}')" style="cursor: pointer; display: flex; flex-direction: column; gap: 8px; border-left: 4px solid ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">${catName}</span>
              <span style="font-size: 11px; color: var(--text-secondary);">${formatDate(t.transactionDateTime || t.createdAt)}</span>
            </div>
            <div style="font-weight: 700; color: var(--text); font-size: 14px; line-height: 1.3;">${t.description}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 4px;">
              <span style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                <span>${wallet.icon}</span> <span>${wallet.name}</span>
              </span>
              <span style="font-weight: 800; color: ${color}; font-size: 15px;">${sign}${formatPrice(t.amount)}</span>
            </div>
          </div>
        `;
      }).join('');

  const showTxFilters = state.ui.showTxFilters || false;
  const activeFiltersCount = [
    filters.search,
    filters.type,
    filters.categoryId,
    filters.paymentMethod,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Кнопка управления фильтрами -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; gap: 8px;">
        <button onclick="setUI({ showTxFilters: !state.ui.showTxFilters })" class="btn btn-secondary animate-scale-in" style="width: auto; padding: 6px 12px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-color: var(--border); background: var(--bg-secondary); color: var(--text);">
          <i data-feather="sliders" style="width: 14px; height: 14px; color: ${showTxFilters ? 'var(--primary)' : 'var(--text-secondary)'};"></i>
          <span>Фильтры</span>
          ${activeFiltersCount > 0 ? `<span style="background: var(--primary); color: white; font-size: 10px; font-weight: 800; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-left: 2px;">${activeFiltersCount}</span>` : ''}
        </button>
        
        ${activeFiltersCount > 0 ? `
          <button onclick="window.setTxFilters({ search: '', type: '', categoryId: '', paymentMethod: '', dateFrom: '', dateTo: '' })" class="btn btn-secondary animate-scale-in" style="padding: 6px 10px; font-size: 13px; width: auto; display: inline-flex; align-items: center; gap: 4px; border-radius: 12px; color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05);" title="Сбросить фильтры">
            <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> <span class="hidden md-inline">Сбросить</span>
          </button>
        ` : ''}
      </div>

      <!-- Сворачиваемая панель фильтров -->
      ${showTxFilters ? `
      <div class="glass-interactive-card p-4 animate-scale-in" style="display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          <!-- Поиск -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Поиск</label>
            <div style="position: relative; margin-top: 4px;">
              <input type="text" placeholder="Описание или сумма..." class="form-input" style="padding-left: 32px;" value="${filters.search || ''}" oninput="window.setTxFilters({ search: this.value })">
              <i data-feather="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--text-secondary);"></i>
            </div>
          </div>
          
          <!-- Тип -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Тип</label>
            <select class="form-select" style="margin-top: 4px;" onchange="window.setTxFilters({ type: this.value })">
              <option value="">Все операции</option>
              <option value="income" ${filters.type === 'income' ? 'selected' : ''}>📈 Приходы</option>
              <option value="expense" ${filters.type === 'expense' ? 'selected' : ''}>📉 Расходы</option>
            </select>
          </div>
          
          <!-- Статья -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Статья</label>
            <select class="form-select" style="margin-top: 4px;" onchange="window.setTxFilters({ categoryId: this.value })">
              <option value="">Все статьи</option>
              ${(state.transactionCategories || []).map(c => `<option value="${c.id}" ${filters.categoryId === c.id ? 'selected' : ''}>${c.type === 'income' ? '📈' : '📉'} ${c.name}</option>`).join('')}
            </select>
          </div>
          
          <!-- Кошелек -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Кошелек</label>
            <select class="form-select" style="margin-top: 4px;" onchange="window.setTxFilters({ paymentMethod: this.value })">
              <option value="">Все кошельки</option>
              ${(state.wallets || []).map(w => `<option value="${w.id}" ${filters.paymentMethod === w.id ? 'selected' : ''}>${w.icon} ${w.name}</option>`).join('')}
            </select>
          </div>
          
          <!-- Дата С -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Дата с</label>
            <input type="date" class="form-input" style="margin-top: 4px;" value="${filters.dateFrom || ''}" onchange="window.setTxFilters({ dateFrom: this.value })">
          </div>
          
          <!-- Дата По -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary);">Дата по</label>
            <input type="date" class="form-input" style="margin-top: 4px;" value="${filters.dateTo || ''}" onchange="window.setTxFilters({ dateTo: this.value })">
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Десктопная таблица -->
      <div class="hidden md-block glass-interactive-card p-6">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Категория</th>
                <th style="text-align: left;">Назначение</th>
                <th>Кошелек</th>
                <th>Сумма</th>
                <th style="width: 100px;"></th>
              </tr>
            </thead>
            <tbody>
              ${pcTransactionsRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Мобильная лента карточек -->
      <div class="md-hidden" style="display: flex; flex-direction: column; gap: 12px;">
        ${mobileTransactionsCards}
      </div>
    </div>
  `;
};

// ============================================
// Вкладка: Кошельки
// ============================================
window.renderFinanceWallets = function () {
  const wallets = state.wallets || [];

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
  const categories = state.transactionCategories || [];

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
  setUI({ modal: 'createTransaction', modalData: { type: 'income', paymentMethod: 'cash', categoryId: '', amount: '', description: '' } });
};

window.showEditTransactionModal = function (id) {
  const t = state.transactions.find(tx => tx.id === id);
  if (t) {
    setUI({ modal: 'createTransaction', modalData: { ...t } });
  }
};

window.renderTransactionModal = function () {
  const md = state.ui.modalData || { type: 'income', paymentMethod: 'cash', categoryId: '', amount: '', description: '' };
  const isEdit = !!md.id;
  
  const wallets = state.wallets || [];
  const categories = state.transactionCategories || [];
  
  const filteredCats = categories.filter(c => c.type === md.type);

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 450px; width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${isEdit ? 'Редактирование операции' : 'Ввод транзакции'}</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>

      <form id="tx-form" onsubmit="event.preventDefault(); handleTransactionSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Тип транзакции</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'income', categoryId: '' } })" class="btn ${md.type === 'income' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📈 Приход</button>
            <button type="button" onclick="setUI({ modalData: { ...state.ui.modalData, type: 'expense', categoryId: '' } })" class="btn ${md.type === 'expense' ? 'btn-primary' : 'btn-secondary'}" style="flex: 1; padding: 10px; font-size: 13px;">📉 Расход</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Статья</label>
          <select id="tx-category" class="form-select" onchange="state.ui.modalData.categoryId = this.value" required>
            <option value="" disabled ${!md.categoryId ? 'selected' : ''}>Выберите статью...</option>
            ${filteredCats.map(c => `<option value="${c.id}" ${md.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Сумма (сом)</label>
          <input type="number" id="tx-amount" class="form-input" placeholder="1000" min="1" value="${md.amount || ''}" oninput="state.ui.modalData.amount = this.value" required>
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
          <input type="text" id="tx-desc" class="form-input" placeholder="Комментарий к операции..." value="${md.description || ''}" oninput="state.ui.modalData.description = this.value" required>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Подтвердить и внести'}
        </button>
      </form>
    </div>
  `;
};

window.handleTransactionSubmit = async function () {
  const id = state.ui.modalData.id;
  const isEdit = !!id;
  
  const type = state.ui.modalData.type;
  const amount = parseFloat(state.ui.modalData.amount) || 0;
  const paymentMethod = state.ui.modalData.paymentMethod;
  const categoryId = state.ui.modalData.categoryId;
  const description = state.ui.modalData.description ? state.ui.modalData.description.trim() : '';

  if (!categoryId) {
    showToast('Выберите статью расходов/доходов', 'error');
    return;
  }
  if (amount <= 0) {
    showToast('Введите корректную сумму', 'error');
    return;
  }
  if (!description) {
    showToast('Введите описание транзакции', 'error');
    return;
  }

  const transactionDateTime = isEdit ? (state.ui.modalData.transactionDateTime || window.formatDateTimeRU(new Date())) : window.formatDateTimeRU(new Date());

  const activeShift = state.shifts.find(s => s.status === 'open');
  const shiftId = activeShift ? activeShift.id : null;

  const optimisticTx = {
    id: isEdit ? id : 'tx_tmp_' + Date.now(),
    type,
    amount,
    description,
    paymentMethod,
    categoryId,
    bookingId: isEdit ? (state.ui.modalData.bookingId || '') : '',
    shiftId: isEdit ? (state.ui.modalData.shiftId || shiftId) : shiftId,
    transactionDateTime,
    createdAt: isEdit ? (state.ui.modalData.createdAt || transactionDateTime) : transactionDateTime,
    updatedAt: window.formatDateTimeRU(new Date())
  };

  // Мгновенное обновление UI (Optimistic Update)
  let oldTx = null;
  if (isEdit) {
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      oldTx = { ...state.transactions[idx] };
      state.transactions[idx] = optimisticTx;
    }
  } else {
    state.transactions.unshift(optimisticTx);
  }
  
  setUI({ modal: null, modalData: null });
  showToast(isEdit ? 'Операция успешно изменена' : 'Транзакция успешно зафиксирована', 'success');

  const apiCall = isEdit
    ? api.updateTransaction(id, { type, amount, description, paymentMethod, categoryId, transactionDateTime, shiftId: optimisticTx.shiftId }, { background: true })
    : api.createTransaction({ type, amount, description, paymentMethod, categoryId, transactionDateTime, shiftId: optimisticTx.shiftId }, { background: true });

  apiCall.then(savedTx => {
    if (!isEdit && savedTx && savedTx.id) {
      const idx = state.transactions.findIndex(t => t.id === optimisticTx.id);
      if (idx !== -1) {
        state.transactions[idx].id = savedTx.id;
        if (window.render) window.render();
      }
    }
  }).catch(e => {
    showToast(isEdit ? 'Не удалось изменить транзакцию на сервере' : 'Не удалось сохранить транзакцию', 'error');
    if (isEdit && oldTx) {
      const idx = state.transactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        state.transactions[idx] = oldTx;
      }
    } else {
      state.transactions = state.transactions.filter(t => t.id !== optimisticTx.id);
    }
    if (window.render) window.render();
  });
};

window.showTransactionDetailsModal = function (id) {
  setUI({ modal: 'viewTransaction', modalData: { id } });
};

window.renderTransactionDetailsModal = function () {
  const id = state.ui.modalData?.id;
  const t = state.transactions.find(tx => tx.id === id);
  if (!t) return `<div>Операция не найдена</div>`;
  
  const isIncome = t.type === 'income';
  const color = isIncome ? '#10b981' : '#ef4444';
  const sign = isIncome ? '+' : '—';
  const cat = state.transactionCategories?.find(c => c.id === t.categoryId);
  const catName = cat ? cat.name : (isIncome ? 'Приход' : 'Расход');
  const wallet = state.wallets?.find(w => w.id === t.paymentMethod) || {name: t.paymentMethod, icon: '💰'};
  
  let shiftInfo = 'Вне кассовой смены';
  if (t.shiftId) {
    const shift = state.shifts.find(s => s.id === t.shiftId);
    if (shift) {
      shiftInfo = `Смена №${shift.id.substring(0, 5)} (${shift.date})`;
    }
  }

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 450px; width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Детали операции</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>
      
      <div style="text-align: center; padding: 16px 0; border-bottom: 1px solid var(--border);">
        <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Сумма операции</div>
        <div style="font-size: 32px; font-weight: 800; color: ${color}; margin-top: 6px;">${sign}${formatPrice(t.amount)}</div>
        <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}" style="margin-top: 8px; font-size: 12px; padding: 4px 10px;">${catName}</span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border); padding-bottom: 8px;">
          <span style="color: var(--text-secondary);">Дата и время:</span>
          <span style="font-weight: 600; color: var(--text);">${formatDate(t.createdAt)} в ${new Date(t.createdAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border); padding-bottom: 8px;">
          <span style="color: var(--text-secondary);">Кошелек:</span>
          <span style="font-weight: 600; color: var(--text);">${wallet.icon} ${wallet.name}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border); padding-bottom: 8px;">
          <span style="color: var(--text-secondary);">Смена:</span>
          <span style="font-weight: 600; color: var(--text);">${shiftInfo}</span>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="color: var(--text-secondary);">Описание / Комментарий:</span>
          <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; font-weight: 600; color: var(--text); min-height: 50px;">
            ${t.description || '—'}
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 10px;">
        <button onclick="window.handleDeleteTransaction('${t.id}')" class="btn btn-secondary" style="flex: 1; border-color: rgba(239,68,68,0.3); color: #ef4444; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> Удалить
        </button>
        <button onclick="window.showEditTransactionModal('${t.id}')" class="btn btn-primary" style="flex: 1; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i data-feather="edit-2" style="width: 14px; height: 14px;"></i> Изменить
        </button>
      </div>
    </div>
  `;
};

window.handleDeleteTransaction = async function (id) {
  const t = state.transactions.find(tx => tx.id === id);
  if (!t) return;
  
  if (!confirm('Вы действительно хотите удалить эту операцию?')) return;
  
  const oldIdx = state.transactions.findIndex(tx => tx.id === id);
  if (oldIdx === -1) return;
  
  const deletedTx = { ...state.transactions[oldIdx] };
  
  // Optimistic UI
  state.transactions.splice(oldIdx, 1);
  setUI({ modal: null, modalData: null });
  showToast('Операция удалена', 'success');
  
  api.deleteTransaction(id, { background: true })
    .catch(e => {
      showToast('Не удалось удалить операцию на сервере', 'error');
      // Откат
      state.transactions.splice(oldIdx, 0, deletedTx);
      if (window.render) window.render();
    });
};

// Смены (Modal functions)
window.getSuggestedOpeningCash = function(selectedDateStr) {
  if (!selectedDateStr) return 0;
  const closedShifts = (state.shifts || []).filter(s => s.status === 'closed');
  if (closedShifts.length === 0) return 0;
  
  // Сортируем закрытые смены хронологически (по возрастанию)
  closedShifts.sort((a, b) => window.parseShiftDateTimeStr(a.date || a.openedAt, a.openedAt) - window.parseShiftDateTimeStr(b.date || b.openedAt, b.openedAt));
  
  const selectedDate = new Date(selectedDateStr);
  selectedDate.setHours(0, 0, 0, 0);
  
  let lastClosingCash = 0;
  let foundPrior = false;
  
  for (const s of closedShifts) {
    const sDate = window.parseShiftDateTimeStr(s.date || s.openedAt, s.openedAt);
    sDate.setHours(0, 0, 0, 0);
    if (sDate < selectedDate) {
      lastClosingCash = parseFloat(s.closingCash) || 0;
      foundPrior = true;
    }
  }
  
  // Если не нашлось смены до этой даты, по умолчанию берем последнюю закрытую смену
  if (!foundPrior && closedShifts.length > 0) {
    lastClosingCash = parseFloat(closedShifts[closedShifts.length - 1].closingCash) || 0;
  }
  
  return lastClosingCash;
};

window.handleOpenShiftDateChange = function(selectedDate) {
  const suggestedCash = window.getSuggestedOpeningCash(selectedDate);
  setUI({
    modalData: {
      ...state.ui.modalData,
      date: selectedDate,
      openingCash: suggestedCash.toString()
    }
  });
};

window.showOpenShiftModal = function () {
  const todayStr = new Date().toISOString().split('T')[0];
  const suggestedCash = window.getSuggestedOpeningCash(todayStr);
  setUI({ 
    modal: 'openShift', 
    modalData: { 
      date: todayStr, 
      openingCash: suggestedCash.toString() 
    } 
  }); 
};

window.renderOpenShiftModal = function () {
  const md = state.ui.modalData || { date: new Date().toISOString().split('T')[0], openingCash: '0' };
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Открытие кассовой смены</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>
      <form onsubmit="event.preventDefault(); handleOpenShiftSubmit();" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Дата смены</label>
          <input type="date" id="shift-date" class="form-input" value="${md.date}" onchange="window.handleOpenShiftDateChange(this.value)" required style="font-weight: 600;">
        </div>
        
        <div class="form-group">
          <label class="form-label">Входящий остаток в кассе (наличные)</label>
          <input type="number" id="shift-opening-cash" class="form-input" placeholder="0" value="${md.openingCash}" min="0" oninput="state.ui.modalData.openingCash = this.value" required style="font-weight: 700; font-size: 16px;">
          <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Сумма перенесена автоматически из закрывающего остатка предыдущей смены.</p>
        </div>
        
        <button type="submit" class="btn btn-primary" style="background: #10b981; margin-top: 10px;">
          🚀 Запустить смену
        </button>
      </form>
    </div>
  `;
};

window.handleOpenShiftSubmit = async function () {
  const date = state.ui.modalData.date;
  const openingCash = parseFloat(state.ui.modalData.openingCash) || 0;
  
  // Преобразуем выбранную дату для оптимистичного рендеринга
  const dParts = date.split('-');
  const dateRU = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;
  
  // Проверка на дубликат на фронтенде перед отправкой запроса
  const duplicate = (state.shifts || []).find(s => {
    const parseShiftDateStr = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (parts) {
        return `${parts[1]}.${parts[2]}.${parts[3]}`;
      }
      // If ISO
      const partsISO = dateStr.split('T')[0].split('-');
      if (partsISO.length === 3) {
        return `${partsISO[2]}.${partsISO[1]}.${partsISO[0]}`;
      }
      return dateStr;
    };
    return parseShiftDateStr(s.openedAt) === dateRU || parseShiftDateStr(s.date) === dateRU;
  });

  if (duplicate) {
    showToast(`Смена за дату ${dateRU} уже существует (№${duplicate.id.substring(0, 5)})`, 'error', 5000);
    return;
  }
  
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const openedAtRU = `${dateRU} ${hours}:${minutes}:${seconds}`;
  
  const optimisticShift = {
    id: 'shift_tmp_' + Date.now(),
    date: dateRU,
    openedAt: openedAtRU,
    openingCash,
    status: 'open'
  };

  // Optimistic UI
  state.shifts.unshift(optimisticShift);
  setUI({ modal: null });
  showToast('Смена успешно открыта!', 'success');

  api.openShift(openingCash, date, { background: true })
    .catch(e => {
      showToast(e.message || 'Не удалось открыть смену', 'error');
      state.shifts = state.shifts.filter(s => s.id !== optimisticShift.id);
      if (window.render) window.render();
    });
};

window.showCloseShiftModal = function (id) { setUI({ modal: 'closeShift', modalData: { id: id, closingCash: '' } }); };
window.renderCloseShiftModal = function () {
  const md = state.ui.modalData || {};
  const shiftId = md.id;
  const shift = state.shifts.find(s => s.id === shiftId);
  
  const shiftDateClean = shift ? window.getCleanDate(shift.date || shift.openedAt) : '';
  const shiftTxs = (state.transactions || []).filter(t => {
    if (t.shiftId && shift.id) return t.shiftId === shift.id;
    const txDateClean = window.getCleanDate(t.transactionDateTime || t.createdAt);
    return txDateClean === shiftDateClean;
  });
  
  const cashWallet = (state.wallets || []).find(w => w.type === 'cash' || w.name === 'Наличные');
  const cashWalletId = cashWallet ? cashWallet.id : 'cash';
  
  let cashIncome = 0;
  let cashExpense = 0;
  
  shiftTxs.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.paymentMethod === cashWalletId || t.paymentMethod === 'cash') {
      if (t.type === 'income') cashIncome += amt;
      else if (t.type === 'expense') cashExpense += amt;
    }
  });
  
  const expectedCash = parseFloat(shift.openingCash) + cashIncome - cashExpense;
  const actualCash = parseFloat(md.closingCash);
  const deviation = !isNaN(actualCash) ? (actualCash - expectedCash) : 0;
  
  let deviationHtml = '';
  let disableSubmit = true;
  let adjustBtnHtml = '';

  if (!isNaN(actualCash)) {
    if (Math.abs(deviation) < 0.01) {
      deviationHtml = '<span style="color: #10b981; font-weight: 700;">✅ Касса сходится (Отклонение: 0)</span>';
      disableSubmit = false;
    } else if (deviation < 0) {
      deviationHtml = `<span style="color: #ef4444; font-weight: 700;">❌ Недостача: ${formatPrice(Math.abs(deviation))}</span>`;
      adjustBtnHtml = `<button type="button" class="btn btn-secondary" onclick="window.handleAutoAdjustShift(${deviation})" style="margin-top: 8px; width: 100%; border-color: rgba(239,68,68,0.3); color: #ef4444;">Оформить недостачу</button>`;
    } else {
      deviationHtml = `<span style="color: #eab308; font-weight: 700;">⚠️ Излишек: ${formatPrice(Math.abs(deviation))}</span>`;
      adjustBtnHtml = `<button type="button" class="btn btn-secondary" onclick="window.handleAutoAdjustShift(${deviation})" style="margin-top: 8px; width: 100%; border-color: rgba(234,179,8,0.3); color: #eab308;">Оприходовать излишек</button>`;
    }
  }

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Закрытие кассовой смены</h3>
        <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
      </div>
      
      <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between;"><span>Остаток на начало:</span> <span style="font-weight: 600;">${formatPrice(parseFloat(shift.openingCash))}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Приходы (наличные):</span> <span style="font-weight: 600; color: #10b981;">+${formatPrice(cashIncome)}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>Расходы (наличные):</span> <span style="font-weight: 600; color: #ef4444;">-${formatPrice(cashExpense)}</span></div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-size: 15px;">
          <span style="font-weight: 700;">Ожидаемый остаток:</span> <span style="font-weight: 800; color: var(--primary);">${formatPrice(expectedCash)}</span>
        </div>
      </div>

      <form onsubmit="event.preventDefault(); handleCloseShiftSubmit('${md.id}');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label" style="font-weight: 700;">Фактический остаток наличных (инкассация)</label>
          <input type="number" id="shift-closing-cash" class="form-input" placeholder="Сумма в сом" min="0" step="0.01" value="${md.closingCash || ''}" oninput="state.ui.modalData.closingCash = this.value; if(window.render) window.render();" required style="font-size: 18px; font-weight: 800;">
        </div>
        
        <div id="shift-deviation-text" style="font-size: 14px; text-align: center;">
          ${deviationHtml}
        </div>
        
        ${adjustBtnHtml}

        <p style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-top: 8px;">Система не позволит закрыть смену при наличии отклонений.</p>
        <button type="submit" class="btn btn-primary" style="background: #dc2626;" ${disableSubmit ? 'disabled' : ''}>
          🔒 Закрыть смену и сдать отчет
        </button>
      </form>
    </div>
  `;
};

window.handleAutoAdjustShift = async function(deviation) {
  const md = state.ui.modalData || {};
  const shiftId = md.id;
  const cashWallet = (state.wallets || []).find(w => w.type === 'cash' || w.name === 'Наличные');
  const cashWalletId = cashWallet ? cashWallet.id : 'cash';
  
  const isSurplus = deviation > 0;
  const type = isSurplus ? 'income' : 'expense';
  const amount = Math.abs(deviation);
  
  const txData = {
    type: type,
    amount: amount,
    paymentMethod: cashWalletId,
    description: isSurplus ? 'Авто-корректировка (излишек)' : 'Авто-корректировка (недостача)',
    shiftId: shiftId
  };
  
  try {
    showToast('Создание корректировки...', 'info');
    await api.createTransaction(txData);
    
    // Синхронизация для подтягивания новой транзакции
    await window.forceSync();
    showToast('Касса выровнена. Вы можете закрыть смену.', 'success');
  } catch (e) {
    showToast(e.message || 'Ошибка создания корректировки', 'error');
  }
};

window.handleCloseShiftSubmit = async function (id) {
  const shift = state.shifts.find(s => s.id === id);
  const shiftDateClean = shift ? window.getCleanDate(shift.date || shift.openedAt) : new Date().toISOString().split('T')[0];
  const activeTodayBookings = state.bookings.filter(b => {
    const bDateClean = window.getCleanDate(b.date);
    return bDateClean === shiftDateClean && (b.status === 'pending' || b.status === 'confirmed');
  });

  if (activeTodayBookings.length > 0) {
    const prettyDate = shiftDateClean.split('-').reverse().join('.');
    return showToast(`Нельзя закрыть смену: на дату ${prettyDate} есть необработанные записи (в статусе "Записан" или "Подтверждён")`, 'error', 5000);
  }

  const closingCash = parseFloat(state.ui.modalData.closingCash) || 0;
  
  const idx = state.shifts.findIndex(s => s.id === id);
  if (idx !== -1) {
    state.shifts[idx].status = 'closed';
    state.shifts[idx].closedAt = new Date().toISOString();
    state.shifts[idx].closingCash = closingCash;
    if (window.render) window.render();
  }

  setUI({ modal: null, modalData: null });
  showToast('Смена успешно закрыта. Отчет сдан!', 'success');

  api.closeShift(id, closingCash, { background: true })
    .catch(e => {
      showToast('Не удалось закрыть смену', 'error');
      if (idx !== -1) {
        state.shifts[idx].status = 'open';
        delete state.shifts[idx].closedAt;
        delete state.shifts[idx].closingCash;
        if (window.render) window.render();
      }
    });
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
          <input type="text" id="cat-name" class="form-input" placeholder="Например: Закупка материалов" value="${md.name}" oninput="state.ui.modalData.name = this.value" required>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Добавить'}
        </button>
      </form>
    </div>
  `;
};

window.handleCategorySubmit = function() {
  const name = state.ui.modalData.name ? state.ui.modalData.name.trim() : '';
  const md = state.ui.modalData;
  const cats = [...(state.transactionCategories || [])];
  
  if (!name) {
    showToast('Введите название статьи', 'error');
    return;
  }

  const apiCall = md.id
    ? api.updateTransactionCategory(md.id, { name, type: md.type })
    : api.createTransactionCategory({ name, type: md.type });

  if (md.id) {
    const idx = cats.findIndex(c => c.id === md.id);
    if (idx !== -1) {
      cats[idx].name = name;
      cats[idx].type = md.type;
    }
  } else {
    cats.push({ id: 'cat_tmp_' + Date.now(), name, type: md.type });
  }

  setState({ transactionCategories: cats });
  setUI({ modal: null });
  showToast('Сохранение статьи (синхронизация...)', 'info');

  apiCall.then(savedCat => {
    if (!md.id) {
      const updatedCats = state.transactionCategories.map(c => c.id.startsWith('cat_tmp_') && c.name === savedCat.name ? savedCat : c);
      setState({ transactionCategories: updatedCats });
    }
    showToast('Статья успешно сохранена', 'success');
  }).catch(e => {
    showToast('Не удалось сохранить', 'error');
  });
};

window.showEditCategoryModal = function(id) {
  const cats = state.transactionCategories || [];
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
          <input type="text" id="wallet-name" class="form-input" placeholder="Например: Карта Optima" value="${md.name}" oninput="state.ui.modalData.name = this.value" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Иконка (Emoji)</label>
          <input type="text" id="wallet-icon" class="form-input" placeholder="💳" value="${md.icon}" oninput="state.ui.modalData.icon = this.value" required maxlength="2">
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          ${isEdit ? 'Сохранить изменения' : 'Добавить'}
        </button>
      </form>
    </div>
  `;
};

window.handleWalletSubmit = function() {
  const name = state.ui.modalData.name ? state.ui.modalData.name.trim() : '';
  const icon = state.ui.modalData.icon ? state.ui.modalData.icon.trim() : '💰';
  const md = state.ui.modalData;
  const wallets = [...(state.wallets || [])];
  
  if (!name) {
    showToast('Введите название кошелька', 'error');
    return;
  }

  const apiCall = md.id
    ? api.updateWallet(md.id, { name, icon, type: md.type })
    : api.createWallet({ name, icon, type: md.type });

  if (md.id) {
    const idx = wallets.findIndex(w => w.id === md.id);
    if (idx !== -1) {
      wallets[idx].name = name;
      wallets[idx].icon = icon;
    }
  } else {
    wallets.push({ id: 'wallet_tmp_' + Date.now(), name, icon: icon, type: md.type });
  }

  setState({ wallets: wallets });
  setUI({ modal: null });
  showToast('Сохранение кошелька (синхронизация...)', 'info');

  apiCall.then(savedWallet => {
    if (!md.id) {
      const updatedWallets = state.wallets.map(w => w.id.startsWith('wallet_tmp_') && w.name === savedWallet.name ? savedWallet : w);
      setState({ wallets: updatedWallets });
    }
    showToast('Кошелек успешно сохранен', 'success');
  }).catch(e => {
    showToast('Не удалось сохранить', 'error');
  });
};

window.showEditWalletModal = function(id) {
  const wallets = state.wallets || [];
  const w = wallets.find(w => w.id === id);
  if (w) {
    setUI({ modal: 'createWallet', modalData: { ...w } });
  }
};

window.handleReopenShift = async function (id) {
  const activeShift = state.shifts.find(s => s.status === 'open');
  if (activeShift) {
    return showToast('Нельзя переоткрыть смену: сначала закройте текущую открытую смену', 'error', 4000);
  }

  const idx = state.shifts.findIndex(s => s.id === id);
  if (idx === -1) return;

  if (!confirm('Вы действительно хотите переоткрыть смену №' + id.substring(0, 5) + '?')) return;

  const oldStatus = state.shifts[idx].status;
  const oldClosedAt = state.shifts[idx].closedAt;
  const oldClosingCash = state.shifts[idx].closingCash;

  // Optimistic UI update
  state.shifts[idx].status = 'open';
  delete state.shifts[idx].closedAt;
  state.shifts[idx].closingCash = 0;
  
  if (window.render) window.render();
  showToast('Смена переоткрыта!', 'success');

  api.reopenShift(id, { background: true })
    .catch(e => {
      showToast(e.message || 'Не удалось переоткрыть смену на сервере', 'error');
      state.shifts[idx].status = oldStatus;
      state.shifts[idx].closedAt = oldClosedAt;
      state.shifts[idx].closingCash = oldClosingCash;
      if (window.render) window.render();
    });
};

// ============================================
// Детали смены
// ============================================

window.showShiftDetailsModal = function (shiftId) {
  setUI({ modal: 'viewShift', modalData: { shiftId } });
};

window.renderShiftDetailsModal = function () {
  const shiftId = state.ui.modalData?.shiftId;
  const shift = state.shifts.find(s => s.id === shiftId);
  
  if (!shift) return `<div>Смена не найдена</div>`;
  
  const shiftDateClean = window.getCleanDate(shift.date || shift.openedAt);
  const shiftTxs = state.transactions.filter(t => {
    if (t.shiftId && shift.id) return t.shiftId === shift.id;
    const txDateClean = window.getCleanDate(t.transactionDateTime || t.createdAt);
    return txDateClean === shiftDateClean;
  });
  const isOpen = shift.status === 'open';
  
  // Подсчет статистики наличных/безналичных операций
  const cashWallet = (state.wallets || []).find(w => w.type === 'cash' || w.name === 'Наличные');
  const cashWalletId = cashWallet ? cashWallet.id : 'cash';
  
  const cashTxs = shiftTxs.filter(t => t.paymentMethod === cashWalletId || t.paymentMethod === 'cash');
  const cashOpsCount = cashTxs.length;
  
  const cashIncomeTxs = cashTxs.filter(t => t.type === 'income');
  const cashIncomeSum = cashIncomeTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const cashExpenseTxs = cashTxs.filter(t => t.type === 'expense');
  const cashExpenseSum = cashExpenseTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const cashOpsSum = parseFloat(shift.openingCash || 0) + cashIncomeSum - cashExpenseSum;

  const cashlessTxs = shiftTxs.filter(t => t.paymentMethod !== cashWalletId && t.paymentMethod !== 'cash');
  const cashlessOpsCount = cashlessTxs.length;
  const cashlessOpsSum = cashlessTxs.reduce((sum, t) => {
    const amt = parseFloat(t.amount) || 0;
    return sum + (t.type === 'income' ? amt : -amt);
  }, 0);

  // Подсчет записей по статусам
  const getBookingShiftDate = (bDate) => {
    if (!bDate) return '';
    const parts = bDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return bDate;
  };
  
  const shiftBookings = (state.bookings || []).filter(b => {
    const bShiftDate = getBookingShiftDate(b.date);
    const sDate = shift.date || '';
    return bShiftDate === sDate || bShiftDate.replace(/-/g, '.') === sDate.replace(/-/g, '.');
  });

  const completedBookings = shiftBookings.filter(b => b.status === 'completed');
  const completedCount = completedBookings.length;
  const completedSum = completedBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

  const cancelledBookings = shiftBookings.filter(b => b.status === 'cancelled');
  const cancelledCount = cancelledBookings.length;
  const cancelledSum = cancelledBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  
  let incomeCash = 0;
  let incomeCard = 0;
  let expenseCash = 0;
  
  const txHtml = shiftTxs.map(t => {
    const isIncome = t.type === 'income';
    const amt = parseFloat(t.amount) || 0;
    
    if (isIncome) {
      if (t.paymentMethod === 'cash') incomeCash += amt;
      else if (t.paymentMethod === 'card') incomeCard += amt;
    } else {
      if (t.paymentMethod === 'cash') expenseCash += amt;
    }
    
    const color = isIncome ? '#10b981' : '#ef4444';
    const sign = isIncome ? '+' : '—';
    const catName = state.transactionCategories?.find(c => c.id === t.categoryId)?.name || (isIncome ? 'Приход' : 'Расход');
    const walletIcon = state.wallets?.find(w => w.id === t.paymentMethod)?.icon || '💰';
    
    // Check if it's related to a booking
    let bookingInfo = '';
    if (t.bookingId) {
      const b = state.bookings.find(bk => bk.id === t.bookingId);
      if (b) {
        bookingInfo = `<div style="font-size: 11px; color: var(--primary); margin-top: 4px;"><i data-feather="calendar" style="width: 10px; height: 10px;"></i> Запись: ${b.clientName} - ${b.serviceName}</div>`;
      }
    }
    
    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid var(--border);">
        <div>
          <div style="font-weight: 600; font-size: 13px; color: var(--text);">${catName}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${t.description}</div>
          ${bookingInfo}
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: ${color};">${sign}${formatPrice(amt)}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${walletIcon}</div>
        </div>
      </div>
    `;
  }).join('');
  
  const currentCashInDrawer = parseFloat(shift.openingCash || 0) + incomeCash - expenseCash;

  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">${window.getShiftPrettyName(shift)}</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button onclick="window.showEditShiftCashModal('${shift.id}')" style="background: none; border: none; cursor: pointer; color: var(--primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px;"><i data-feather="edit-2" style="width: 14px; height: 14px;"></i> Остатки</button>
          <button onclick="setUI({ modal: null })" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary);">✕</button>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: var(--bg-secondary); padding: 16px; border-radius: 12px;">
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">В кассе сейчас</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--text);">${formatPrice(currentCashInDrawer)}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Открыта</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text);">${window.formatShiftDateTime(shift.date || shift.openedAt, shift.openedAt)}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Длительность</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text);">${window.getShiftDuration(shift)}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Расход наличных</div>
          <div style="font-size: 16px; font-weight: 800; color: #ef4444;">-${formatPrice(expenseCash)}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Безнал (Карты)</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--primary);">${formatPrice(incomeCard)}</div>
        </div>
      </div>
      
      <!-- Статистика смены -->
      <div>
        <h4 style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border); padding-bottom: 8px;">📊 Статистика смены</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <!-- Наличные -->
          <div class="glass-interactive-card p-4" style="display: flex; flex-direction: column; gap: 4px; background: rgba(99, 102, 241, 0.05); border: 1px solid var(--border);">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">💵 Наличные операции</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text);">${formatPrice(cashIncomeSum - cashExpenseSum)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${cashOpsCount} транз. (Приход: ${formatPrice(cashIncomeSum)}, Расход: ${formatPrice(cashExpenseSum)})</div>
          </div>
          
          <!-- Безналичные -->
          <div class="glass-interactive-card p-4" style="display: flex; flex-direction: column; gap: 4px; background: rgba(99, 102, 241, 0.05); border: 1px solid var(--border);">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">💳 Безналичные операции</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text);">${formatPrice(cashlessOpsSum)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${cashlessOpsCount} транз.</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Записи: Выполнено -->
          <div class="glass-interactive-card p-4" style="display: flex; flex-direction: column; gap: 4px; border-left: 4px solid #10b981; background: rgba(16,185,129,0.03);">
            <div style="font-size: 11px; color: #10b981; text-transform: uppercase; font-weight: 700;">✅ Выполненные записи</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text);">${formatPrice(completedSum)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${completedCount} зап.</div>
          </div>
          
          <!-- Записи: Отменено -->
          <div class="glass-interactive-card p-4" style="display: flex; flex-direction: column; gap: 4px; border-left: 4px solid #ef4444; background: rgba(239,68,68,0.03);">
            <div style="font-size: 11px; color: #ef4444; text-transform: uppercase; font-weight: 700;">❌ Отмененные записи</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text);">${formatPrice(cancelledSum)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${cancelledCount} зап.</div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Транзакции за смену (${shiftTxs.length})</h4>
        <div style="display: flex; flex-direction: column;">
          ${shiftTxs.length > 0 ? txHtml : '<div style="font-size: 13px; color: var(--text-secondary); text-align: center; padding: 20px 0;">Нет транзакций</div>'}
        </div>
      </div>
      </div>
    </div>
  `;
};

window.showEditShiftCashModal = function(shiftId) {
  setUI({ modal: 'editShiftCash', modalData: { shiftId } });
};

window.renderEditShiftCashModal = function() {
  const shiftId = state.ui.modalData?.shiftId;
  const shift = state.shifts.find(s => s.id === shiftId);
  if (!shift) return `<div>Смена не найдена</div>`;
  
  const isOpen = shift.status === 'open';
  
  return `
    <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 400px; width: 100%;">
      <h3 style="font-weight: 800; font-size: 18px; color: var(--text);">Изменение остатков</h3>
      <form onsubmit="event.preventDefault(); window.handleEditShiftCashSubmit('${shift.id}')" style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Начальный остаток в кассе</label>
          <input type="number" id="edit-opening-cash" value="${shift.openingCash}" class="input-field" style="margin-top: 6px; width: 100%;" step="0.01" required>
        </div>
        ${!isOpen ? `
        <div>
          <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Фактический остаток при закрытии</label>
          <input type="number" id="edit-closing-cash" value="${shift.closingCash}" class="input-field" style="margin-top: 6px; width: 100%;" step="0.01" required>
        </div>
        ` : ''}
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button type="button" onclick="setUI({ modal: 'viewShift', modalData: { shiftId: '${shift.id}' } })" class="btn btn-secondary" style="flex: 1;">Отмена</button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">Сохранить</button>
        </div>
      </form>
    </div>
  `;
};

window.handleEditShiftCashSubmit = async function(id) {
  const openingEl = document.getElementById('edit-opening-cash');
  const closingEl = document.getElementById('edit-closing-cash');
  
  const data = {};
  if (openingEl) data.openingCash = openingEl.value;
  if (closingEl) data.closingCash = closingEl.value;
  
  try {
    setUI({ modal: null });
    showToast('Сохранение остатков...', 'info');
    await api.updateShiftCash(id, data);
    showToast('Остатки успешно обновлены', 'success');
  } catch (e) {
    showToast(e.message || 'Ошибка обновления', 'error');
  }
};
