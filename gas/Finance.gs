/**
 * Finance.gs — Финансовый учет, кассовые смены и транзакции
 */

/**
 * Получает список транзакций по фильтрам
 * @param {object} filters
 * @returns {object[]}
 */
function handleGetTransactions(filters) {
  var txs = getSheetData("Transactions");
  
  if (filters.dateFrom) {
    txs = txs.filter(function(t) { return t.createdAt >= filters.dateFrom; });
  }
  if (filters.dateTo) {
    txs = txs.filter(function(t) { return t.createdAt <= filters.dateTo; });
  }
  if (filters.type) {
    txs = txs.filter(function(t) { return t.type === filters.type; });
  }
  if (filters.shiftId) {
    txs = txs.filter(function(t) { return t.shiftId === filters.shiftId; });
  }
  
  // Сортировка по дате создания (новые вверху)
  txs.sort(function(a, b) {
    return b.createdAt.localeCompare(a.createdAt);
  });
  
  return txs;
}

/**
 * Добавляет транзакцию
 * @param {object} data
 * @returns {object}
 */
function handleCreateTransaction(data) {
  if (!data.type || !data.amount || !data.paymentMethod) {
    throw new Error("Недостаточно данных для транзакции");
  }
  
  // Автоматически привязываем к открытой смене, если она есть
  var openShift = getActiveShift();
  if (openShift) {
    data.shiftId = openShift.id;
  }
  
  return appendRow("Transactions", data);
}

/**
 * Получает все смены
 * @returns {object[]}
 */
function handleGetShifts() {
  var shifts = getSheetData("Shifts");
  // Новые смены вверху
  shifts.sort(function(a, b) {
    return b.openedAt.localeCompare(a.openedAt);
  });
  return shifts;
}

/**
 * Открывает новую кассовую смену
 * @param {object} data
 * @returns {object}
 */
function handleOpenShift(data) {
  var active = getActiveShift();
  if (active) throw new Error("Уже есть открытая смена №" + active.id.substring(0, 5));
  
  var shift = {
    openedAt: new Date().toISOString(),
    closedAt: "",
    openingCash: parseFloat(data.openingCash) || 0,
    closingCash: 0,
    totalCash: 0,
    totalCard: 0,
    totalBonus: 0,
    status: "open"
  };
  
  return appendRow("Shifts", shift);
}

/**
 * Закрывает кассовую смену с подсчетом итогов
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
function handleCloseShift(id, data) {
  var shift = getSheetData("Shifts").filter(function(s) { return s.id === id; })[0];
  if (!shift) throw new Error("Смена не найдена");
  if (shift.status !== "open") throw new Error("Смена уже закрыта");
  
  // Получаем транзакции этой смены
  var txs = getSheetData("Transactions").filter(function(t) { return t.shiftId === id; });
  
  var cashIncome = 0;
  var cashExpense = 0;
  var cardIncome = 0;
  var bonusIncome = 0;
  
  txs.forEach(function(t) {
    var amt = parseFloat(t.amount) || 0;
    if (t.type === "income") {
      if (t.paymentMethod === "cash") cashIncome += amt;
      else if (t.paymentMethod === "card") cardIncome += amt;
      else if (t.paymentMethod === "bonus") bonusIncome += amt;
    } else if (t.type === "expense") {
      if (t.paymentMethod === "cash") cashExpense += amt;
    }
  });
  
  var totalCash = parseFloat(shift.openingCash) + cashIncome - cashExpense;
  
  var updates = {
    closedAt: new Date().toISOString(),
    closingCash: parseFloat(data.closingCash) || 0,
    totalCash: totalCash,
    totalCard: cardIncome,
    totalBonus: bonusIncome,
    status: "closed"
  };
  
  return updateRow("Shifts", id, updates);
}

/**
 * Вспомогательное: находит текущую активную открытую смену
 * @returns {object|null}
 */
function getActiveShift() {
  var shifts = getSheetData("Shifts");
  return shifts.filter(function(s) { return s.status === "open"; })[0] || null;
}

/**
 * Переоткрывает кассовую смену
 * @param {string} id
 * @returns {object}
 */
function handleReopenShift(id) {
  var active = getActiveShift();
  if (active) throw new Error("Уже есть открытая смена №" + active.id.substring(0, 5));
  
  var shift = getSheetData("Shifts").filter(function(s) { return s.id === id; })[0];
  if (!shift) throw new Error("Смена не найдена");
  if (shift.status !== "closed") throw new Error("Смена не находится в статусе закрытой");
  
  var updates = {
    closedAt: "",
    closingCash: 0,
    status: "open"
  };
  
  return updateRow("Shifts", id, updates);
}
