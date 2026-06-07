// ============================================
// app.js — Точка входа в приложение (Ролевая модель + Мультитеннантность)
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
      
      let startPage = 'dashboard';
      if (allData.userProfile.role === 'super_admin') {
        startPage = 'super_admin_panel';
      } else if (allData.userProfile.role === 'owner') {
        startPage = 'dashboard';
      } else {
        const hasApproved = (allData.myEmployments || []).some(e => e.status === 'approved');
        startPage = hasApproved ? 'dashboard' : 'job_search';
      }

      setState({
        isAuthenticated: true,
        userProfile: allData.userProfile,
        myBusinesses: allData.myBusinesses || [],
        myEmployments: allData.myEmployments || [],
        allSalons: allData.allSalons || [],
        business: allData.business || null,
        categories: allData.categories || [],
        masters: allData.masters || [],
        services: allData.services || [],
        bookings: allData.bookings || [],
        clients: allData.clients || [],
        transactions: allData.transactions || [],
        shifts: allData.shifts || [],
        wallets: allData.wallets || [],
        transactionCategories: allData.transactionCategories || [],
        jobApplications: allData.jobApplications || [],
        allUsers: allData.allUsers || [],
        allBusinesses: allData.allBusinesses || [],
        globalCategories: allData.globalCategories || [],
        globalServices: allData.globalServices || [],
        currentPage: startPage
      });

      // Инициализация Realtime
      setupRealtime();

    } catch (err) {
      console.error('Ошибка инициализации данных:', err);
      setState({ isAuthenticated: false, currentPage: 'landing' });
    } finally {
      setUI({ loading: false });
    }
  } else {
    setState({ isAuthenticated: false, currentPage: 'landing' });
  }

  // Слушаем изменения авторизации
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      setState({ 
        isAuthenticated: false, 
        currentPage: 'landing',
        userProfile: null,
        myBusinesses: [],
        myEmployments: [],
        allSalons: [],
        business: null,
        categories: [],
        masters: [],
        services: [],
        bookings: [],
        clients: [],
        transactions: [],
        shifts: [],
        wallets: [],
        transactionCategories: []
      });
      setUI({ activeBusinessId: null });
    }
  });
});

// Настройка Supabase Realtime
let isSyncing = false;
let syncPending = false;

function setupRealtime() {
  const channel = window.supabaseClient.channel('public:all');
  
  channel
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      console.log('Realtime change received!', payload);
      
      if (isSyncing) {
        syncPending = true;
        return;
      }
      
      isSyncing = true;
      
      async function runSync() {
        try {
          const allData = await window.api.getAll({ background: true });
          setState({
            userProfile: allData.userProfile,
            myBusinesses: allData.myBusinesses || [],
            myEmployments: allData.myEmployments || [],
            allSalons: allData.allSalons || [],
            business: allData.business || null,
            categories: allData.categories || [],
            masters: allData.masters || [],
            services: allData.services || [],
            bookings: allData.bookings || [],
            clients: allData.clients || [],
            transactions: allData.transactions || [],
            shifts: allData.shifts || [],
            wallets: allData.wallets || [],
            transactionCategories: allData.transactionCategories || [],
            jobApplications: allData.jobApplications || [],
            allUsers: allData.allUsers || [],
            allBusinesses: allData.allBusinesses || [],
            globalCategories: allData.globalCategories || [],
            globalServices: allData.globalServices || []
          });
        } catch (e) {
          console.error('Ошибка фонового обновления после realtime event:', e);
        } finally {
          isSyncing = false;
          if (syncPending) {
            syncPending = false;
            // Cooldown to bundle subsequent changes
            setTimeout(() => {
              if (!isSyncing) {
                isSyncing = true;
                runSync();
              }
            }, 300);
          }
        }
      }
      
      // Debounce slightly to allow batching
      setTimeout(() => {
        runSync();
      }, 100);
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
      userProfile: allData.userProfile,
      myBusinesses: allData.myBusinesses || [],
      myEmployments: allData.myEmployments || [],
      allSalons: allData.allSalons || [],
      business: allData.business || null,
      categories: allData.categories || [],
      masters: allData.masters || [],
      services: allData.services || [],
      bookings: allData.bookings || [],
      clients: allData.clients || [],
      transactions: allData.transactions || [],
      shifts: allData.shifts || [],
      wallets: allData.wallets || [],
      transactionCategories: allData.transactionCategories || [],
      jobApplications: allData.jobApplications || [],
      allUsers: allData.allUsers || [],
      allBusinesses: allData.allBusinesses || [],
      globalCategories: allData.globalCategories || [],
      globalServices: allData.globalServices || []
    });
    showToast('Синхронизация завершена', 'success');
  } catch (err) {
    showToast('Ошибка при синхронизации', 'error');
  } finally {
    setUI({ loading: false });
  }
};
