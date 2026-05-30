/**
 * Services.gs — Управление каталогом услуг салона
 */

/**
 * Получает список всех категорий
 * @returns {object[]}
 */
function handleGetCategories() {
  try {
    var categories = getSheetData("ServiceCategories");
    return categories.filter(function(c) { return c.status !== "inactive"; });
  } catch (e) {
    return []; // Если таблицы нет, вернем пустой массив
  }
}

/**
 * Создает новую категорию
 */
function handleCreateCategory(data) {
  if (!data.name) throw new Error("Укажите название категории");
  data.status = "active";
  return appendRow("ServiceCategories", data);
}

/**
 * Обновляет категорию
 */
function handleUpdateCategory(id, data) {
  var updated = updateRow("ServiceCategories", id, data);
  if (!updated) throw new Error("Категория не найдена");
  
  // При обновлении категории также желательно обновить название категории в услугах
  // Но для MVP достаточно просто обновить категорию. При отображении услуг можно делать join.
  return updated;
}

/**
 * Удаляет категорию (мягкое удаление)
 */
function handleDeleteCategory(id) {
  var updated = updateRow("ServiceCategories", id, { status: "inactive" });
  return { success: !!updated };
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
