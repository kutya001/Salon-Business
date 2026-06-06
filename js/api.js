// ============================================
// api.js — Клиент для интеграции с Supabase
// ============================================

const SUPABASE_URL = 'https://etmjmgugfvbwaqjzvnyn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vI28QpLgQw-sSxJja_SmOA_pthfQHjp';

// Инициализируем глобальный клиент
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class SupabaseAPI {
  constructor() {
    this.client = window.supabaseClient;
  }

  isConfigured() {
    return true; // Supabase всегда настроен (hardcoded keys)
  }

  async logout() {
    await this.client.auth.signOut();
    setState({ isAuthenticated: false });
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
      throw new Error('Неверный логин или пароль');
    }
    
    if (window.logApiCall) window.logApiCall('recv', 'authenticate', data);
    return { token: data.session.access_token, user: data.user };
  }
  
  async register(email, password) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { token: data?.session?.access_token, user: data.user };
  }

  // Общий метод для получения всех данных
  async getAll(options = {}) {
    if (!options.background && window.state && window.state.ui) {
      window.setUI({ syncingCount: (window.state.ui.syncingCount || 0) + 1 });
    }
    
    try {
      const [
        businessRes, categoriesRes, mastersRes, servicesRes, clientsRes,
        bookingsRes, transactionsRes, shiftsRes, walletsRes, tCatRes
      ] = await Promise.all([
        this.client.from('business').select('*').limit(1).single(),
        this.client.from('categories').select('*'),
        this.client.from('masters').select('*'),
        this.client.from('services').select('*'),
        this.client.from('clients').select('*'),
        this.client.from('bookings').select('*'),
        this.client.from('transactions').select('*'),
        this.client.from('shifts').select('*'),
        this.client.from('wallets').select('*'),
        this.client.from('transaction_categories').select('*')
      ]);

      const allData = {
        business: businessRes.data || { name: 'Мой Салон', currency: 'сом' },
        categories: categoriesRes.data || [],
        masters: mastersRes.data || [],
        services: servicesRes.data || [],
        clients: clientsRes.data || [],
        bookings: bookingsRes.data || [],
        transactions: transactionsRes.data || [],
        shifts: shiftsRes.data || [],
        wallets: walletsRes.data || [],
        transactionCategories: tCatRes.data || []
      };

      if (window.logApiCall) window.logApiCall('recv', 'getAll', allData);
      return allData;
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
    const { data, error } = await this.client.from('business').select('*').limit(1).single();
    if (error) throw error;
    return data;
  }

  async updateSettings(dataToUpdate) {
    const { data: business } = await this.client.from('business').select('id').limit(1).single();
    if (business) {
      const { data, error } = await this.client.from('business').update(dataToUpdate).eq('id', business.id).select().single();
      if (error) throw error;
      return data;
    }
    return null;
  }

  // Generic Helpers
  async _insert(table, data) {
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

  // Категории (Services)
  async createCategory(data) { return this._insert('categories', data); }
  async updateCategory(id, data) { return this._update('categories', id, data); }
  async deleteCategory(id) { return this._delete('categories', id); }

  // Мастера
  async createMaster(data) { return this._insert('masters', data); }
  async updateMaster(id, data) { return this._update('masters', id, data); }
  async deleteMaster(id) { return this._delete('masters', id); }

  // Услуги
  async createService(data) { return this._insert('services', data); }
  async updateService(id, data) { return this._update('services', id, data); }
  async deleteService(id) { return this._delete('services', id); }

  // Клиенты
  async createClient(data) { return this._insert('clients', data); }
  async updateClient(id, data) { return this._update('clients', id, data); }

  // Записи
  async createBooking(data) { return this._insert('bookings', data); }
  async updateBooking(id, data) { return this._update('bookings', id, data); }
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
}

window.api = new SupabaseAPI();
