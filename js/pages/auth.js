// ============================================
// auth.js — Авторизация и первоначальная настройка
// ============================================

window.renderAuth = function () {
    const loading = state.ui.loading;
    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;">
        <div class="card animate-scale-in" style="width:100%;max-width:400px;padding:40px 32px;text-align:center;backdrop-filter:blur(20px);background:rgba(255,255,255,0.95);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;overflow:hidden;">
            
            <!-- Анимация ответа от сервера (Стеклянный спиннер) -->
            ${loading ? `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;animation:fadeIn 0.3s forwards;">
                <span class="spinner" style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#764ba2;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;"></span>
                <div style="font-weight:800;color:#1a1a2e;font-size:15px;letter-spacing:-0.01em;animation:pulse 1.5s infinite;display:inline-block;">Синхронизация с Google...</div>
            </div>
            ` : ''}

            <div style="font-size:56px;margin-bottom:12px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.1));">💎</div>
            <h1 style="font-size:28px;font-weight:800;color:#1a1a2e;margin:0 0 4px;">Suluu Business</h1>
            <p style="color:#666;font-size:14px;margin:0 0 32px;">Вход в панель управления</p>

            <div id="auth-error" style="display:none;background:#fee2e2;color:#dc2626;padding:10px 16px;border-radius:12px;font-size:13px;margin-bottom:16px;font-weight:600;"></div>

            <div class="form-group" style="margin-bottom:20px;position:relative;">
                <input type="password" id="auth-password" class="form-input"
                    placeholder="Введите пароль"
                    style="width:100%;padding:14px 48px 14px 16px;border-radius:14px;border:2px solid #e2e8f0;font-size:15px;transition:all 0.3s;outline:none;box-sizing:border-box;"
                    onkeydown="if(event.key==='Enter')handleLogin()"
                    onfocus="this.style.borderColor='#764ba2';this.style.boxShadow='0 0 0 3px rgba(118,75,162,0.1)'"
                    onblur="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
                <button onclick="const i=document.getElementById('auth-password');i.type=i.type==='password'?'text':'password'" 
                    style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:4px;">
                    👁
                </button>
            </div>

            <button onclick="handleLogin()" class="btn btn-primary" 
                style="width:100%;padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;"
                ${loading ? 'disabled' : ''}>
                ${loading
                    ? '<span style="display:inline-flex;align-items:center;gap:8px;"><span class="spinner" style="width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block;"></span> Входим...</span>'
                    : 'Войти'}
            </button>

            <!-- Кнопка всегда изменить URL скрипта на странице входа -->
            <button onclick="navigate('setup')" style="background:none;border:none;color:#764ba2;font-size:13px;font-weight:700;cursor:pointer;margin-top:20px;text-decoration:none;display:inline-block;transition:all 0.2s;" onmouseover="this.style.color='#667eea'" onmouseout="this.style.color='#764ba2'">
                🔧 Настройки подключения (GAS URL)
            </button>

            <p style="margin-top:24px;font-size:11px;color:#aaa;">© Suluu Business v1.0</p>
        </div>
    </div>
    <style>
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    </style>`;
};

window.handleLogin = async function () {
    const input = document.getElementById('auth-password');
    const errEl = document.getElementById('auth-error');
    const password = input ? input.value.trim() : '';

    if (!password) {
        if (errEl) { errEl.textContent = 'Введите пароль'; errEl.style.display = 'block'; }
        return;
    }

    setUI({ loading: true });
    try {
        const { token } = await api.authenticate(password);
        if (token) localStorage.setItem('auth_token', token);

        const [masters, clients, services, bookings, transactions, shifts, business] = await Promise.all([
            api.getMasters(), api.getClients(), api.getServices(),
            api.getBookings(), api.getTransactions(), api.getShifts(), api.getSettings()
        ]);

        setState({ isAuthenticated: true, masters, clients, services, bookings, transactions, shifts, business });
        navigate('dashboard');
        showToast('Добро пожаловать!', 'success');
    } catch (e) {
        setUI({ loading: false });
        if (errEl) { errEl.textContent = 'Неверный пароль'; errEl.style.display = 'block'; }
        showToast('Ошибка авторизации', 'error');
    }
};

window.renderSetup = function () {
    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;">
        <div class="card animate-scale-in" style="width:100%;max-width:440px;padding:36px 32px;backdrop-filter:blur(20px);background:rgba(255,255,255,0.95);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align:center;margin-bottom:28px;">
                <div style="font-size:48px;margin-bottom:8px;">⚙️</div>
                <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0 0 4px;">Первоначальная настройка</h1>
                <p style="color:#666;font-size:13px;margin:0;">Подключите ваш бизнес к Suluu</p>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">URL Google Apps Script</label>
                <input type="url" id="setup-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/..." 
                    style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">Название бизнеса</label>
                <input type="text" id="setup-business-name" class="form-input" placeholder="Мой салон красоты"
                    style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>
            <div class="form-group" style="margin-bottom:24px;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">Пароль доступа</label>
                <input type="password" id="setup-password" class="form-input" placeholder="Придумайте пароль"
                    style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>

            <button onclick="handleSetupSave()" class="btn btn-primary" style="width:100%;padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;">
                Сохранить и продолжить
            </button>
        </div>
    </div>`;
};

window.handleSetupSave = async function () {
    const gasUrl = document.getElementById('setup-gas-url')?.value.trim();
    const name = document.getElementById('setup-business-name')?.value.trim();

    if (!gasUrl) { showToast('Укажите URL скрипта', 'error'); return; }
    if (!name) { showToast('Укажите название бизнеса', 'error'); return; }

    localStorage.setItem('gas_url', gasUrl);
    try {
        await api.updateSettings({ name });
        showToast('Настройка завершена!', 'success');
        navigate('auth');
    } catch (e) {
        showToast('Ошибка сохранения', 'error');
    }
};
