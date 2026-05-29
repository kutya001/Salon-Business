/**
 * Settings.gs — Управление настройками бизнеса
 */

/**
 * Читает настройки бизнеса и возвращает их в виде объекта
 * @returns {object}
 */
function handleGetSettings() {
  var sheet = getSheet("Settings");
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return {};
  
  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var settings = {};
  
  values.forEach(function(row) {
    var key = row[0];
    var val = row[1];
    
    // Если это JSON строка (например, расписание), распарсим её
    if (key === "workSchedule") {
      try {
        settings[key] = JSON.parse(val);
      } catch(e) {
        settings[key] = val;
      }
    } else {
      settings[key] = val;
    }
  });
  
  return settings;
}

/**
 * Сохраняет настройки бизнеса
 * @param {object} data
 * @returns {object}
 */
function handleUpdateSettings(data) {
  var sheet = getSheet("Settings");
  
  for (var key in data) {
    var val = data[key];
    if (typeof val === "object") {
      val = JSON.stringify(val);
    }
    
    // Ищем существующий ключ
    var lastRow = sheet.getLastRow();
    var keys = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0].toString(); }) : [];
    
    var idx = keys.indexOf(key);
    if (idx !== -1) {
      // Обновляем значение
      sheet.getRange(idx + 2, 2).setValue(val);
    } else {
      // Добавляем новый ключ-значение
      sheet.appendRow([key, val]);
    }
  }
  
  return handleGetSettings();
}
