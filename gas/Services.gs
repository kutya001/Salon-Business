/**
 * Services.gs — Управление каталогом услуг салона
 */

/**
 * Получает список всех категорий
 * @returns {object[]}
 */
function handleGetCategories() {
  try {
    var categories = getSheetData("Categories");
    return categories.filter(function(c) { return c.status !== "inactive"; });
  } catch (e) {
    return []; // Если таблицы нет, вернем пустой массив
  }
}

/**
 * Получает список всех активных услуг
 * @returns {object[]}
 */
function handleGetServices() {
  var services = getSheetData("Services");
  return services.filter(function(s) { return s.status !== "inactive"; });
}

/**
 * Добавляет новую услугу
 * @param {object} data
 * @returns {object}
 */
function handleCreateService(data) {
  if (!data.name || !data.categoryName || !data.price || !data.duration) {
    throw new Error("Недостаточно данных для создания услуги");
  }
  
  data.status = "active";
  return appendRow("Services", data);
}

/**
 * Обновляет услугу и логирует изменение цены
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
function handleUpdateService(id, data) {
  var currentService = getSheetData("Services").filter(function(s) { return s.id === id; })[0];
  if (!currentService) throw new Error("Услуга не найдена");
  
  var updated = updateRow("Services", id, data);
  
  // Если цена изменилась, логируем в историю цен
  if (data.price !== undefined && parseFloat(data.price) !== parseFloat(currentService.price)) {
    appendRow("PriceHistory", {
      serviceId: id,
      masterId: "", // общая цена
      oldPrice: currentService.price,
      newPrice: data.price,
      changedAt: new Date().toISOString()
    });
  }
  
  return updated;
}

/**
 * Мягкое удаление услуги
 * @param {string} id
 * @returns {object}
 */
function handleDeleteService(id) {
  var updated = updateRow("Services", id, { status: "inactive" });
  return { success: !!updated };
}
