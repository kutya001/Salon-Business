// ============================================
// app.js — Точка входа в приложение
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Проверяем конфигурацию и авторизацию
  const gasUrl = localStorage.getItem('gas_url');
  const token = localStorage.getItem('auth_token');

  if (gasUrl) {
    window.api.gasUrl = gasUrl;
    
    if (token) {
      window.api.token = token;
      
      // Показываем спиннер загрузки при инициализации
      setState({ isAuthenticated: false });
      setUI({ loading: true });
      
      try {
        // Подгружаем все данные с бэкенда за один запрос
        const allData = await api.getAll();
        
        setState({
          isAuthenticated: true,
          business: allData.business || state.business,
          masters: allData.masters || [],
          services: allData.services || [],
          bookings: allData.bookings || [],
          clients: allData.clients || [],
          transactions: allData.transactions || [],
          shifts: allData.shifts || [],
          currentPage: 'dashboard'
        });
      } catch (err) {
        console.error('Ошибка инициализации данных:', err);
        // Если ошибка авторизации (401), api.request автоматически сбросит сессию
      } finally {
        setUI({ loading: false });
      }
    } else {
      setState({ isAuthenticated: false, currentPage: 'auth' });
    }
  } else {
    setState({ isAuthenticated: false, currentPage: 'setup' });
  }

  // Запуск первого рендеринга
  window.render();
  
  // Инициализация темы оформления
  if (window.ThemeManager) {
    window.ThemeManager.init();
  }
});
