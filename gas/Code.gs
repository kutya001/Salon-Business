/**
 * Code.gs — Главный контроллер Google Apps Script Web App.
 * Обрабатывает все входящие запросы от фронтенда Suluu Business.
 */

/**
 * Обрабатывает GET запросы (для проверки работоспособности и preflight CORS)
 */
function doGet(e) {
  return createResponse({ status: "ok", message: "Suluu Business GAS Backend is active" });
}

/**
 * Обрабатывает POST запросы
 */
function doPost(e) {
  try {
    // Проверяем наличие входных данных
    if (!e || !e.postData || !e.postData.contents) {
      return createErrorResponse("No post data received", 400);
    }
    
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch(err) {
      return createErrorResponse("Invalid JSON format", 400);
    }
    
    var action = payload.action;
    var token = payload.token;
    var data = payload.data || {};
    
    if (!action) {
      return createErrorResponse("Missing action field", 400);
    }
    
    // Инициализируем БД при первом обращении, если таблицы отсутствуют
    initializeDatabase();
    
    // Проверка, настроен ли пин-код
    if (action === "isPinConfigured") {
      return createResponse({ configured: isPinConfigured() });
    }
    
    // Обработка авторизации
    if (action === "authenticate") {
      var sessionToken = authenticate(data.password);
      if (sessionToken) {
        return createResponse({ token: sessionToken });
      } else {
        return createErrorResponse("Неверный пин-код администратора", 401);
      }
    }
    
    // Проверка токена сессии для всех остальных запросов
    // Если пин-код в базе данных еще не задан вообще, то пропускаем запросы без валидации токена
    if (isPinConfigured() && !validateToken(token)) {
      return createErrorResponse("Сессия истекла или неавторизована. Войдите заново.", 401);
    }
    
    // Роутинг действий
    var result;
    switch (action) {
      // Общие данные
      case "getAll":
        result = handleGetAll();
        break;
        
      // Настройки бизнеса
      case "getSettings":
        result = handleGetSettings();
        break;
      case "updateSettings":
        result = handleUpdateSettings(data);
        break;
      case "changePassword":
        var success = changeAdminPassword(data.oldPassword, data.newPassword);
        if (success) {
          result = { success: true };
        } else {
          return createErrorResponse("Неверный старый пароль", 400);
        }
        break;
      case "getDashboardStats":
        result = handleGetDashboardStats(data.period);
        break;
        
      // Мастера
      case "getMasters":
        result = handleGetMasters();
        break;
      case "createMaster":
        result = handleCreateMaster(data);
        break;
      case "updateMaster":
        result = handleUpdateMaster(data.id, data);
        break;
      case "deleteMaster":
        result = handleDeleteMaster(data.id);
        break;
        
      // Услуги
      case "getServices":
        result = handleGetServices();
        break;
      case "createService":
        result = handleCreateService(data);
        break;
      case "updateService":
        result = handleUpdateService(data.id, data);
        break;
      case "deleteService":
        result = handleDeleteService(data.id);
        break;
        
      // Клиенты
      case "getClients":
        result = handleGetClients();
        break;
      case "createClient":
        result = handleCreateClient(data);
        break;
      case "updateClient":
        result = handleUpdateClient(data.id, data);
        break;
        
      // Записи
      case "getBookings":
        result = handleGetBookings(data);
        break;
      case "createBooking":
        result = handleCreateBooking(data);
        break;
      case "updateBooking":
        result = handleUpdateBooking(data.id, data);
        break;
      case "deleteBooking":
        result = handleDeleteBooking(data.id);
        break;
        
      // Финансы
      case "getTransactions":
        result = handleGetTransactions(data);
        break;
      case "createTransaction":
        result = handleCreateTransaction(data);
        break;
      case "getShifts":
        result = handleGetShifts();
        break;
      case "openShift":
        result = handleOpenShift(data);
        break;
      case "closeShift":
        result = handleCloseShift(data.id, data);
        break;
        
      // Неизвестное действие
      default:
        return createErrorResponse("Unknown action: " + action, 404);
    }
    
    return createResponse(result);
    
  } catch (error) {
    return createErrorResponse(error.toString(), 500);
  }
}

/**
 * Вспомогательная функция для формирования CORS заголовков ответа
 */
function createResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Вспомогательная функция для вывода ошибок
 */
function createErrorResponse(message, code) {
  var output = ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message,
    code: code || 500
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Получает абсолютно все данные из базы данных за один запрос
 */
function handleGetAll() {
  var settings = handleGetSettings();
  var masters = handleGetMasters();
  var services = handleGetServices();
  var bookings = handleGetBookings({});
  var clients = handleGetClients();
  var transactions = handleGetTransactions({});
  var shifts = handleGetShifts();
  
  return {
    business: settings,
    masters: masters,
    services: services,
    bookings: bookings,
    clients: clients,
    transactions: transactions,
    shifts: shifts
  };
}
