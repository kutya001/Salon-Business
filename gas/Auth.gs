/**
 * Auth.gs — Управление авторизацией администратора и сессиями
 */

/**
 * Хеширует пароль методом SHA-256
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hexStr = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteString = byteVal.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    hexStr += byteString;
  }
  return hexStr;
}

/**
 * Аутентифицирует администратора по паролю
 * @param {string} password
 * @param {boolean} forceInit Принудительно обновить пароль в базе данных
 * @returns {string|null} Возвращает токен сессии или null
 */
function authenticate(password, forceInit) {
  var props = PropertiesService.getScriptProperties();
  
  // Читаем настройки из Google Таблицы
  var settings = handleGetSettings();
  var savedHash = settings["adminPasswordHash"];
  
  // Если включен forceInit, или пароль еще не задан, или равен "123" (в открытом виде),
  // то инициализируем его новым хешем
  if (forceInit || !savedHash || savedHash === "123" || savedHash.toString().trim() === "") {
    var newHash = hashPassword(password);
    handleUpdateSettings({ "adminPasswordHash": newHash });
    savedHash = newHash;
  }
  
  var inputHash = hashPassword(password);
  if (inputHash === savedHash) {
    // Создаем токен сессии
    var token = "token_" + generateId() + "_" + Date.now();
    // Сохраняем токен в свойствах скрипта (время жизни - 24 часа) для быстрого доступа
    props.setProperty(token, Date.now().toString());
    return token;
  }
  
  return null;
}

/**
 * Проверяет валидность токена
 * @param {string} token
 * @returns {boolean}
 */
function validateToken(token) {
  if (!token) return false;
  
  var props = PropertiesService.getScriptProperties();
  var timestampStr = props.getProperty(token);
  if (!timestampStr) return false;
  
  var timestamp = parseInt(timestampStr, 10);
  var now = Date.now();
  var dayMs = 24 * 60 * 60 * 1000;
  
  if (now - timestamp > dayMs) {
    // Токен истек
    props.deleteProperty(token);
    return false;
  }
  
  // Продлеваем токен при активности
  props.setProperty(token, now.toString());
  return true;
}

/**
 * Удаляет токен сессии (выход)
 * @param {string} token
 */
function removeToken(token) {
  if (token) {
    PropertiesService.getScriptProperties().deleteProperty(token);
  }
}

/**
 * Изменяет пароль администратора в Google Таблице
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {boolean}
 */
function changeAdminPassword(oldPassword, newPassword) {
  var settings = handleGetSettings();
  var savedHash = settings["adminPasswordHash"];
  
  if (!savedHash || hashPassword(oldPassword) === savedHash) {
    handleUpdateSettings({ "adminPasswordHash": hashPassword(newPassword) });
    return true;
  }
  return false;
}
