# Интеграция с API (Supabase) и управление состоянием (State Management)

---

## 1. Слой интеграции с API (`js/api.js`)
Взаимодействие с базой данных и авторизацией вынесено в изолированный модуль [api.js](file:///d:/%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/Code%20Projects/BeautyPlace/business/js/api.js). Он скрывает прямые вызовы Supabase SDK и решает задачи преобразования типов данных.

### 1.1. Маппинг данных (Data Transformation)
Поскольку в базе данных используется соглашение об именовании столбцов в стиле `snake_case`, а на фронтенде — `camelCase`, `api.js` содержит набор двунаправленных мапперов для каждой сущности:
- `mapDbBusinessToFrontend(b)` / `mapFrontendBusinessToDb(b)`
- `mapDbServiceToFrontend(s)` / `mapFrontendServiceToDb(s)`
- `mapDbMasterToFrontend(m)` / `mapFrontendMasterToDb(m)`
- `mapDbBookingToFrontend(b, ...)` / `mapFrontendBookingToDb(b)`

### 1.2. Оптимизированный пакетный запрос данных (`api.getAll`)
Для минимизации задержек и экономии трафика, вместо отправки множества мелких REST-запросов, инициализация приложения и синхронизация в фоне выполняются через метод `api.getAll()`. Этот метод использует возможности JavaScript `Promise.all` для параллельного получения всех связанных с активным салоном списков данных:
```javascript
api.getAll = async function (options = {}) {
  // Параллельный запрос всех таблиц с фильтром по activeBusinessId
  const [profile, business, masters, services, bookings, ...] = await Promise.all([
    supabaseClient.from('profiles').select('*').single(),
    supabaseClient.from('business').select('*').eq('id', activeBizId).single(),
    supabaseClient.from('masters').select('*').eq('business_id', activeBizId),
    ...
  ]);
  // Сборка, маппинг и возврат единого объекта данных
  return { ... };
}
```

### 1.3. Пакетная обработка шаблонов (`api.saveGlobalTemplatesBatch`)
Для исключения проблемы «состояния гонки» (race condition) при импорте готовых шаблонов услуг, используется пакетный метод сохранения. Вместо отправки запроса на каждую выбранную услугу по отдельности, метод принимает массив и выполняет единую транзакцию вставки:
```javascript
api.saveGlobalTemplatesBatch = async function (businessId, templates) {
  // Сначала проверяются/создаются локальные категории
  // Затем формируется массив услуг и отправляется одним запросом:
  const { data, error } = await supabaseClient
    .from('services')
    .insert(servicesToInsert)
    .select();
  ...
}
```

---

## 2. Управление состоянием (`js/state.js`)
Состояние приложения Suluu Business представляет собой реактивный глобальный объект `window.state`. Любые манипуляции с интерфейсом или данными происходят путем изменения полей этого объекта.

### 2.1. Структура `state`
- `isAuthenticated`: Флаг успешной сессии пользователя в Supabase.
- `currentPage`: Строковый идентификатор текущего экрана (например, `'landing'`, `'dashboard'`, `'bookings'`, `'auth'`).
- `userProfile`: Объект с ролью и именем текущего пользователя.
- `business`: Данные об активном салоне красоты (настройки, график, флаг учета финансов).
- `masters`, `services`, `bookings`, `clients`, `transactions`, `shifts`, `wallets`: Списки сущностей.
- `ui`: Вспомогательные переменные для интерфейса (активные фильтры, состояние открытых модалок, данные для редактирования, состояние боковой панели).

### 2.2. Реактивность обновлений
Для изменения состояния используются две функции-обертки:
1. `window.setState(updates)`: Записывает обновленные поля непосредственно в глобальный стейт и инициирует перерисовку интерфейса.
2. `window.setUI(updates)`: Обновляет вложенный объект настроек интерфейса `state.ui` и инициирует перерисовку.

```javascript
window.setState = function (updates) {
  Object.assign(window.state, updates);
  if (window.render) window.render(); // Вызов перерисовки DOM
};
```

---

## 3. Realtime Синхронизация (`js/app.js`)
Для поддержания актуальности данных на разных устройствах (например, когда менеджер на компьютере создает запись, а мастер на телефоне сразу видит ее в своем календаре) настроен слушатель изменений в Supabase Realtime:

```javascript
function setupRealtime() {
  const channel = window.supabaseClient.channel('public:all');
  channel
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      // При получении любого изменения запускается фоновый импорт данных через api.getAll()
      // с последующим вызовом setState() для перерисовки изменившихся узлов интерфейса
    })
    .subscribe();
}
```
Для защиты от множественных параллельных запросов при частых изменениях данных в Realtime-подписке реализован механизм дебаунсинга (таймаут 100мс) и очередь обновлений (`syncPending`), упаковывающая запросы во избежание блокировок сети.
