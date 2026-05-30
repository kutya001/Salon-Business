/**
 * Database.gs — Универсальный слой CRUD для работы с Google Таблицами
 */

/**
 * Получает или создает лист с указанным именем
 * @param {string} name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // Резервный вариант для автономных скриптов (Standalone scripts)
    ss = SpreadsheetApp.openById("1lEc_lOVcoZ7eEaFrtChzu4pQPwO6fU9U1rPMhgt4pgM");
  }
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Инициализирует базу данных, создавая необходимые листы и заголовки
 */
function initializeDatabase() {
  var schema = {
    "Settings": ["key", "value"],
    "Categories": ["id", "name", "description", "status", "createdAt"],
    "Masters": ["id", "name", "phone", "email", "specialization", "percentage", "workDays", "workHoursStart", "workHoursEnd", "avatar", "status", "createdAt", "services"],
    "Services": ["id", "name", "genderCategory", "categoryId", "categoryName", "price", "duration", "description", "status", "createdAt"],
    "Bookings": ["id", "clientId", "clientName", "clientPhone", "serviceId", "serviceName", "masterId", "masterName", "date", "time", "duration", "price", "status", "paymentMethod", "notes", "createdAt", "updatedAt"],
    "Clients": ["id", "name", "phone", "email", "notes", "totalBookings", "totalSpent", "createdAt"],
    "Transactions": ["id", "type", "amount", "description", "paymentMethod", "bookingId", "shiftId", "createdAt"],
    "Shifts": ["id", "openedAt", "closedAt", "openingCash", "closingCash", "totalCash", "totalCard", "totalBonus", "status"],
    "PriceHistory": ["id", "serviceId", "masterId", "oldPrice", "newPrice", "changedAt"]
  };

  for (var sheetName in schema) {
    ensureSheetHeaders(sheetName, schema[sheetName]);
  }
  
  // Заполняем настройки по умолчанию, если они пусты
  var settingsSheet = getSheet("Settings");
  if (settingsSheet.getLastRow() <= 1) {
    var defaultSettings = {
      "businessName": "Suluu Beauty",
      "description": "Студия красоты и стиля",
      "address": "г. Бишкек, ул. Токтогула 125",
      "phone": "996555123456",
      "email": "info@mybeauty.kg",
      "workSchedule": JSON.stringify({
        "mon": { "start": "09:00", "end": "20:00", "enabled": true },
        "tue": { "start": "09:00", "end": "20:00", "enabled": true },
        "wed": { "start": "09:00", "end": "20:00", "enabled": true },
        "thu": { "start": "09:00", "end": "20:00", "enabled": true },
        "fri": { "start": "09:00", "end": "20:00", "enabled": true },
        "sat": { "start": "10:00", "end": "18:00", "enabled": true },
        "sun": { "enabled": false }
      }),
      "wallets": JSON.stringify([
        { "id": "cash", "name": "Сейф (Наличные)", "icon": "💵", "type": "cash" },
        { "id": "card", "name": "Расчетный счет (Карта)", "icon": "💳", "type": "card" }
      ]),
      "categories": JSON.stringify([
        { "id": "cat_inc_1", "name": "Оплата услуг", "type": "income" },
        { "id": "cat_exp_1", "name": "Закупка материалов", "type": "expense" },
        { "id": "cat_exp_2", "name": "Зарплата", "type": "expense" }
      ])
    };
    
    for (var key in defaultSettings) {
      settingsSheet.appendRow([key, defaultSettings[key]]);
    }
  }

  // Заполняем справочник видов (ранее категорий) по умолчанию
  var categoriesSheet = getSheet("Categories");
  if (categoriesSheet.getLastRow() <= 1) {
    var defaultCategories = [
      { id: "type_1", name: "Стрижка", description: "Стрижки любой сложности", status: "active", createdAt: new Date().toISOString() },
      { id: "type_2", name: "Маникюр", description: "Уход за ногтями рук", status: "active", createdAt: new Date().toISOString() },
      { id: "type_3", name: "Педикюр", description: "Уход за ногтями ног", status: "active", createdAt: new Date().toISOString() },
      { id: "type_4", name: "Окрашивание", description: "Изменение цвета волос", status: "active", createdAt: new Date().toISOString() },
      { id: "type_5", name: "Укладка", description: "Прически и укладки", status: "active", createdAt: new Date().toISOString() },
      { id: "type_6", name: "Брови и ресницы", description: "Архитектура, окрашивание, ламинирование", status: "active", createdAt: new Date().toISOString() },
      { id: "type_7", name: "Массаж", description: "Расслабляющий, лечебный массаж", status: "active", createdAt: new Date().toISOString() },
      { id: "type_8", name: "Уход за лицом", description: "Косметология, чистка, пилинг", status: "active", createdAt: new Date().toISOString() }
    ];
    var catHeaders = schema["Categories"];
    defaultCategories.forEach(function(cat) {
      categoriesSheet.appendRow(catHeaders.map(function(h) { return cat[h] || ""; }));
    });
  }

  // Заполняем справочник мастеров по умолчанию
  var mastersSheet = getSheet("Masters");
  if (mastersSheet.getLastRow() <= 1) {
    var defaultMaster = {
      id: "master_1", name: "Айдана (Главный мастер)", phone: "555000111", email: "aidana@example.com",
      specialization: "Универсал", percentage: 50, workDays: "mon,tue,wed,thu,fri",
      workHoursStart: "09:00", workHoursEnd: "20:00", avatar: "", status: "active", createdAt: new Date().toISOString()
    };
    var masterHeaders = schema["Masters"];
    mastersSheet.appendRow(masterHeaders.map(function(h) { return defaultMaster[h] || ""; }));
  }

  // Заполняем справочник услуг по умолчанию (20 услуг)
  var servicesSheet = getSheet("Services");
  if (servicesSheet.getLastRow() <= 1) {
    var defaultServices = [
      // Мужские
      { id: "svc_m1", name: "Стрижка классическая", genderCategory: "male", categoryId: "type_1", categoryName: "Стрижка", price: 800, duration: 45, description: "Классическая мужская стрижка ножницами", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_m2", name: "Стрижка машинкой", genderCategory: "male", categoryId: "type_1", categoryName: "Стрижка", price: 500, duration: 30, description: "Стрижка под машинку", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_m3", name: "Оформление бороды", genderCategory: "male", categoryId: "type_1", categoryName: "Стрижка", price: 600, duration: 30, description: "Стрижка и окантовка бороды", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_m4", name: "Мужской маникюр", genderCategory: "male", categoryId: "type_2", categoryName: "Маникюр", price: 700, duration: 45, description: "Гигиенический маникюр для мужчин", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_m5", name: "Мужской педикюр", genderCategory: "male", categoryId: "type_3", categoryName: "Педикюр", price: 1200, duration: 60, description: "Гигиенический педикюр", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_m6", name: "Камуфляж седины", genderCategory: "male", categoryId: "type_4", categoryName: "Окрашивание", price: 1500, duration: 45, description: "Естественное закрашивание седины", status: "active", createdAt: new Date().toISOString() },
      // Женские
      { id: "svc_f1", name: "Стрижка модельная", genderCategory: "female", categoryId: "type_1", categoryName: "Стрижка", price: 1200, duration: 60, description: "Модельная женская стрижка", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f2", name: "Стрижка челки", genderCategory: "female", categoryId: "type_1", categoryName: "Стрижка", price: 300, duration: 15, description: "Коррекция челки", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f3", name: "Маникюр + Гель-лак", genderCategory: "female", categoryId: "type_2", categoryName: "Маникюр", price: 1000, duration: 90, description: "Аппаратный/комбинированный маникюр с покрытием", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f4", name: "Наращивание ногтей", genderCategory: "female", categoryId: "type_2", categoryName: "Маникюр", price: 1800, duration: 150, description: "Наращивание полигелем/гелем", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f5", name: "Педикюр эстетический", genderCategory: "female", categoryId: "type_3", categoryName: "Педикюр", price: 1500, duration: 90, description: "Обработка стоп и покрытие гель-лаком", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f6", name: "Сложное окрашивание", genderCategory: "female", categoryId: "type_4", categoryName: "Окрашивание", price: 5000, duration: 180, description: "Airtouch, шатуш, балаяж", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f7", name: "Окрашивание в один тон", genderCategory: "female", categoryId: "type_4", categoryName: "Окрашивание", price: 2500, duration: 90, description: "Тонирование/окрашивание по всей длине", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f8", name: "Вечерняя укладка", genderCategory: "female", categoryId: "type_5", categoryName: "Укладка", price: 1500, duration: 60, description: "Локоны, сложные прически", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f9", name: "Ламинирование бровей", genderCategory: "female", categoryId: "type_6", categoryName: "Брови и ресницы", price: 1200, duration: 60, description: "Долговременная укладка бровей + окрашивание", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_f10", name: "Наращивание ресниц 2D", genderCategory: "female", categoryId: "type_6", categoryName: "Брови и ресницы", price: 1800, duration: 120, description: "Объемное наращивание", status: "active", createdAt: new Date().toISOString() },
      // Любые (Unisex)
      { id: "svc_u1", name: "Массаж спины", genderCategory: "any", categoryId: "type_7", categoryName: "Массаж", price: 1500, duration: 45, description: "Лечебный массаж спины и шейно-воротниковой зоны", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_u2", name: "Антистресс массаж", genderCategory: "any", categoryId: "type_7", categoryName: "Массаж", price: 2500, duration: 90, description: "Общий расслабляющий массаж тела", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_u3", name: "Чистка лица комбинированная", genderCategory: "any", categoryId: "type_8", categoryName: "Уход за лицом", price: 2000, duration: 90, description: "Ультразвуковая + механическая чистка", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_u4", name: "Пилинг", genderCategory: "any", categoryId: "type_8", categoryName: "Уход за лицом", price: 1500, duration: 45, description: "Химический пилинг лица", status: "active", createdAt: new Date().toISOString() }
    ];
    var svcHeaders = schema["Services"];
    defaultServices.forEach(function(svc) {
      servicesSheet.appendRow(svcHeaders.map(function(h) { return svc[h] || ""; }));
    });
  }
}

/**
 * Проверяет наличие листа и устанавливает заголовки, если лист пуст
 * @param {string} sheetName
 * @param {string[]} headers
 */
function ensureSheetHeaders(sheetName, headers) {
  var sheet = getSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}

/**
 * Генерирует уникальный ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Получает все данные листа в виде массива объектов
 * @param {string} sheetName
 * @returns {object[]}
 */
function getSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 1) return [];
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      var val = row[idx];
      // Обрабатываем даты
      if (val instanceof Date) {
        // Если это дата (без времени), сохраняем как YYYY-MM-DD
        if (val.getHours() === 0 && val.getMinutes() === 0 && val.getSeconds() === 0) {
          obj[header] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          obj[header] = val.toISOString();
        }
      } else {
        obj[header] = val;
      }
    });
    return obj;
  });
}

/**
 * Добавляет строку в лист
 * @param {string} sheetName
 * @param {object} data
 * @returns {object} Добавленный объект с сгенерированным ID
 */
function appendRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  if (!data.id) data.id = generateId();
  if (!data.createdAt) data.createdAt = new Date().toISOString();
  
  var row = headers.map(function(header) {
    return data[header] !== undefined ? data[header] : "";
  });
  
  sheet.appendRow(row);
  return data;
}

/**
 * Обновляет строку в листе по ID
 * @param {string} sheetName
 * @param {string} id
 * @param {object} data
 * @returns {object|null} Обновленный объект
 */
function updateRow(sheetName, id, data) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 1) return null;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0].toString(); });
  
  var idx = ids.indexOf(id.toString());
  if (idx === -1) return null;
  
  var rowNum = idx + 2; // +1 для пропуска заголовков, +1 для 1-индексации
  var existingRange = sheet.getRange(rowNum, 1, 1, lastCol);
  var existingRowValues = existingRange.getValues()[0];
  
  var updatedRowValues = headers.map(function(header, hIdx) {
    if (data[header] !== undefined) {
      return data[header];
    }
    return existingRowValues[hIdx];
  });
  
  existingRange.setValues([updatedRowValues]);
  
  // Возвращаем собранный объект
  var obj = {};
  headers.forEach(function(header, hIdx) {
    obj[header] = updatedRowValues[hIdx];
  });
  return obj;
}

/**
 * Удаляет строку из листа по ID
 * @param {string} sheetName
 * @param {string} id
 * @returns {boolean} Успешно ли удаление
 */
function deleteRow(sheetName, id) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0].toString(); });
  var idx = ids.indexOf(id.toString());
  if (idx === -1) return false;
  
  sheet.deleteRow(idx + 2);
  return true;
}

/**
 * Находит строки по фильтрам
 * @param {string} sheetName
 * @param {object} filters
 * @returns {object[]}
 */
function findRows(sheetName, filters) {
  var data = getSheetData(sheetName);
  return data.filter(function(row) {
    for (var key in filters) {
      if (row[key] !== filters[key]) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Создает пользовательское меню при открытии таблицы
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('💎 Suluu Business')
      .addItem('🔄 Инициализировать базу данных', 'menuInitializeDatabase')
      .addToUi();
}

/**
 * Функция-обертка для запуска инициализации из меню таблицы
 */
function menuInitializeDatabase() {
  try {
    initializeDatabase();
    SpreadsheetApp.getActiveSpreadsheet().toast('Все листы, структуры колонок и настройки по умолчанию успешно созданы!', '💎 Suluu Business', 6);
  } catch (e) {
    try {
      SpreadsheetApp.getUi().alert('Ошибка инициализации: ' + e.message);
    } catch(err) {
      Logger.log('Ошибка инициализации: ' + e.message);
    }
  }
}

