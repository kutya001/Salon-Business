/**
 * StructureChecker.gs — Утилита проверки и миграции структуры базы данных Google Таблиц
 * 
 * Проверяет соответствие листов, колонок, дефолтных настроек и типов данных
 * актуальным требованиям бэкенда и фронтенда Suluu Business.
 */

// Ожидаемая структура таблиц (Схема метаданных)
var REQUIRED_SCHEMA = {
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

/**
 * Проверяет структуру и выводит подробный отчет в UI Google Sheets
 */
function checkDatabaseStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, log: ["Ошибка: Скрипт запущен вне активной таблицы."] };
  
  var log = [];
  var issuesFound = 0;
  var fixedCount = 0;
  
  log.push("=== НАЧАЛО ПРОВЕРКИ СТРУКТУРЫ БАЗЫ ДАННЫХ ===");
  log.push("Время проверки: " + new Date().toLocaleString("ru-RU"));
  
  for (var sheetName in REQUIRED_SCHEMA) {
    var sheet = ss.getSheetByName(sheetName);
    var expectedCols = REQUIRED_SCHEMA[sheetName];
    
    // 1. Проверка наличия листа
    if (!sheet) {
      log.push("❌ Лист '" + sheetName + "' отсутствует.");
      issuesFound++;
      
      // Авто-исправление: создаем лист с нужными колонками
      try {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(expectedCols);
        sheet.getRange(1, 1, 1, expectedCols.length).setFontWeight("bold");
        log.push("🔧 Авто-исправление: Лист '" + sheetName + "' успешно создан с необходимыми колонками.");
        fixedCount++;
      } catch (err) {
        log.push("⚠️ Не удалось автоматически создать лист '" + sheetName + "': " + err.message);
      }
      continue;
    } else {
      log.push("🟢 Лист '" + sheetName + "' обнаружен.");
    }
    
    // 2. Проверка колонок (заголовков)
    var lastCol = sheet.getLastColumn();
    var currentCols = [];
    if (lastCol > 0) {
      currentCols = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(c) { return String(c).trim(); });
    }
    
    var missingCols = [];
    expectedCols.forEach(function(col) {
      if (currentCols.indexOf(col) === -1) {
        missingCols.push(col);
      }
    });
    
    if (missingCols.length > 0) {
      log.push("❌ Лист '" + sheetName + "' не содержит колонок: " + missingCols.join(", "));
      issuesFound += missingCols.length;
      
      // Авто-исправление: добавляем недостающие колонки
      try {
        var startCol = lastCol + 1;
        var range = sheet.getRange(1, startCol, 1, missingCols.length);
        range.setValues([missingCols]);
        range.setFontWeight("bold");
        log.push("🔧 Авто-исправление: Добавлены недостающие колонки " + missingCols.join(", ") + " в лист '" + sheetName + "'.");
        fixedCount += missingCols.length;
      } catch (err) {
        log.push("⚠️ Не удалось автоматически добавить колонки в лист '" + sheetName + "': " + err.message);
      }
    } else {
      log.push("🟢 Лист '" + sheetName + "' содержит все необходимые колонки.");
    }
    
    // 3. Проверка формата данных (например, телефонов или длительности)
    if (sheetName === "Bookings" || sheetName === "Clients" || sheetName === "Masters") {
      var data = getSheetData(sheetName);
      var phoneColIdx = expectedCols.indexOf("phone");
      if (phoneColIdx === -1) phoneColIdx = expectedCols.indexOf("clientPhone");
      
      var malformedCount = 0;
      if (phoneColIdx !== -1 && data.length > 0) {
        var valuesRange = sheet.getRange(2, phoneColIdx + 1, data.length, 1);
        var rawValues = valuesRange.getValues();
        
        for (var i = 0; i < rawValues.length; i++) {
          var val = String(rawValues[i][0]).trim();
          if (val && val.charAt(0) !== "'" && val.charAt(0) === "+") {
            // Исправляем телефонный номер, принудительно задавая его как текст
            rawValues[i][0] = "'" + val;
            malformedCount++;
          }
        }
        
        if (malformedCount > 0) {
          log.push("❌ Лист '" + sheetName + "' содержит неформатированные телефоны (без префикса текста): " + malformedCount + " строк.");
          issuesFound++;
          try {
            valuesRange.setValues(rawValues);
            log.push("🔧 Авто-исправление: " + malformedCount + " номеров телефонов отформатированы как текст (с префиксом ').");
            fixedCount++;
          } catch(err) {
            log.push("⚠️ Не удалось автоматически исправить форматы телефонов в '" + sheetName + "': " + err.message);
          }
        }
      }
    }
  }
  
  // 4. Проверка метаданных Settings
  var settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet) {
    var settingsData = getSheetData("Settings");
    var keys = settingsData.map(function(s) { return s.key; });
    var requiredKeys = ["businessName", "workSchedule", "wallets", "categories"];
    
    requiredKeys.forEach(function(rk) {
      if (keys.indexOf(rk) === -1) {
        log.push("❌ В таблице настроек 'Settings' отсутствует ключ: '" + rk + "'");
        issuesFound++;
      }
    });
  }
  
  log.push("=== ПРОВЕРКА ЗАВЕРШЕНА ===");
  log.push("Найдено несоответствий: " + issuesFound);
  log.push("Автоматически исправлено: " + fixedCount);
  
  return {
    success: true,
    issuesFound: issuesFound,
    fixedCount: fixedCount,
    log: log
  };
}

/**
 * Функция-обертка для запуска проверки метаданных структуры из меню Google Sheets
 */
function menuCheckDatabaseStructure() {
  var ui = SpreadsheetApp.getUi();
  
  // Выполняем проверку и исправление
  var result = checkDatabaseStructure();
  
  // Формируем красивый отчет для показа пользователю
  var title = "🔍 Проверка структуры базы данных";
  var reportHtml = "<h3>Результаты проверки метаданных</h3>";
  reportHtml += "<p><b>Найдено несоответствий:</b> " + result.issuesFound + "</p>";
  reportHtml += "<p><b>Автоматически исправлено:</b> " + result.fixedCount + "</p>";
  reportHtml += "<div style='background-color: #f3f4f6; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 11px; max-height: 300px; overflow-y: auto;'>";
  
  result.log.forEach(function(line) {
    var color = "black";
    if (line.indexOf("❌") !== -1) color = "#dc2626";
    else if (line.indexOf("🟢") !== -1) color = "#10b981";
    else if (line.indexOf("🔧") !== -1) color = "#2563eb";
    else if (line.indexOf("=== ") !== -1) color = "#4b5563";
    
    reportHtml += "<div style='color: " + color + "; margin-bottom: 4px;'>" + line + "</div>";
  });
  
  reportHtml += "</div>";
  
  // Выводим диалоговое окно
  var htmlOutput = HtmlService.createHtmlOutput(reportHtml)
      .setWidth(500)
      .setHeight(450)
      .setTitle("💎 Suluu Business — Анализатор структуры");
      
  ui.showModelessDialog(htmlOutput, "💎 Suluu Business — Проверка метаданных");
}
