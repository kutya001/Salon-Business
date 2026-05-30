// ============================================
// api.js — Клиент для интеграции с Google Apps Script
// ============================================

class GASClient {
  constructor() {
    this.gasUrl = localStorage.getItem('gas_url') || '';
    this.token = localStorage.getItem('auth_token') || '';
  }

  isConfigured() {
    return !!this.gasUrl;
  }

  setGasUrl(url) {
    this.gasUrl = url;
    localStorage.setItem('gas_url', url);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  logout() {
    this.token = '';
    localStorage.removeItem('auth_token');
    setState({ isAuthenticated: false });
    navigate('auth');
    showToast('Вы вышли из системы', 'info');
  }

  async request(action, data = {}, options = { background: false }) {
    if (!this.gasUrl) {
      if (!options.background) showToast('Служба бэкенда не настроена', 'error');
      throw new Error('GAS URL not configured');
    }

    // Логируем отправку
    if (window.logApiCall) window.logApiCall('send', action, data);

    // Увеличиваем счетчик синхронизации (для спиннера), если это не фоновый запрос
    if (!options.background && window.state && window.state.ui) {
      window.setUI({ syncingCount: (window.state.ui.syncingCount || 0) + 1 });
    }

    try {
      const response = await fetch(this.gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Решает проблему preflight CORS на стороне GAS
        },
        body: JSON.stringify({
          action,
          token: this.token,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        if (result.code === 401) {
          if (window.logApiCall) window.logApiCall('error', action, result.error || 'Сессия истекла');
          this.logout();
          throw new Error(result.error || 'Сессия истекла');
        }
        if (window.logApiCall) window.logApiCall('error', action, result.error || 'Произошла ошибка');
        throw new Error(result.error || 'Произошла неизвестная ошибка');
      }

      // Логируем успешный прием
      if (window.logApiCall) window.logApiCall('recv', action, result.data);

      return result.data;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      if (window.logApiCall && !error.message.includes('Сессия истекла')) {
        window.logApiCall('error', action, error.message);
      }
      if (!options.background) showToast(error.message || 'Ошибка подключения к бэкенду', 'error');
      throw error;
    } finally {
      // Уменьшаем счетчик синхронизации
      if (!options.background && window.state && window.state.ui) {
        window.setUI({ syncingCount: Math.max(0, (window.state.ui.syncingCount || 0) - 1) });
      }
    }
  }

  // Методы-обертки
  async isPinConfigured() {
    return await this.request('isPinConfigured');
  }

  async authenticate(password) {
    const data = await this.request('authenticate', { password });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getAll(options = {}) {
    return await this.request('getAll', {}, options);
  }

  async getSettings() {
    return await this.request('getSettings');
  }

  async updateSettings(data, options = {}) {
    return await this.request('updateSettings', data, options);
  }

  async changePassword(oldPassword, newPassword) {
    return await this.request('changePassword', { oldPassword, newPassword });
  }

  // Категории
  async getCategories() {
    return await this.request('getCategories');
  }

  async createCategory(data) {
    return await this.request('createCategory', data);
  }

  async updateCategory(id, data) {
    return await this.request('updateCategory', { id, ...data });
  }

  async deleteCategory(id) {
    return await this.request('deleteCategory', { id });
  }

  async getMasters() {
    return await this.request('getMasters');
  }

  async createMaster(data) {
    return await this.request('createMaster', data);
  }

  async updateMaster(id, data) {
    return await this.request('updateMaster', { id, ...data });
  }

  async deleteMaster(id) {
    return await this.request('deleteMaster', { id });
  }

  async getServices() {
    return await this.request('getServices');
  }

  async createService(data) {
    return await this.request('createService', data);
  }

  async updateService(id, data) {
    return await this.request('updateService', { id, ...data });
  }

  async deleteService(id) {
    return await this.request('deleteService', { id });
  }

  async getClients() {
    return await this.request('getClients');
  }

  async createClient(data) {
    return await this.request('createClient', data);
  }

  async updateClient(id, data) {
    return await this.request('updateClient', { id, ...data });
  }

  async getBookings(filters = {}) {
    return await this.request('getBookings', filters);
  }

  async createBooking(data, options = {}) {
    return await this.request('createBooking', data, options);
  }

  async updateBooking(id, data, options = {}) {
    return await this.request('updateBooking', { id, ...data }, options);
  }

  async deleteBooking(id) {
    return await this.request('deleteBooking', { id });
  }

  async getTransactions(filters = {}) {
    return await this.request('getTransactions', filters);
  }

  async createTransaction(data, options = {}) {
    return await this.request('createTransaction', data, options);
  }

  async getShifts() {
    return await this.request('getShifts');
  }

  async openShift(openingCash, options = {}) {
    return await this.request('openShift', { openingCash }, options);
  }

  async closeShift(id, closingCash, options = {}) {
    return await this.request('closeShift', { id, closingCash }, options);
  }

  async reopenShift(id, options = {}) {
    return await this.request('reopenShift', { id }, options);
  }
}

window.api = new GASClient();
