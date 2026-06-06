// ============================================
// app.js — Точка входа в приложение
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Запуск первого рендеринга
  window.render();
  
  // Инициализация темы оформления
  if (window.ThemeManager) {
    window.ThemeManager.init();
  }

  // Проверяем авторизацию через Supabase
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (session) {
    setState({ isAuthenticated: false });
    setUI({ loading: true });
    
    try {
      // Подгружаем все данные с бэкенда за один запрос
      const allData = await window.api.getAll();
      
      setState({
        isAuthenticated: true,
        business: allData.business || state.business,
        categories: allData.categories || [],
        masters: allData.masters || [],
        services: allData.services || [],
        bookings: allData.bookings || [],
        clients: allData.clients || [],
        transactions: allData.transactions || [],
        shifts: allData.shifts || [],
        wallets: allData.wallets || [],
        transactionCategories: allData.transactionCategories || [],
        currentPage: 'dashboard'
      });

      // Инициализация Realtime
      setupRealtime();

    } catch (err) {
      console.error('Ошибка инициализации данных:', err);
      setState({ isAuthenticated: false, currentPage: 'auth' });
    } finally {
      setUI({ loading: false });
    }
  } else {
    setState({ isAuthenticated: false, currentPage: 'auth' });
  }

  // Слушаем изменения авторизации
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      setState({ isAuthenticated: false, currentPage: 'auth' });
    }
  });
});

// Настройка Supabase Realtime
function setupRealtime() {
  const channel = window.supabaseClient.channel('public:all');
  
  channel
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      console.log('Realtime change received!', payload);
      // При получении любого изменения просто дергаем getAll в фоне,
      // чтобы стейт обновился и интерфейс перерисовался
      try {
        const allData = await window.api.getAll({ background: true });
        setState({
          business: allData.business || state.business,
          categories: allData.categories || [],
          masters: allData.masters || [],
          services: allData.services || [],
          bookings: allData.bookings || [],
          clients: allData.clients || [],
          transactions: allData.transactions || [],
          shifts: allData.shifts || [],
          wallets: allData.wallets || [],
          transactionCategories: allData.transactionCategories || []
        });
      } catch (e) {
        console.error('Ошибка фонового обновления после realtime event:', e);
      }
    })
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });
}

// Ручная принудительная синхронизация
window.forceSync = async function () {
  if (!window.state.isAuthenticated) return;
  setUI({ loading: true });
  try {
    const allData = await window.api.getAll({ background: false });
    setState({
      business: allData.business || state.business,
      categories: allData.categories || [],
      masters: allData.masters || [],
      services: allData.services || [],
      bookings: allData.bookings || [],
      clients: allData.clients || [],
      transactions: allData.transactions || [],
      shifts: allData.shifts || [],
      wallets: allData.wallets || [],
      transactionCategories: allData.transactionCategories || []
    });
    showToast('Синхронизация завершена', 'success');
  } catch (err) {
    showToast('Ошибка при синхронизации', 'error');
  } finally {
    setUI({ loading: false });
  }
};
