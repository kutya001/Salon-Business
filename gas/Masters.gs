/**
 * Masters.gs — Управление мастерами салона
 */

/**
 * Получает список активных мастеров
 * @returns {object[]}
 */
function handleGetMasters() {
  var masters = getSheetData("Masters");
  // Показываем только активных мастеров
  return masters.filter(function(m) { return m.status !== "inactive"; });
}

/**
 * Добавляет нового мастера
 * @param {object} data
 * @returns {object}
 */
function handleCreateMaster(data) {
  if (!data.name) throw new Error("Имя мастера обязательно");
  
  data.status = "active";
  data.percentage = data.percentage !== undefined ? data.percentage : 40; // Процент по умолчанию
  data.workHoursStart = data.workHoursStart || "09:00";
  data.workHoursEnd = data.workHoursEnd || "20:00";
  data.workDays = data.workDays || "mon,tue,wed,thu,fri,sat";
  
  return appendRow("Masters", data);
}

/**
 * Обновляет информацию о мастере
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
function handleUpdateMaster(id, data) {
  return updateRow("Masters", id, data);
}

/**
 * Мягкое удаление мастера (перевод в статус inactive, чтобы сохранить исторические записи)
 * @param {string} id
 * @returns {object}
 */
function handleDeleteMaster(id) {
  var updated = updateRow("Masters", id, { status: "inactive" });
  return { success: !!updated };
}
