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
 * @returns {string|null} Возвращает токен сессии или null
 */
function authenticate(password) {
  var props = PropertiesService.getScriptProperties();
  var savedHash = props.getProperty("ADMIN_PASSWORD_HASH");
  
  // Первоначальная настройка: если пароль еще не задан, сохраняем переданный
  if (!savedHash) {
    var newHash = hashPassword(password);
    props.setProperty("ADMIN_PASSWORD_HASH", newHash);
    savedHash = newHash;
  }
  
  var inputHash = hashPassword(password);
  if (inputHash === savedHash) {
    // Создаем токен сессии
    var token = "token_" + generateId() + "_" + Date.now();
    // Сохраняем токен в свойствах скрипта (время жизни - 24 часа)
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
 * Изменяет пароль администратора
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {boolean}
 */
function changeAdminPassword(oldPassword, newPassword) {
  var props = PropertiesService.getScriptProperties();
  var savedHash = props.getProperty("ADMIN_PASSWORD_HASH");
  
  if (!savedHash || hashPassword(oldPassword) === savedHash) {
    props.setProperty("ADMIN_PASSWORD_HASH", hashPassword(newPassword));
    return true;
  }
  return false;
}
