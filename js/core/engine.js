// ============================================
// engine.js — Движок рендеринга на основе morphdom
// ============================================

window.render = function () {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  try {
    // Получаем результирующий HTML от роутера
    const newHtmlString = window.renderApp ? window.renderApp() : '<div>Загрузка движка...</div>';
    
    // Создаем временный элемент для парсинга HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(newHtmlString, 'text/html');
    const newAppEl = doc.body.firstElementChild;
    
    if (newAppEl && window.morphdom) {
      window.morphdom(appEl, newAppEl);
    } else {
      appEl.innerHTML = newHtmlString;
    }
    
    // После рендеринга инициализируем тему оформления
    if (window.ThemeManager) {
      window.ThemeManager.init();
    }
    
    // Инициализируем иконки Feather
    if (window.feather) {
      window.feather.replace();
    }
  } catch (error) {
    console.error('Ошибка рендеринга DOM:', error);
    appEl.innerHTML = `
      <div style="padding: 24px; color: #ef4444; text-align: center;">
        <h2 style="font-weight: bold; font-size: 20px;">Произошла ошибка интерфейса</h2>
        <p style="margin: 8px 0 16px;">${error.message}</p>
        <button onclick="location.reload()" style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;">Перезагрузить</button>
      </div>
    `;
  }
};
