/**
 * Bookings.gs — Управление заказами/записями
 */

/**
 * Получает список записей с фильтрацией
 * @param {object} filters
 * @returns {object[]}
 */
function handleGetBookings(filters) {
  var bookings = getSheetData("Bookings");
  
  if (filters.dateFrom) {
    bookings = bookings.filter(function(b) { return b.date >= filters.dateFrom; });
  }
  if (filters.dateTo) {
    bookings = bookings.filter(function(b) { return b.date <= filters.dateTo; });
  }
  if (filters.status) {
    bookings = bookings.filter(function(b) { return b.status === filters.status; });
  }
  if (filters.masterId) {
    bookings = bookings.filter(function(b) { return b.masterId === filters.masterId; });
  }
  
  // Сортировка по дате и времени (по возрастанию)
  bookings.sort(function(a, b) {
    var dateTimeA = a.date + "T" + a.time;
    var dateTimeB = b.date + "T" + b.time;
    return dateTimeA.localeCompare(dateTimeB);
  });
  
  return bookings;
}

/**
 * Создает новую запись
 * @param {object} data
 * @returns {object}
 */
function handleCreateBooking(data) {
  if (!data.clientPhone || !data.clientName || !data.serviceId || !data.masterId || !data.date || !data.time) {
    throw new Error("Недостаточно данных для создания записи");
  }
  
  // Ищем или создаем клиента по номеру телефона
  var client = findOrCreateClient(data.clientName, data.clientPhone, data.clientEmail || "");
  data.clientId = client.id;
  
  // Получаем информацию об услуге
  var service = getSheetData("Services").filter(function(s) { return s.id === data.serviceId; })[0];
  if (!service) throw new Error("Услуга не найдена");
  data.serviceName = service.name;
  data.price = data.price || service.price;
  data.duration = data.duration || service.duration;
  
  // Получаем информацию о мастере
  if (!data.masterId) {
    data.masterName = "Любой мастер";
  } else {
    var master = getSheetData("Masters").filter(function(m) { return m.id === data.masterId; })[0];
    if (!master) throw new Error("Мастер не найден");
    data.masterName = master.name;
  }
  
  data.status = data.status || "confirmed";
  data.paymentMethod = data.paymentMethod || "cash";
  
  // Проверяем конфликты времени (опционально, но полезно)
  if (data.masterId) {
    var masterBookings = getSheetData("Bookings").filter(function(b) {
      return b.masterId === data.masterId && b.date === data.date && b.status !== "cancelled";
    });
    
    var newStart = parseTimeToMinutes(data.time);
    var newEnd = newStart + parseInt(data.duration, 10);
    
    masterBookings.forEach(function(b) {
      var start = parseTimeToMinutes(b.time);
      var end = start + parseInt(b.duration, 10);
      if ((newStart >= start && newStart < end) || (newEnd > start && newEnd <= end) || (newStart <= start && newEnd >= end)) {
        throw new Error("У мастера " + master.name + " этот временной слот (" + b.time + ") уже занят!");
      }
    });
  }
  
  // Добавляем запись
  var booking = appendRow("Bookings", data);
  
  // Обновляем статистику клиента
  updateClientStats(client.id);
  
  // Если запись сразу создана в статусе "completed" (или оплачена), фиксируем транзакцию при наличии открытой смены
  if (booking.status === "completed") {
    createIncomeTransaction(booking);
  }
  
  return booking;
}

/**
 * Обновляет запись
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
function handleUpdateBooking(id, data) {
  data.updatedAt = new Date().toISOString();
  
  // Запоминаем статус до обновления
  var currentBooking = getSheetData("Bookings").filter(function(b) { return b.id === id; })[0];
  if (!currentBooking) throw new Error("Запись не найдена");
  
  var updated = updateRow("Bookings", id, data);
  
  // Обновляем статистику клиента
  updateClientStats(updated.clientId);
  
  // Если статус изменился на "completed" только что, создаем финансовую операцию
  if (updated.status === "completed" && currentBooking.status !== "completed") {
    createIncomeTransaction(updated);
  }
  
  return updated;
}

/**
 * Удаляет запись по ID
 * @param {string} id
 * @returns {object}
 */
function handleDeleteBooking(id) {
  var booking = getSheetData("Bookings").filter(function(b) { return b.id === id; })[0];
  var success = deleteRow("Bookings", id);
  if (success && booking) {
    updateClientStats(booking.clientId);
  }
  return { success: success };
}

/**
 * Вспомогательное: переводит время "ЧЧ:ММ" в минуты от начала дня
 * @param {string} timeStr
 * @returns {number}
 */
function parseTimeToMinutes(timeStr) {
  var parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Вспомогательное: Автоматическое создание прихода при оплате записи
 * @param {object} booking
 */
function createIncomeTransaction(booking) {
  var openShift = getActiveShift();
  var shiftId = openShift ? openShift.id : "";
  
  // Проверяем, нет ли уже транзакции по этой записи
  var existing = getSheetData("Transactions").filter(function(t) {
    return t.bookingId === booking.id;
  })[0];
  
  if (!existing) {
    appendRow("Transactions", {
      type: "income",
      amount: booking.price,
      description: "Оплата записи: " + booking.serviceName + " (Клиент: " + booking.clientName + ", Мастер: " + booking.masterName + ")",
      paymentMethod: booking.paymentMethod || "cash",
      bookingId: booking.id,
      shiftId: shiftId
    });
  }
}
