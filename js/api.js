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

  async request(action, data = {}) {
    if (!this.gasUrl) {
      showToast('Служба бэкенда не настроена', 'error');
      throw new Error('GAS URL not configured');
    }

    // Логируем отправку
    if (window.logApiCall) window.logApiCall('send', action, data);

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
      showToast(error.message || 'Ошибка подключения к бэкенду', 'error');
      throw error;
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

  async getAll() {
    return await this.request('getAll');
  }

  async getSettings() {
    return await this.request('getSettings');
  }

  async updateSettings(data) {
    return await this.request('updateSettings', data);
  }

  async changePassword(oldPassword, newPassword) {
    return await this.request('changePassword', { oldPassword, newPassword });
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

  async createBooking(data) {
    return await this.request('createBooking', data);
  }

  async updateBooking(id, data) {
    return await this.request('updateBooking', { id, ...data });
  }

  async deleteBooking(id) {
    return await this.request('deleteBooking', { id });
  }

  async getTransactions(filters = {}) {
    return await this.request('getTransactions', filters);
  }

  async createTransaction(data) {
    return await this.request('createTransaction', data);
  }

  async getShifts() {
    return await this.request('getShifts');
  }

  async openShift(openingCash) {
    return await this.request('openShift', { openingCash });
  }

  async closeShift(id, closingCash) {
    return await this.request('closeShift', { id, closingCash });
  }
}

window.api = new GASClient();
