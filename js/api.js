// ============================================
// api.js — Клиент для интеграции с Supabase (Маппинг данных + Мультитеннантность)
// ============================================

const SUPABASE_URL = 'https://etmjmgugfvbwaqjzvnyn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vI28QpLgQw-sSxJja_SmOA_pthfQHjp';

// Инициализируем глобальный клиент
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Мапперы для согласования snake_case СУБД и camelCase фронтенда
const mapDbServiceToFrontend = (s) => {
  if (!s) return s;
  return {
    ...s,
    categoryId: s.category_id,
    genderCategory: s.gender_category,
    globalServiceId: s.global_service_id
  };
};

const mapFrontendServiceToDb = (s) => {
  if (!s) return s;
  return {
    name: s.name,
    category_id: s.categoryId,
    gender_category: s.genderCategory,
    price: s.price,
    duration: s.duration,
    description: s.description,
    global_service_id: s.globalServiceId
  };
};

const mapDbBookingToFrontend = (b, clients = [], services = []) => {
  if (!b) return b;
  const client = clients.find(c => c.id === b.client_id) || {};
  const service = services.find(s => s.id === b.service_id) || {};
  return {
    ...b,
    masterId: b.master_id,
    clientId: b.client_id,
    serviceId: b.service_id,
    clientName: client.name || 'Неизвестный клиент',
    clientPhone: client.phone || '',
    serviceName: service.name || 'Неизвестная услуга'
  };
};

const mapFrontendBookingToDb = (b) => {
  if (!b) return b;
  return {
    master_id: b.masterId,
    client_id: b.clientId,
    service_id: b.serviceId,
    date: b.date,
    time: b.time,
    status: b.status,
    price: b.price,
    services: b.services || null
  };
};

class SupabaseAPI {
  constructor() {
    this.client = window.supabaseClient;
  }

  isConfigured() {
    return true;
  }

  async logout() {
    await this.client.auth.signOut();
    setState({ 
      isAuthenticated: false,
      userProfile: null,
      myBusinesses: [],
      myEmployments: [],
      allSalons: [],
      masters: [],
      services: [],
      categories: [],
      bookings: [],
      clients: [],
      transactions: [],
      shifts: [],
      wallets: [],
      transactionCategories: []
    });
    setUI({ activeBusinessId: null });
    navigate('auth');
    showToast('Вы вышли из системы', 'info');
  }

  async authenticate(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      if (window.logApiCall) window.logApiCall('error', 'authenticate', error.message);
      let errMsg = error.message;
      if (errMsg === 'Invalid login credentials') errMsg = 'Неверный логин или пароль';
      throw new Error(errMsg);
    }
    
    if (window.logApiCall) window.logApiCall('recv', 'authenticate', data);
    return { token: data.session.access_token, user: data.user };
  }
  
  async register(email, password, username, role) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { token: data?.session?.access_token, user: data.user };
  }

  // Создание салона с дефолтными справочниками через RPC
  async createBusinessWithDefaults(businessName) {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');

    const { data: businessId, error } = await this.client.rpc('create_business_with_defaults', {
      p_owner_id: user.id,
      p_business_name: businessName
    });

    if (error) throw error;
    return businessId;
  }

  // Поиск всех салонов для трудоустройства
  async searchBusinesses() {
    const { data, error } = await this.client.from('business').select('*, profiles(username)');
    if (error) throw error;
    return data;
  }

  // Подача заявки на работу
  async applyForJob(businessId, role) {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');

    const { data, error } = await this.client.from('business_members').insert([
      {
        business_id: businessId,
        user_id: user.id,
        role: role,
        status: 'pending'
      }
    ]).select().single();

    if (error) {
      if (error.code === '23505') throw new Error('Вы уже отправили заявку в этот салон');
      throw error;
    }
    return data;
  }

  // Ответ на заявку (одобрение/отклонение)
  async respondToJobApplication(memberId, businessId, userId, role, username, status) {
    const { error: updateError } = await this.client
      .from('business_members')
      .update({ status })
      .eq('id', memberId);

    if (updateError) throw updateError;

    // Если одобрили мастера — автоматически создаем ему карточку мастера
    if (status === 'approved' && role === 'master') {
      const { error: masterError } = await this.client.from('masters').insert([
        {
          business_id: businessId,
          name: username,
          user_id: userId,
          specialization: 'Мастер'
        }
      ]);
      if (masterError) console.error('Ошибка автоматического создания мастера:', masterError);
    }

    return true;
  }

  // RPC методы для суперадминистратора
  async adminUpdateUser(targetUserId, username, role, password = '') {
    const { error } = await this.client.rpc('admin_update_user', {
      target_user_id: targetUserId,
      new_username: username,
      new_role: role,
      new_password: password || null
    });
    if (error) throw error;
    return true;
  }

  async adminDeleteUser(targetUserId) {
    const { error } = await this.client.rpc('admin_delete_user', {
      target_user_id: targetUserId
    });
    if (error) throw error;
    return true;
  }

  // Общий метод для получения всех данных в зависимости от роли
  async getAll(options = {}) {
    if (!options.background && window.state && window.state.ui) {
      window.setUI({ syncingCount: (window.state.ui.syncingCount || 0) + 1 });
    }
    
    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      // Получаем профиль
      const { data: profile, error: profileErr } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (!profile) {
        await this.client.auth.signOut();
        throw new Error('Учетная запись не найдена или была удалена. Пожалуйста, войдите снова.');
      }

      const result = {
        userProfile: profile,
        myBusinesses: [],
        myEmployments: [],
        allSalons: [],
        business: null,
        categories: [],
        masters: [],
        services: [],
        clients: [],
        bookings: [],
        transactions: [],
        shifts: [],
        wallets: [],
        transactionCategories: [],
        allUsers: [],
        allBusinesses: [],
        jobApplications: [],
        globalCategories: [],
        globalServices: []
      };

      if (profile.role === 'super_admin') {
        const [businessesRes, profilesRes] = await Promise.all([
          this.client.from('business').select('*, profiles(username)'),
          this.client.from('profiles').select('*')
        ]);
        result.allBusinesses = businessesRes.data || [];
        result.allUsers = profilesRes.data || [];
      } else if (profile.role === 'owner') {
        const { data: businesses, error: bizErr } = await this.client
          .from('business')
          .select('*')
          .eq('owner_id', user.id);

        if (bizErr) throw bizErr;
        result.myBusinesses = businesses || [];

        let activeId = window.state?.ui?.activeBusinessId;
        if (!activeId && result.myBusinesses.length > 0) {
          activeId = result.myBusinesses[0].id;
        }
        
        if (activeId) {
          window.state.ui.activeBusinessId = activeId;
          const [
            businessRes, categoriesRes, mastersRes, servicesRes, clientsRes,
            bookingsRes, transactionsRes, shiftsRes, walletsRes, tCatRes, membersRes
          ] = await Promise.all([
            this.client.from('business').select('*').eq('id', activeId).maybeSingle(),
            this.client.from('categories').select('*').eq('business_id', activeId),
            this.client.from('masters').select('*').eq('business_id', activeId),
            this.client.from('services').select('*').eq('business_id', activeId),
            this.client.from('clients').select('*').eq('business_id', activeId),
            this.client.from('bookings').select('*').eq('business_id', activeId),
            this.client.from('transactions').select('*').eq('business_id', activeId),
            this.client.from('shifts').select('*').eq('business_id', activeId),
            this.client.from('wallets').select('*').eq('business_id', activeId),
            this.client.from('transaction_categories').select('*').eq('business_id', activeId),
            this.client.from('business_members').select('*, profiles(username)').eq('business_id', activeId)
          ]);

          result.business = businessRes.data || null;
          result.categories = categoriesRes.data || [];
          result.masters = mastersRes.data || [];
          result.clients = clientsRes.data || [];
          result.transactions = transactionsRes.data || [];
          result.shifts = shiftsRes.data || [];
          result.wallets = walletsRes.data || [];
          result.transactionCategories = tCatRes.data || [];
          result.jobApplications = membersRes.data || [];

          // Применяем мапперы для локальных услуг и записей
          result.services = (servicesRes.data || []).map(mapDbServiceToFrontend);
          result.bookings = (bookingsRes.data || []).map(b => mapDbBookingToFrontend(b, result.clients, result.services));
        }
      } else {
        const { data: employments, error: empErr } = await this.client
          .from('business_members')
          .select('*, business(*)')
          .eq('user_id', user.id);

        if (empErr) throw empErr;
        result.myEmployments = employments || [];

        const approved = result.myEmployments.find(e => e.status === 'approved');
        let activeId = window.state?.ui?.activeBusinessId;
        if (!activeId && approved) {
          activeId = approved.business_id;
        }

        if (activeId) {
          window.state.ui.activeBusinessId = activeId;
          const [
            businessRes, categoriesRes, mastersRes, servicesRes, clientsRes, bookingsRes
          ] = await Promise.all([
            this.client.from('business').select('*').eq('id', activeId).maybeSingle(),
            this.client.from('categories').select('*').eq('business_id', activeId),
            this.client.from('masters').select('*').eq('business_id', activeId),
            this.client.from('services').select('*').eq('business_id', activeId),
            this.client.from('clients').select('*').eq('business_id', activeId),
            this.client.from('bookings').select('*').eq('business_id', activeId)
          ]);

          result.business = businessRes.data || null;
          result.categories = categoriesRes.data || [];
          result.masters = mastersRes.data || [];
          result.clients = clientsRes.data || [];

          result.services = (servicesRes.data || []).map(mapDbServiceToFrontend);
          result.bookings = (bookingsRes.data || []).map(b => mapDbBookingToFrontend(b, result.clients, result.services));

          const approvedMember = result.myEmployments.find(e => e.business_id === activeId && e.status === 'approved');
          if (approvedMember && approvedMember.role === 'manager') {
            const [transactionsRes, shiftsRes, walletsRes, tCatRes] = await Promise.all([
              this.client.from('transactions').select('*').eq('business_id', activeId),
              this.client.from('shifts').select('*').eq('business_id', activeId),
              this.client.from('wallets').select('*').eq('business_id', activeId),
              this.client.from('transaction_categories').select('*').eq('business_id', activeId)
            ]);
            result.transactions = transactionsRes.data || [];
            result.shifts = shiftsRes.data || [];
            result.wallets = walletsRes.data || [];
            result.transactionCategories = tCatRes.data || [];
          }
        }

        const allBiz = await this.searchBusinesses();
        result.allSalons = allBiz || [];
      }

      // Догружаем шаблоны для владельца и менеджера
      if (profile.role === 'owner' || profile.role === 'manager') {
        const [globalCatsRes, globalServicesRes] = await Promise.all([
          this.client.from('global_categories').select('*').order('name'),
          this.client.from('global_services').select('*').order('name')
        ]);
        result.globalCategories = globalCatsRes.data || [];
        result.globalServices = globalServicesRes.data || [];
      }

      if (window.logApiCall) window.logApiCall('recv', 'getAll', result);
      return result;
    } catch (err) {
      console.error('API Error (getAll):', err);
      if (!options.background) showToast('Ошибка получения данных', 'error');
      throw err;
    } finally {
      if (!options.background && window.state && window.state.ui) {
        window.setUI({ syncingCount: Math.max(0, (window.state.ui.syncingCount || 0) - 1) });
      }
    }
  }

  // Настройки бизнеса
  async getSettings() {
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) return null;
    const { data, error } = await this.client.from('business').select('*').eq('id', activeId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateSettings(dataToUpdate) {
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) return null;
    const { data, error } = await this.client.from('business').update(dataToUpdate).eq('id', activeId).select().single();
    if (error) throw error;
    return data;
  }

  // Generic Helpers
  async _insert(table, data) {
    const activeId = window.state?.ui?.activeBusinessId;
    if (table !== 'business' && table !== 'profiles' && table !== 'business_members' && activeId) {
      data.business_id = activeId;
    }
    const { data: res, error } = await this.client.from(table).insert([data]).select().single();
    if (error) throw error;
    return res;
  }

  async _update(table, id, data) {
    const { data: res, error } = await this.client.from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    return res;
  }

  async _delete(table, id) {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // Категории
  async createCategory(data) { return this._insert('categories', data); }
  async updateCategory(id, data) { return this._update('categories', id, data); }
  async deleteCategory(id) { return this._delete('categories', id); }

  // Мастера
  async createMaster(data) { return this._insert('masters', data); }
  async updateMaster(id, data) { return this._update('masters', id, data); }
  async deleteMaster(id) { return this._delete('masters', id); }

  // Услуги
  async createService(data) { 
    return this._insert('services', mapFrontendServiceToDb(data))
      .then(mapDbServiceToFrontend); 
  }
  async updateService(id, data) { 
    return this._update('services', id, mapFrontendServiceToDb(data))
      .then(mapDbServiceToFrontend); 
  }
  async deleteService(id) { return this._delete('services', id); }

  // Клиенты
  async createClient(data) { return this._insert('clients', data); }
  async updateClient(id, data) { return this._update('clients', id, data); }

  // Записи
  async createBooking(data) { 
    return this._insert('bookings', mapFrontendBookingToDb(data))
      .then(b => mapDbBookingToFrontend(b, window.state.clients, window.state.services)); 
  }
  async updateBooking(id, data) { 
    return this._update('bookings', id, mapFrontendBookingToDb(data))
      .then(b => mapDbBookingToFrontend(b, window.state.clients, window.state.services)); 
  }
  async deleteBooking(id) { return this._delete('bookings', id); }

  // Транзакции
  async createTransaction(data) { return this._insert('transactions', data); }
  async updateTransaction(id, data) { return this._update('transactions', id, data); }
  async deleteTransaction(id) { return this._delete('transactions', id); }

  // Категории транзакций
  async createTransactionCategory(data) { return this._insert('transaction_categories', data); }
  async updateTransactionCategory(id, data) { return this._update('transaction_categories', id, data); }
  async deleteTransactionCategory(id) { return this._delete('transaction_categories', id); }

  // Кошельки
  async createWallet(data) { return this._insert('wallets', data); }
  async updateWallet(id, data) { return this._update('wallets', id, data); }
  async deleteWallet(id) { return this._delete('wallets', id); }

  // Смены
  async openShift(opening_cash, date = null) {
    return this._insert('shifts', {
      status: 'open',
      opening_cash: opening_cash,
      date: date || new Date().toISOString().split('T')[0]
    });
  }

  async closeShift(id, closing_cash) {
    return this._update('shifts', id, {
      status: 'closed',
      closing_cash: closing_cash,
      closed_at: new Date().toISOString()
    });
  }

  // Переключение шаблона услуги (Импорт / Удаление)
  async toggleGlobalService(globalServiceId, isEnabled) {
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) throw new Error('Салон не выбран');

    if (isEnabled) {
      const { data: gs, error: gsErr } = await this.client
        .from('global_services')
        .select('*, global_categories(name)')
        .eq('id', globalServiceId)
        .single();
      if (gsErr) throw gsErr;

      let { data: localCat, error: catErr } = await this.client
        .from('categories')
        .select('*')
        .eq('business_id', activeId)
        .eq('name', gs.global_categories.name)
        .maybeSingle();
      if (catErr) throw catErr;

      let localCatId;
      if (!localCat) {
        const { data: newCat, error: newCatErr } = await this.client
          .from('categories')
          .insert([{ business_id: activeId, name: gs.global_categories.name }])
          .select()
          .single();
        if (newCatErr) throw newCatErr;
        localCatId = newCat.id;
      } else {
        localCatId = localCat.id;
      }

      const { error: sErr } = await this.client
        .from('services')
        .insert([{
          business_id: activeId,
          category_id: localCatId,
          name: gs.name,
          price: gs.price,
          duration: gs.duration,
          global_service_id: gs.id,
          gender_category: gs.gender_category,
          description: gs.description
        }]);
      if (sErr) throw sErr;
    } else {
      const { data: localService, error: sFindErr } = await this.client
        .from('services')
        .select('*')
        .eq('business_id', activeId)
        .eq('global_service_id', globalServiceId)
        .maybeSingle();
      if (sFindErr) throw sFindErr;

      if (localService) {
        const { error: delErr } = await this.client
          .from('services')
          .delete()
          .eq('id', localService.id);
        if (delErr) throw delErr;

        const { data: remainingServices, error: remErr } = await this.client
          .from('services')
          .select('*')
          .eq('category_id', localService.category_id);
        if (remErr) throw remErr;

        if (!remainingServices || remainingServices.length === 0) {
          await this.client.from('categories').delete().eq('id', localService.category_id);
        }
      }
    }
    return true;
  }
}

window.api = new SupabaseAPI();
