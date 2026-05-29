/**
 * Clients.gs — Управление базой клиентов
 */

/**
 * Получает список всех клиентов
 * @returns {object[]}
 */
function handleGetClients() {
  return getSheetData("Clients");
}

/**
 * Добавляет нового клиента
 * @param {object} data
 * @returns {object}
 */
function handleCreateClient(data) {
  if (!data.phone || !data.name) {
    throw new Error("Имя и номер телефона клиента обязательны");
  }
  
  // Проверяем уникальность телефона
  var existing = getSheetData("Clients").filter(function(c) { 
    return c.phone.toString().replace(/\D/g, "") === data.phone.toString().replace(/\D/g, ""); 
  })[0];
  
  if (existing) {
    return existing;
  }
  
  data.totalBookings = 0;
  data.totalSpent = 0;
  
  return appendRow("Clients", data);
}

/**
 * Обновляет данные клиента
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
function handleUpdateClient(id, data) {
  return updateRow("Clients", id, data);
}

/**
 * Ищет клиента по номеру телефона или создает нового
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @returns {object}
 */
function findOrCreateClient(name, phone, email) {
  var cleanPhone = phone.toString().replace(/\D/g, "");
  var clients = getSheetData("Clients");
  
  var match = clients.filter(function(c) {
    return c.phone.toString().replace(/\D/g, "") === cleanPhone;
  })[0];
  
  if (match) {
    return match;
  }
  
  return handleCreateClient({
    name: name,
    phone: phone,
    email: email || "",
    notes: "Создан автоматически при оформлении записи"
  });
}

/**
 * Обновляет агрегированную статистику по клиенту
 * @param {string} clientId
 */
function updateClientStats(clientId) {
  if (!clientId) return;
  
  var bookings = getSheetData("Bookings").filter(function(b) {
    return b.clientId === clientId && b.status !== "cancelled";
  });
  
  var completedBookings = bookings.filter(function(b) { return b.status === "completed"; });
  
  var totalBookings = bookings.length;
  var totalSpent = completedBookings.reduce(function(sum, b) {
    return sum + (parseFloat(b.price) || 0);
  }, 0);
  
  updateRow("Clients", clientId, {
    totalBookings: totalBookings,
    totalSpent: totalSpent
  });
}
