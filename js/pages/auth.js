// ============================================
// auth.js — Авторизация по Email/Пароль (Supabase)
// ============================================

if (state.ui.authEmail === undefined) state.ui.authEmail = '';
if (state.ui.authPassword === undefined) state.ui.authPassword = '';
if (state.ui.authError === undefined) state.ui.authError = '';
if (state.ui.isRegisterMode === undefined) state.ui.isRegisterMode = false;

window.renderAuth = function () {
    const loading = state.ui.loading;
    const error = state.ui.authError;
    const isRegister = state.ui.isRegisterMode;

    const spinnerHtml = loading ? `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;z-index:20;animation:fadeIn 0.3s forwards;padding:24px;box-sizing:border-box;text-align:center;">
        <div style="font-size: 48px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15)); animation: pulse 1.5s infinite;">💎</div>
        <div>
          <h2 style="font-weight: 800; font-size: 22px; color: #1a1a2e; margin-bottom: 4px; letter-spacing: -0.02em;">Suluu Business</h2>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 8px 0;">
          <span class="spinner" style="width: 36px; height: 36px; border: 3.5px solid #e2e8f0; border-top-color: #764ba2; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
          <div style="font-weight: 700; color: #764ba2; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">Пожалуйста, подождите...</div>
        </div>
    </div>
    ` : '';

    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;box-sizing:border-box;">
        <div class="card animate-scale-in" style="width:100%;max-width:380px;padding:32px 24px;backdrop-filter:blur(20px);background:rgba(255,255,255,0.96);border-radius:28px;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;overflow:hidden;box-sizing:border-box;">
            
            ${spinnerHtml}

            <div style="text-align:center; margin-bottom:24px;">
                <div style="font-size:44px;margin-bottom:8px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">💎</div>
                <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0 0 4px;letter-spacing:-0.02em;">Suluu Business</h1>
                <p style="color:#666;font-size:13px;margin:0;">${isRegister ? 'Создайте новый аккаунт' : 'Войдите в свою учетную запись'}</p>
            </div>

            ${error ? `
            <div style="background:#fee2e2;color:#dc2626;padding:10px 14px;border-radius:12px;font-size:13px;margin-bottom:20px;font-weight:700;animation:fadeIn 0.2s;">
                ${error}
            </div>` : ''}

            <form onsubmit="handleAuthSubmit(event)" style="display:flex; flex-direction:column; gap:16px;">
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color:#4a5568; margin-bottom:6px;">Логин</label>
                    <input type="text" id="auth-email" required value="${state.ui.authEmail}" onchange="setUI({authEmail: this.value})"
                        style="width:100%; padding:14px 16px; border-radius:14px; border:2px solid #e2e8f0; font-size:14px; box-sizing:border-box; outline:none; transition:all 0.3s; background:#fff; color:#1a1a2e;"
                        onfocus="this.style.borderColor='#764ba2'" onblur="this.style.borderColor='#e2e8f0'">
                </div>
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color:#4a5568; margin-bottom:6px;">Пароль</label>
                    <input type="password" id="auth-password" required value="${state.ui.authPassword}" onchange="setUI({authPassword: this.value})"
                        style="width:100%; padding:14px 16px; border-radius:14px; border:2px solid #e2e8f0; font-size:14px; box-sizing:border-box; outline:none; transition:all 0.3s; background:#fff; color:#1a1a2e;"
                        onfocus="this.style.borderColor='#764ba2'" onblur="this.style.borderColor='#e2e8f0'">
                </div>

                <button type="submit" style="width:100%; padding:14px; border-radius:14px; background:#764ba2; color:white; font-size:15px; font-weight:700; border:none; cursor:pointer; margin-top:8px; box-shadow:0 4px 12px rgba(118,75,162,0.3); transition:all 0.2s;">
                    ${isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </form>

            <div style="text-align:center; margin-top:20px; font-size:13px; color:#4a5568;">
                ${isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                <button onclick="toggleAuthMode()" style="background:none; border:none; color:#764ba2; font-weight:700; cursor:pointer; font-size:13px; padding:0; margin-left:4px;">
                    ${isRegister ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </div>
        </div>
    </div>
    <style>
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    </style>`;
};

window.toggleAuthMode = function() {
    setUI({ isRegisterMode: !state.ui.isRegisterMode, authError: '' });
};

window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const rawLogin = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    
    if (!rawLogin || !password) return;

    // Supabase requires an email format, so we append a hidden domain to the username
    const email = rawLogin.includes('@') ? rawLogin : `${rawLogin}@suluu.app`;

    setUI({ loading: true, authError: '', authEmail: rawLogin, authPassword: password });

    try {
        if (state.ui.isRegisterMode) {
            await api.register(email, password);
            showToast('Регистрация успешна!', 'success');
        } else {
            await api.authenticate(email, password);
            showToast('Вход успешен!', 'success');
        }

        // Подгружаем ВСЕ данные с бэкенда за ОДИН запрос
        const allData = await api.getAll();

        setState({ 
            isAuthenticated: true, 
            business: allData.business || state.business,
            categories: allData.categories || [],
            masters: allData.masters || [], 
            clients: allData.clients || [], 
            services: allData.services || [], 
            bookings: allData.bookings || [], 
            transactions: allData.transactions || [], 
            shifts: allData.shifts || [], 
            wallets: allData.wallets || [],
            transactionCategories: allData.transactionCategories || [],
            currentPage: 'dashboard'
        });
        
        // Setup Realtime 
        if (window.setupRealtime) {
            window.setupRealtime();
        }
        
    } catch (err) {
        console.error('Auth Error:', err);
        setUI({ authError: err.message, loading: false });
    }
};

window.renderSetup = function() {
    // В новой архитектуре с Supabase отдельный экран setup больше не нужен, 
    // но оставляем заглушку, чтобы роутер не сломался
    return renderAuth();
};
