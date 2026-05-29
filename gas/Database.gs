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
    "Masters": ["id", "name", "phone", "email", "specialization", "percentage", "workDays", "workHoursStart", "workHoursEnd", "avatar", "status", "createdAt"],
    "Services": ["id", "name", "categoryId", "categoryName", "price", "duration", "description", "status", "createdAt"],
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
      "businessName": "Мой салон красоты",
      "description": "Автономный кабинет Suluu Business",
      "address": "ул. Токтогула, 125",
      "phone": "+996 555 123 456",
      "email": "info@mybeauty.kg",
      "theme": "hair",
      "workSchedule": JSON.stringify({
        "mon": { "start": "09:00", "end": "20:00", "enabled": true },
        "tue": { "start": "09:00", "end": "20:00", "enabled": true },
        "wed": { "start": "09:00", "end": "20:00", "enabled": true },
        "thu": { "start": "09:00", "end": "20:00", "enabled": true },
        "fri": { "start": "09:00", "end": "20:00", "enabled": true },
        "sat": { "start": "10:00", "end": "18:00", "enabled": true },
        "sun": { "enabled": false }
      })
    };
    
    for (var key in defaultSettings) {
      settingsSheet.appendRow([key, defaultSettings[key]]);
    }
  }

  // Заполняем справочник категорий по умолчанию
  var categoriesSheet = getSheet("Categories");
  if (categoriesSheet.getLastRow() <= 1) {
    var defaultCategories = [
      { id: "cat_1", name: "Волосы", description: "Стрижки, укладки, окрашивание", status: "active", createdAt: new Date().toISOString() },
      { id: "cat_2", name: "Ногти", description: "Маникюр, педикюр", status: "active", createdAt: new Date().toISOString() },
      { id: "cat_3", name: "Лицо", description: "Уход за лицом, макияж", status: "active", createdAt: new Date().toISOString() }
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
      id: "master_1", name: "Айдана (Главный мастер)", phone: "+996555000111", email: "aidana@example.com",
      specialization: "Универсал", percentage: 50, workDays: "mon,tue,wed,thu,fri",
      workHoursStart: "09:00", workHoursEnd: "20:00", avatar: "", status: "active", createdAt: new Date().toISOString()
    };
    var masterHeaders = schema["Masters"];
    mastersSheet.appendRow(masterHeaders.map(function(h) { return defaultMaster[h] || ""; }));
  }

  // Заполняем справочник услуг по умолчанию
  var servicesSheet = getSheet("Services");
  if (servicesSheet.getLastRow() <= 1) {
    var defaultServices = [
      { id: "svc_1", name: "Женская стрижка", categoryId: "cat_1", categoryName: "Волосы", price: 1000, duration: 60, description: "Базовая стрижка с укладкой", status: "active", createdAt: new Date().toISOString() },
      { id: "svc_2", name: "Маникюр с покрытием", categoryId: "cat_2", categoryName: "Ногти", price: 800, duration: 90, description: "Классический маникюр + гель-лак", status: "active", createdAt: new Date().toISOString() }
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

