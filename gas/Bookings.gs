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
  
  enrichBookingDataWithServices(data);
  
  // Получаем информацию о мастере
  if (!data.masterId) {
    data.masterName = "Любой мастер";
  } else {
    var master = getSheetData("Masters").filter(function(m) { return m.id === data.masterId; })[0];
    if (!master) throw new Error("Мастер не найден");
    data.masterName = master.name;
    
    // Проверка занятости мастера
    checkMasterAvailability(data.masterId, data.date, data.time, parseDurationToMinutes(data.duration));
  }
  
  data.status = data.status || "confirmed";
  data.paymentMethod = data.paymentMethod || "cash";
  
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
  
  // Если изменились услуги, пересчитываем длительность и цену
  if (data.serviceId && data.serviceId !== currentBooking.serviceId) {
    enrichBookingDataWithServices(data);
  } else {
    data.duration = data.duration || currentBooking.duration;
  }
  
  // Проверяем занятость мастера при смене времени, даты или мастера
  var newMasterId = data.masterId || currentBooking.masterId;
  var newDate = data.date || currentBooking.date;
  var newTime = data.time || currentBooking.time;
  
  if (newMasterId) {
    var master = getSheetData("Masters").filter(function(m) { return m.id === newMasterId; })[0];
    if (master) {
      data.masterName = master.name;
      checkMasterAvailability(newMasterId, newDate, newTime, parseDurationToMinutes(data.duration), id);
    }
  }
  
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
 * Обогащает объект записи данными об услугах (название, цена, длительность)
 * @param {object} data 
 */
function enrichBookingDataWithServices(data) {
  if (!data.serviceId) return;
  var serviceIds = String(data.serviceId).split(",").map(function(id) { return id.trim(); });
  var services = getSheetData("Services");
  
  var totalDuration = 0;
  var totalPrice = 0;
  var serviceNames = [];
  
  serviceIds.forEach(function(id) {
    var s = services.filter(function(item) { return item.id === id; })[0];
    if (s) {
      totalDuration += parseDurationToMinutes(s.duration);
      totalPrice += parseFloat(s.price) || 0;
      serviceNames.push(s.name);
    }
  });
  
  if (serviceNames.length === 0) {
    throw new Error("Услуга не найдена");
  }
  
  data.serviceName = serviceNames.join(" + ");
  data.price = data.price || totalPrice;
  data.duration = data.duration || formatMinutesToDuration(totalDuration);
}

/**
 * Проверка доступности мастера
 * @param {string} masterId 
 * @param {string} dateStr 
 * @param {string} timeStr 
 * @param {number} durationMins 
 * @param {string} excludeBookingId 
 */
function checkMasterAvailability(masterId, dateStr, timeStr, durationMins, excludeBookingId) {
  var masterBookings = getSheetData("Bookings").filter(function(b) {
    return b.masterId === masterId && b.date === dateStr && b.status !== "cancelled" && b.id !== excludeBookingId;
  });
  
  var newStart = parseTimeToMinutes(timeStr);
  var newEnd = newStart + durationMins;
  
  masterBookings.forEach(function(b) {
    var start = parseTimeToMinutes(b.time);
    var end = start + parseDurationToMinutes(b.duration);
    if (newStart < end && newEnd > start) {
      throw new Error("Мастер занят в указанный промежуток времени");
    }
  });
}

/**
 * Вспомогательное: переводит время "ЧЧ:ММ" или "ММ" в минуты
 * @param {string|number} duration
 * @returns {number}
 */
function parseDurationToMinutes(duration) {
  if (!duration) return 60;
  if (typeof duration === 'number') return duration;
  var str = String(duration);
  if (str.indexOf(':') === -1) return parseInt(str, 10) || 60;
  var parts = str.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Вспомогательное: переводит минуты в формат "ЧЧ:ММ"
 * @param {number} mins 
 * @returns {string}
 */
function formatMinutesToDuration(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
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
