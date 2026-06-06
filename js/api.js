// ============================================
// api.js — Клиент для интеграции с Supabase (Маппинг данных + Мультитеннантность)
// ============================================

const SUPABASE_URL = 'https://etmjmgugfvbwaqjzvnyn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vI28QpLgQw-sSxJja_SmOA_pthfQHjp';

// Инициализируем глобальный клиент
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Мапперы для согласования snake_case СУБД и camelCase фронтенда
const mapDbBusinessToFrontend = (b) => {
  if (!b) return b;
  return {
    ...b,
    businessName: b.name,
    workSchedule: b.work_schedule
  };
};

const mapFrontendBusinessToDb = (b) => {
  if (!b) return b;
  const dbBiz = {};
  if (b.businessName !== undefined) dbBiz.name = b.businessName;
  if (b.name !== undefined) dbBiz.name = b.name;
  if (b.currency !== undefined) dbBiz.currency = b.currency;
  if (b.description !== undefined) dbBiz.description = b.description;
  if (b.address !== undefined) dbBiz.address = b.address;
  if (b.phone !== undefined) dbBiz.phone = b.phone;
  if (b.email !== undefined) dbBiz.email = b.email;
  if (b.workSchedule !== undefined) dbBiz.work_schedule = b.workSchedule;
  if (b.theme !== undefined) dbBiz.theme = b.theme;
  return dbBiz;
};

const mapDbServiceToFrontend = (s) => {
  if (!s) return s;
  return {
    ...s,
    categoryId: s.category_id,
    genderCategory: s.gender_category,
    globalServiceId: s.global_service_id,
    duration: window.minutesToDuration(s.duration || 60)
  };
};

const mapFrontendServiceToDb = (s) => {
  if (!s) return s;
  return {
    name: s.name,
    category_id: s.categoryId,
    gender_category: s.genderCategory,
    price: s.price,
    duration: window.durationToMinutes(s.duration),
    description: s.description,
    global_service_id: s.globalServiceId
  };
};

const mapDbMasterToFrontend = (m) => {
  if (!m) return m;
  return {
    ...m,
    workHoursStart: m.work_hours_start,
    workHoursEnd: m.work_hours_end
  };
};

const mapFrontendMasterToDb = (m) => {
  if (!m) return m;
  const dbMaster = {};
  if (m.name !== undefined) dbMaster.name = m.name;
  if (m.phone !== undefined) dbMaster.phone = m.phone;
  if (m.specialization !== undefined) dbMaster.specialization = m.specialization;
  if (m.avatar !== undefined) dbMaster.avatar = m.avatar;
  if (m.percentage !== undefined) dbMaster.percentage = m.percentage;
  if (m.workHoursStart !== undefined) dbMaster.work_hours_start = m.workHoursStart;
  if (m.workHoursEnd !== undefined) dbMaster.work_hours_end = m.workHoursEnd;
  if (m.services !== undefined) {
    dbMaster.services = typeof m.services === 'string' ? JSON.parse(m.services) : m.services;
  }
  if (m.user_id !== undefined) dbMaster.user_id = m.user_id;
  if (m.business_id !== undefined) dbMaster.business_id = m.business_id;
  return dbMaster;
};

const mapDbBookingToFrontend = (b, clients = [], services = [], masters = []) => {
  if (!b) return b;
  const client = b.client || clients.find(c => c.id === b.client_id) || {};
  const master = b.master || masters.find(m => m.id === b.master_id) || {};
  
  // Restore serviceIds from services JSONB or fallback to service_id
  let serviceIds = b.service_id;
  if (b.services) {
    try {
      const parsed = typeof b.services === 'string' ? JSON.parse(b.services) : b.services;
      if (Array.isArray(parsed) && parsed.length > 0) {
        serviceIds = parsed.join(',');
      }
    } catch (e) {
      console.error('Error parsing booking services:', e);
    }
  }

  let serviceName = 'Неизвестная услуга';
  let duration = '01:00';
  let calculatedPrice = 0;
  
  if (serviceIds) {
    const ids = serviceIds.split(',').map(id => id.trim()).filter(Boolean);
    let totalDurationMins = 0;
    let names = [];
    let totalPrice = 0;
    ids.forEach(id => {
      const s = services.find(x => x.id === id);
      if (s) {
        totalDurationMins += window.durationToMinutes(s.duration);
        names.push(s.name);
        totalPrice += parseFloat(s.price) || 0;
      }
    });
    if (names.length > 0) {
      serviceName = names.join(' + ');
      duration = window.minutesToDuration(totalDurationMins || 60);
      calculatedPrice = totalPrice;
    }
  }

  return {
    ...b,
    price: (b.price !== null && b.price !== undefined) ? b.price : calculatedPrice,
    masterId: b.master_id,
    clientId: b.client_id,
    serviceId: serviceIds,
    clientName: client.name || 'Неизвестный клиент',
    clientPhone: client.phone || '',
    masterName: master.name || 'Любой мастер',
    serviceName,
    duration
  };
};

const mapFrontendBookingToDb = (b) => {
  if (!b) return b;
  const dbBooking = {};
  
  if (b.masterId !== undefined) dbBooking.master_id = b.masterId || null;
  if (b.clientId !== undefined) dbBooking.client_id = b.clientId || null;
  if (b.date !== undefined) dbBooking.date = b.date;
  if (b.time !== undefined) dbBooking.time = b.time;
  if (b.status !== undefined) dbBooking.status = b.status;
  if (b.price !== undefined) dbBooking.price = b.price;
  
  if (b.serviceId !== undefined) {
    const isMultiple = b.serviceId && b.serviceId.includes(',');
    const mainServiceId = isMultiple ? b.serviceId.split(',')[0].trim() : b.serviceId;
    const serviceList = b.serviceId ? b.serviceId.split(',').map(id => id.trim()).filter(Boolean) : [];
    
    dbBooking.service_id = mainServiceId || null;
    dbBooking.services = serviceList;
  }
  
  return dbBooking;
};

const mapDbTransactionToFrontend = (t) => {
  if (!t) return t;
  return {
    ...t,
    paymentMethod: t.payment_method,
    categoryId: t.category_id,
    bookingId: t.booking_id,
    shiftId: t.shift_id,
    transactionDateTime: t.transaction_date_time,
    createdAt: t.created_at
  };
};

const mapFrontendTransactionToDb = (t) => {
  if (!t) return t;
  const dbTx = {};
  if (t.type !== undefined) dbTx.type = t.type;
  if (t.amount !== undefined) dbTx.amount = t.amount;
  if (t.description !== undefined) dbTx.description = t.description;
  if (t.paymentMethod !== undefined) dbTx.payment_method = t.paymentMethod;
  if (t.categoryId !== undefined) dbTx.category_id = t.categoryId;
  if (t.bookingId !== undefined) dbTx.booking_id = t.bookingId;
  if (t.shiftId !== undefined) dbTx.shift_id = t.shiftId;
  if (t.transactionDateTime !== undefined) dbTx.transaction_date_time = t.transactionDateTime;
  return dbTx;
};

const mapDbShiftToFrontend = (s) => {
  if (!s) return s;
  return {
    ...s,
    openingCash: s.opening_cash,
    closingCash: s.closing_cash,
    openedAt: s.opened_at,
    closedAt: s.closed_at
  };
};

const mapFrontendShiftToDb = (s) => {
  if (!s) return s;
  const dbShift = {};
  if (s.status !== undefined) dbShift.status = s.status;
  if (s.openingCash !== undefined) dbShift.opening_cash = s.openingCash;
  if (s.closingCash !== undefined) dbShift.closing_cash = s.closingCash;
  if (s.openedAt !== undefined) dbShift.opened_at = s.openedAt;
  if (s.closedAt !== undefined) dbShift.closed_at = s.closedAt;
  if (s.date !== undefined) dbShift.date = s.date;
  return dbShift;
};

// Внутренние приватные хелперы для взаимодействия с таблицами Supabase (не доступны через window.api)
async function apiInsert(client, table, data) {
  const activeId = window.state?.ui?.activeBusinessId;
  if (table !== 'business' && table !== 'profiles' && table !== 'business_members' && activeId) {
    data.business_id = activeId;
  }
  const { data: res, error } = await client.from(table).insert([data]).select().single();
  if (error) throw error;
  return res;
}

async function apiUpdate(client, table, id, data) {
  const { data: res, error } = await client.from(table).update(data).eq('id', id).select().single();
  if (error) throw error;
  return res;
}

async function apiDelete(client, table, id) {
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

async function findOrCreateClient(client, activeId, name, phone) {
  if (!phone && !name) return null;

  if (phone) {
    const { data: existing, error: findErr } = await client
      .from('clients')
      .select('id')
      .eq('business_id', activeId)
      .eq('phone', phone)
      .limit(1);

    if (!findErr && existing && existing.length > 0) {
      return existing[0].id;
    }
  } else if (name) {
    const { data: existing, error: findErr } = await client
      .from('clients')
      .select('id')
      .eq('business_id', activeId)
      .eq('name', name)
      .limit(1);

    if (!findErr && existing && existing.length > 0) {
      return existing[0].id;
    }
  }

  const { data: newClient, error: createErr } = await client
    .from('clients')
    .insert([{
      business_id: activeId,
      name: name || 'Новый клиент',
      phone: phone
    }])
    .select()
    .single();

  if (createErr) {
    console.error('Ошибка создания клиента:', createErr);
    return null;
  }
  
  if (window.state && window.state.clients && newClient) {
    window.state.clients.push(newClient);
  }
  
  return newClient.id;
}

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

  async updateUserProfile(username, email, password = '') {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');

    const updateData = { data: { username } };
    if (email && email !== user.email) {
      updateData.email = email;
    }
    if (password) {
      updateData.password = password;
    }

    const { error: authErr } = await this.client.auth.updateUser(updateData);
    if (authErr) throw authErr;

    const { error: profileErr } = await this.client
      .from('profiles')
      .update({ username })
      .eq('id', user.id);
    if (profileErr) throw profileErr;

    return true;
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

  // Обновление роли сотрудника (Мастер / Менеджер)
  async updateEmployeeRole(memberId, userId, role, username) {
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) throw new Error('Салон не выбран');

    const { error: updateError } = await this.client
      .from('business_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) throw updateError;

    if (role === 'master') {
      // Автоматически создаем карточку мастера, если ее еще нет
      const { data: existing, error: findErr } = await this.client
        .from('masters')
        .select('*')
        .eq('business_id', activeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (findErr) console.error('Ошибка поиска мастера:', findErr);

      if (!existing) {
        const { error: masterError } = await this.client.from('masters').insert([
          {
            business_id: activeId,
            name: username,
            user_id: userId,
            specialization: 'Мастер'
          }
        ]);
        if (masterError) console.error('Ошибка автоматического создания мастера при смене роли:', masterError);
      }
    } else if (role === 'manager') {
      // Удаляем карточку мастера, если перевели в менеджеры
      const { error: delError } = await this.client
        .from('masters')
        .delete()
        .eq('business_id', activeId)
        .eq('user_id', userId);
      if (delError) console.error('Ошибка удаления мастера при смене роли:', delError);
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

      profile.email = user.email;

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
        const [businessesRes, profilesRes, globalCatsRes, globalServicesRes, transactionsRes, membersRes] = await Promise.all([
          this.client.from('business').select('*, profiles(username)'),
          this.client.from('profiles').select('*'),
          this.client.from('global_categories').select('*').order('name'),
          this.client.from('global_services').select('*').order('name'),
          this.client.from('transactions').select('*, business(name)').order('transaction_date_time', { ascending: false }),
          this.client.from('business_members').select('*, profiles(username), business(name)')
        ]);
        result.allBusinesses = businessesRes.data || [];
        result.allUsers = profilesRes.data || [];
        result.globalCategories = globalCatsRes.data || [];
        result.globalServices = globalServicesRes.data || [];
        result.allTransactions = transactionsRes.data || [];
        result.allMembers = membersRes.data || [];
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

          let dateFrom = window.state?.ui?.filters?.dateFrom;
          let dateTo = window.state?.ui?.filters?.dateTo;
          if (!dateFrom && !dateTo) {
            const dFrom = new Date();
            dFrom.setDate(dFrom.getDate() - 60);
            const dTo = new Date();
            dTo.setDate(dTo.getDate() + 60);
            dateFrom = dFrom.toISOString().split('T')[0];
            dateTo = dTo.toISOString().split('T')[0];
          }

          // Получаем первую группу основных данных (6 запросов)
          const [
            businessRes, categoriesRes, mastersRes, servicesRes, clientsRes, bookingsRes
          ] = await Promise.all([
            this.client.from('business').select('*').eq('id', activeId).maybeSingle(),
            this.client.from('categories').select('*').eq('business_id', activeId),
            this.client.from('masters').select('*').eq('business_id', activeId),
            this.client.from('services').select('*').eq('business_id', activeId),
            this.client.from('clients').select('*').eq('business_id', activeId),
            this.client.from('bookings').select('*, client:clients(name, phone), master:masters(name)').eq('business_id', activeId).gte('date', dateFrom).lte('date', dateTo)
          ]);

          // Получаем вторую группу финансовых и административных данных (5 запросов)
          const [
            transactionsRes, shiftsRes, walletsRes, tCatRes, membersRes
          ] = await Promise.all([
            this.client.from('transactions').select('*').eq('business_id', activeId),
            this.client.from('shifts').select('*').eq('business_id', activeId),
            this.client.from('wallets').select('*').eq('business_id', activeId),
            this.client.from('transaction_categories').select('*').eq('business_id', activeId),
            this.client.from('business_members').select('*, profiles(username)').eq('business_id', activeId)
          ]);


          result.business = mapDbBusinessToFrontend(businessRes.data) || null;
          result.categories = categoriesRes.data || [];
          result.masters = (mastersRes.data || []).map(mapDbMasterToFrontend);
          result.clients = clientsRes.data || [];
          result.transactions = (transactionsRes.data || []).map(mapDbTransactionToFrontend);
          result.shifts = (shiftsRes.data || []).map(mapDbShiftToFrontend);
          result.wallets = walletsRes.data || [];
          result.transactionCategories = tCatRes.data || [];
          result.jobApplications = membersRes.data || [];

          // Применяем мапперы для локальных услуг и записей
          result.services = (servicesRes.data || []).map(mapDbServiceToFrontend);
          result.bookings = (bookingsRes.data || []).map(b => mapDbBookingToFrontend(b, result.clients, result.services, result.masters));
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

          let dateFrom = window.state?.ui?.filters?.dateFrom;
          let dateTo = window.state?.ui?.filters?.dateTo;
          if (!dateFrom && !dateTo) {
            const dFrom = new Date();
            dFrom.setDate(dFrom.getDate() - 60);
            const dTo = new Date();
            dTo.setDate(dTo.getDate() + 60);
            dateFrom = dFrom.toISOString().split('T')[0];
            dateTo = dTo.toISOString().split('T')[0];
          }

          const [
            businessRes, categoriesRes, mastersRes, servicesRes, clientsRes, bookingsRes
          ] = await Promise.all([
            this.client.from('business').select('*').eq('id', activeId).maybeSingle(),
            this.client.from('categories').select('*').eq('business_id', activeId),
            this.client.from('masters').select('*').eq('business_id', activeId),
            this.client.from('services').select('*').eq('business_id', activeId),
            this.client.from('clients').select('*').eq('business_id', activeId),
            this.client.from('bookings').select('*, client:clients(name, phone), master:masters(name)').eq('business_id', activeId).gte('date', dateFrom).lte('date', dateTo)
          ]);

          result.business = mapDbBusinessToFrontend(businessRes.data) || null;
          result.categories = categoriesRes.data || [];
          result.masters = (mastersRes.data || []).map(mapDbMasterToFrontend);
          result.clients = clientsRes.data || [];

          result.services = (servicesRes.data || []).map(mapDbServiceToFrontend);
          result.bookings = (bookingsRes.data || []).map(b => mapDbBookingToFrontend(b, result.clients, result.services, result.masters));

          const approvedMember = result.myEmployments.find(e => e.business_id === activeId && e.status === 'approved');
          if (approvedMember && approvedMember.role === 'manager') {
            const [transactionsRes, shiftsRes, walletsRes, tCatRes] = await Promise.all([
              this.client.from('transactions').select('*').eq('business_id', activeId),
              this.client.from('shifts').select('*').eq('business_id', activeId),
              this.client.from('wallets').select('*').eq('business_id', activeId),
              this.client.from('transaction_categories').select('*').eq('business_id', activeId)
            ]);
            result.transactions = (transactionsRes.data || []).map(mapDbTransactionToFrontend);
            result.shifts = (shiftsRes.data || []).map(mapDbShiftToFrontend);
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
    return mapDbBusinessToFrontend(data);
  }

  async updateSettings(dataToUpdate) {
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) return null;
    const dbData = mapFrontendBusinessToDb(dataToUpdate);
    const { data, error } = await this.client.from('business').update(dbData).eq('id', activeId).select().single();
    if (error) throw error;
    return mapDbBusinessToFrontend(data);
  }

  // Категории
  async createCategory(data) { return apiInsert(this.client, 'categories', data); }
  async updateCategory(id, data) { return apiUpdate(this.client, 'categories', id, data); }
  async deleteCategory(id) { return apiDelete(this.client, 'categories', id); }

  // Мастера
  async createMaster(data) { 
    return apiInsert(this.client, 'masters', mapFrontendMasterToDb(data))
      .then(mapDbMasterToFrontend); 
  }
  async updateMaster(id, data) { 
    return apiUpdate(this.client, 'masters', id, mapFrontendMasterToDb(data))
      .then(mapDbMasterToFrontend); 
  }
  async deleteMaster(id) { return apiDelete(this.client, 'masters', id); }

  // Обновление прав доступа сотрудника
  async updateEmployeePermissions(memberId, permissions) {
    const { error } = await this.client
      .from('business_members')
      .update({ permissions })
      .eq('id', memberId);
    if (error) throw error;
    return true;
  }

  // Услуги
  async createService(data) { 
    return apiInsert(this.client, 'services', mapFrontendServiceToDb(data))
      .then(mapDbServiceToFrontend); 
  }
  async updateService(id, data) { 
    return apiUpdate(this.client, 'services', id, mapFrontendServiceToDb(data))
      .then(mapDbServiceToFrontend); 
  }
  async deleteService(id) { return apiDelete(this.client, 'services', id); }

  // Клиенты
  async createClient(data) { return apiInsert(this.client, 'clients', data); }
  async updateClient(id, data) { return apiUpdate(this.client, 'clients', id, data); }

  async createBooking(data) { 
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) throw new Error('Салон не выбран');

    let clientId = data.clientId;
    if (!clientId && (data.clientPhone || data.clientName)) {
      clientId = await findOrCreateClient(this.client, activeId, data.clientName, data.clientPhone);
    }

    const dbBooking = mapFrontendBookingToDb(data);
    if (clientId) {
      dbBooking.client_id = clientId;
    }

    return apiInsert(this.client, 'bookings', dbBooking)
      .then(b => mapDbBookingToFrontend(b, window.state.clients, window.state.services, window.state.masters)); 
  }
  async updateBooking(id, data) { 
    const activeId = window.state?.ui?.activeBusinessId;
    if (!activeId) throw new Error('Салон не выбран');

    let clientId = data.clientId;
    if (!clientId && (data.clientPhone || data.clientName)) {
      clientId = await findOrCreateClient(this.client, activeId, data.clientName, data.clientPhone);
    }

    const dbBooking = mapFrontendBookingToDb(data);
    if (clientId) {
      dbBooking.client_id = clientId;
    }

    return apiUpdate(this.client, 'bookings', id, dbBooking)
      .then(b => mapDbBookingToFrontend(b, window.state.clients, window.state.services, window.state.masters)); 
  }
  async deleteBooking(id) { return apiDelete(this.client, 'bookings', id); }

  // Транзакции
  async createTransaction(data) { 
    return apiInsert(this.client, 'transactions', mapFrontendTransactionToDb(data))
      .then(mapDbTransactionToFrontend); 
  }
  async updateTransaction(id, data) { 
    return apiUpdate(this.client, 'transactions', id, mapFrontendTransactionToDb(data))
      .then(mapDbTransactionToFrontend); 
  }
  async deleteTransaction(id) { return apiDelete(this.client, 'transactions', id); }

  // Категории транзакций
  async createTransactionCategory(data) { return apiInsert(this.client, 'transaction_categories', data); }
  async updateTransactionCategory(id, data) { return apiUpdate(this.client, 'transaction_categories', id, data); }
  async deleteTransactionCategory(id) { return apiDelete(this.client, 'transaction_categories', id); }

  // Кошельки
  async createWallet(data) { return apiInsert(this.client, 'wallets', data); }
  async updateWallet(id, data) { return apiUpdate(this.client, 'wallets', id, data); }
  async deleteWallet(id) { return apiDelete(this.client, 'wallets', id); }

  // Смены
  async openShift(opening_cash, date = null) {
    return apiInsert(this.client, 'shifts', {
      status: 'open',
      opening_cash: opening_cash,
      date: date || new Date().toISOString().split('T')[0]
    }).then(mapDbShiftToFrontend);
  }

  async closeShift(id, closing_cash) {
    return apiUpdate(this.client, 'shifts', id, {
      status: 'closed',
      closing_cash: closing_cash,
      closed_at: new Date().toISOString()
    }).then(mapDbShiftToFrontend);
  }

  async updateShiftCash(id, data) {
    const dbData = {};
    if (data.openingCash !== undefined) dbData.opening_cash = parseFloat(data.openingCash) || 0;
    if (data.closingCash !== undefined) dbData.closing_cash = parseFloat(data.closingCash) || 0;
    return apiUpdate(this.client, 'shifts', id, dbData).then(mapDbShiftToFrontend);
  }

  async reopenShift(id) {
    return apiUpdate(this.client, 'shifts', id, {
      status: 'open',
      closed_at: null,
      closing_cash: 0
    }).then(mapDbShiftToFrontend);
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

  async createGlobalCategory(name) {
    const { data, error } = await this.client.from('global_categories').insert([{ name }]).select().single();
    if (error) throw error;
    return data;
  }
  async updateGlobalCategory(id, name) {
    const { data, error } = await this.client.from('global_categories').update({ name }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  async deleteGlobalCategory(id) {
    const { error } = await this.client.from('global_categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async createGlobalService(categoryId, name, price, duration, genderCategory = '', description = '') {
    const { data, error } = await this.client.from('global_services').insert([{
      category_id: categoryId,
      name,
      price,
      duration,
      gender_category: genderCategory,
      description
    }]).select().single();
    if (error) throw error;
    return data;
  }
  async updateGlobalService(id, categoryId, name, price, duration, genderCategory = '', description = '') {
    const { data, error } = await this.client.from('global_services').update({
      category_id: categoryId,
      name,
      price,
      duration,
      gender_category: genderCategory,
      description
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  async deleteGlobalService(id) {
    const { error } = await this.client.from('global_services').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

window.api = new SupabaseAPI();
