// ============================================
// auth.js — Авторизация и Регистрация с выбором роли
// ============================================

if (state.ui.authEmail === undefined) state.ui.authEmail = '';
if (state.ui.authPassword === undefined) state.ui.authPassword = '';
if (state.ui.authRole === undefined) state.ui.authRole = 'owner';
if (state.ui.authBusinessName === undefined) state.ui.authBusinessName = '';
if (state.ui.authError === undefined) state.ui.authError = '';
if (state.ui.isRegisterMode === undefined) state.ui.isRegisterMode = false;

window.renderAuth = function () {
    const loading = state.ui.loading;
    const error = state.ui.authError;
    const isRegister = state.ui.isRegisterMode;

    const spinnerHtml = loading ? `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.75);backdrop-filter:blur(20px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;z-index:20;animation:fadeIn 0.3s forwards;padding:24px;box-sizing:border-box;text-align:center;">
        <div style="animation: pulse 1.5s infinite; display: flex; justify-content: center; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gem-grad-auth)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 6px rgba(118, 75, 162, 0.2));">
                <defs>
                    <linearGradient id="gem-grad-auth" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#667eea" />
                        <stop offset="100%" stop-color="#764ba2" />
                    </linearGradient>
                </defs>
                <path d="M6 3h12l4 6-10 12L2 9z"></path>
                <path d="M11 3 8 9l4 12 4-12-3-6"></path>
                <path d="M2 9h20"></path>
            </svg>
        </div>
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
        <div class="card animate-scale-in" style="width:100%;max-width:380px;padding:32px 24px;backdrop-filter:blur(20px);background:rgba(255,255,255,0.75);border:1px solid rgba(255,255,255,0.45);border-radius:28px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;overflow:hidden;box-sizing:border-box;">
            
            ${spinnerHtml}

            <div style="text-align:center; margin-bottom:24px;">
                <div style="margin-bottom:8px; display: flex; justify-content: center; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#gem-grad-auth)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 6px rgba(118, 75, 162, 0.2));">
                        <path d="M6 3h12l4 6-10 12L2 9z"></path>
                        <path d="M11 3 8 9l4 12 4-12-3-6"></path>
                        <path d="M2 9h20"></path>
                    </svg>
                </div>
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
                        placeholder="Например: admin или master1"
                        style="width:100%; padding:14px 16px; border-radius:14px; border:2px solid #e2e8f0; font-size:14px; box-sizing:border-box; outline:none; transition:all 0.3s; background:#fff; color:#1a1a2e;"
                        onfocus="this.style.borderColor='#764ba2'" onblur="this.style.borderColor='#e2e8f0'">
                </div>
                
                ${isRegister ? `
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color:#4a5568; margin-bottom:6px;">Ваша роль</label>
                    <select id="auth-role" onchange="setUI({authRole: this.value})"
                        style="width:100%; padding:14px 16px; border-radius:14px; border:2px solid #e2e8f0; font-size:14px; box-sizing:border-box; outline:none; transition:all 0.3s; background:#fff; color:#1a1a2e; cursor:pointer;">
                        <option value="owner" ${state.ui.authRole === 'owner' ? 'selected' : ''}>Владелец салона</option>
                        <option value="manager" ${state.ui.authRole === 'manager' ? 'selected' : ''}>Менеджер салона</option>
                        <option value="master" ${state.ui.authRole === 'master' ? 'selected' : ''}>Мастер (Сотрудник)</option>
                    </select>
                </div>
                
                ${state.ui.authRole === 'owner' ? `
                <div>
                    <label style="display:block; font-size:12px; font-weight:700; color:#4a5568; margin-bottom:6px;">Название салона</label>
                    <input type="text" id="auth-business-name" required value="${state.ui.authBusinessName}" onchange="setUI({authBusinessName: this.value})"
                        placeholder="Например: Имидж Студия"
                        style="width:100%; padding:14px 16px; border-radius:14px; border:2px solid #e2e8f0; font-size:14px; box-sizing:border-box; outline:none; transition:all 0.3s; background:#fff; color:#1a1a2e;"
                        onfocus="this.style.borderColor='#764ba2'" onblur="this.style.borderColor='#e2e8f0'">
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                    <input type="checkbox" id="auth-use-finance" checked style="width: 18px; height: 18px; accent-color: #764ba2; cursor: pointer;">
                    <label for="auth-use-finance" style="font-size: 13px; font-weight: 700; color: #4a5568; cursor: pointer; user-select: none;">Учитывать финансы</label>
                </div>
                ` : ''}
                ` : ''}

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

            <div style="text-align:center; margin-top:16px; border-top:1px solid rgba(0,0,0,0.08); padding-top:16px;">
                <button onclick="setState({ currentPage: 'landing' })" style="background:none; border:none; color:#4a5568; font-weight:600; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:4px; opacity:0.8; transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8">
                    ← Вернуться на главную
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

    const email = rawLogin.includes('@') ? rawLogin : `${rawLogin}@suluu.app`;

    setUI({ loading: true, authError: '', authEmail: rawLogin, authPassword: password });

    try {
        if (state.ui.isRegisterMode) {
            const role = state.ui.authRole;
            const businessName = state.ui.authBusinessName.trim();
            
            if (role === 'owner' && !businessName) {
                throw new Error('Укажите название вашего салона');
            }

            // Регистрируем пользователя
            await api.register(email, password, rawLogin, role);
            
            // Входим сразу после регистрации
            await api.authenticate(email, password);
            
            // Если владелец, автоматически создаем салон с дефолтами
            if (role === 'owner') {
                const useFinance = document.getElementById('auth-use-finance') ? document.getElementById('auth-use-finance').checked : true;
                const bizId = await api.createBusinessWithDefaults(businessName, useFinance);
                setUI({ activeBusinessId: bizId });
            }
            
            showToast('Регистрация успешна!', 'success');
        } else {
            await api.authenticate(email, password);
            showToast('Вход успешен!', 'success');
        }

        // Подгружаем ВСЕ данные с бэкенда за ОДИН запрос
        const allData = await api.getAll();

        const updates = { 
            isAuthenticated: true, 
            userProfile: allData.userProfile,
            myBusinesses: allData.myBusinesses || [],
            myEmployments: allData.myEmployments || [],
            allSalons: allData.allSalons || [],
            business: allData.business || null,
            categories: allData.categories || [],
            masters: allData.masters || [], 
            clients: allData.clients || [], 
            services: allData.services || [], 
            bookings: allData.bookings || [], 
            transactions: allData.transactions || [], 
            shifts: allData.shifts || [], 
            wallets: allData.wallets || [],
            transactionCategories: allData.transactionCategories || [],
            globalCategories: allData.globalCategories || [],
            globalServices: allData.globalServices || []
        };

        // Роутинг в зависимости от роли
        if (allData.userProfile.role === 'super_admin') {
            updates.currentPage = 'super_admin_panel';
        } else if (allData.userProfile.role === 'owner') {
            updates.currentPage = 'dashboard';
        } else {
            const hasApproved = (allData.myEmployments || []).some(e => e.status === 'approved');
            updates.currentPage = hasApproved ? 'dashboard' : 'job_search';
        }

        setState(updates);
        setUI({ loading: false });
        
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
    return renderAuth();
};
