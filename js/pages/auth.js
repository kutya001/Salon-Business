// ============================================
// auth.js — Авторизация и первоначальная настройка
// ============================================

window.renderAuth = function () {
    const loading = state.ui.loading;
    const showSetupInline = state.ui.showSetupInline;
    const isConfigured = api.isConfigured();

    // Предупреждение если URL скрипта вообще не задан
    const warningBanner = !isConfigured ? `
        <div style="background:#fffbeb;border:1px solid #fef3c7;color:#d97706;padding:12px;border-radius:14px;font-size:12px;font-weight:600;margin-bottom:20px;text-align:left;line-height:1.4;">
            ⚠️ Бэкенд не настроен. Пожалуйста, укажите URL вашего Google Apps Script с помощью кнопки «Изменить» ниже.
        </div>
    ` : '';

    const logsCount = (state.apiLogs || []).length;

    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;box-sizing:border-box;">
        <div class="card animate-scale-in" style="width:100%;max-width:420px;padding:36px 28px;text-align:center;backdrop-filter:blur(20px);background:rgba(255,255,255,0.95);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;overflow:hidden;box-sizing:border-box;">
            
            <!-- Анимация ответа от сервера (Стеклянный спиннер) -->
            ${loading ? `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;animation:fadeIn 0.3s forwards;">
                <span class="spinner" style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#764ba2;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;"></span>
                <div style="font-weight:800;color:#1a1a2e;font-size:15px;letter-spacing:-0.01em;animation:pulse 1.5s infinite;display:inline-block;">Синхронизация с Google...</div>
            </div>
            ` : ''}

            <div style="font-size:56px;margin-bottom:12px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.1));">💎</div>
            <h1 style="font-size:28px;font-weight:800;color:#1a1a2e;margin:0 0 4px;">Suluu Business</h1>
            <p style="color:#666;font-size:14px;margin:0 0 24px;">Вход в панель управления</p>

            ${warningBanner}

            <div id="auth-error" style="display:none;background:#fee2e2;color:#dc2626;padding:10px 16px;border-radius:12px;font-size:13px;margin-bottom:16px;font-weight:600;text-align:left;"></div>

            <!-- Поле ввода пароля -->
            <div class="form-group" style="margin-bottom:20px;position:relative;text-align:left;">
                <label class="form-label" style="font-size:12px;font-weight:700;margin-bottom:6px;display:block;color:#4a5568;">Пароль доступа</label>
                <div style="position:relative;">
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
            </div>

            <!-- Кнопка Войти -->
            <button onclick="handleLogin()" class="btn btn-primary" 
                style="width:100%;padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;margin-bottom:16px;"
                ${loading || !isConfigured ? 'disabled' : ''}>
                Войти
            </button>

            <!-- Красивая плашка с GAS URL и кнопкой Изменить -->
            <div style="margin: 16px 0; padding: 12px; border-radius: 14px; background: rgba(118, 75, 162, 0.05); border: 1px solid rgba(118, 75, 162, 0.1); font-size: 13px; text-align: left; box-sizing:border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="font-weight: 600; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; font-family: monospace; font-size: 11px;" title="${api.gasUrl || 'Не настроен'}">
                        🔗 ${api.gasUrl ? api.gasUrl.substring(0, 32) + '...' : 'URL бэкенда не задан'}
                    </span>
                    <button onclick="setUI({ showSetupInline: !state.ui.showSetupInline })" style="color: #764ba2; font-weight: 700; background: none; border: none; cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.background='rgba(118,75,162,0.1)'" onmouseout="this.style.background='none'">
                        ${showSetupInline ? 'Скрыть' : 'Изменить'}
                    </button>
                </div>
                
                <!-- Поле изменения URL (раскрывается inline) -->
                ${(showSetupInline || !isConfigured) ? `
                <div style="margin-top: 12px; border-top: 1px dashed rgba(118, 75, 162, 0.2); padding-top: 12px; animation: slideUp 0.25s forwards;">
                    <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:6px;display:block;color:#4a5568;">URL Google Apps Script</label>
                    <input type="url" id="inline-gas-url" class="form-input" 
                        style="width:100%; padding:10px 12px; font-size:12px; border-radius:10px; border:2px solid #e2e8f0; box-sizing:border-box; outline:none; font-family: monospace; margin-bottom: 8px;" 
                        value="${api.gasUrl || ''}" placeholder="https://script.google.com/macros/s/.../exec">
                    <div style="display:flex; gap:8px;">
                        <button onclick="handleSaveInlineSetup()" class="btn btn-primary" style="flex:2; padding:10px; font-size:12px; border-radius:10px; width:auto; font-weight: 700;">
                            Сохранить URL
                        </button>
                        ${isConfigured ? `
                        <button onclick="setUI({ showSetupInline: false })" class="btn btn-secondary" style="flex:1; padding:10px; font-size:12px; border-radius:10px; width:auto; font-weight: 700;">
                            Отмена
                        </button>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Встроенный монитор сетевого обмена с GAS -->
            <div style="margin-top: 24px; border-top: 1px dashed #e2e8f0; padding-top: 16px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 800; color: #1a1a2e; display: flex; align-items: center; gap: 4px;">
                        📡 Монитор запросов (GAS API)
                    </span>
                    ${logsCount > 0 ? `
                    <button onclick="setState({ apiLogs: [] })" style="background: none; border: none; color: #ef4444; font-size: 11px; font-weight: 700; cursor: pointer; padding: 0;">Очистить</button>
                    ` : ''}
                </div>
                <div style="max-height: 120px; overflow-y: auto; background: #0f172a; border-radius: 12px; padding: 10px; font-family: monospace; font-size: 10px; color: #38bdf8; border: 1px solid #1e293b; box-sizing:border-box;">
                    ${logsCount === 0 ? `
                    <div style="color: #64748b; text-align: center; padding: 24px 0; line-height: 1.4;">Нет сетевой активности.<br/>Введите пароль и нажмите «Войти».</div>
                    ` : state.apiLogs.map(log => {
                        let color = '#a78bfa'; // фиолетовый для отправки
                        let prefix = '📤';
                        if (log.type === 'recv') {
                            color = '#34d399'; // зеленый для приема
                            prefix = '📥';
                        } else if (log.type === 'error') {
                            color = '#f87171'; // красный для ошибки
                            prefix = '❌';
                        }
                        return `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; margin-bottom: 4px;">
                            <div style="display: flex; justify-content: space-between; color: ${color}; font-weight: 700;">
                                <span>${prefix} ${log.action}</span>
                                <span style="color: #64748b; font-size: 9px;">${log.time}</span>
                            </div>
                            <div style="color: #e2e8f0; overflow-x: auto; white-space: pre-wrap; margin-top: 2px; font-size: 9px; line-height: 1.2; word-break: break-all; max-height: 60px;">${log.details}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Кнопки жесткого сброса кэша и PWA -->
            <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #edf2f7; padding-top: 16px;">
                <button onclick="handleHardReset()" style="background:none; border:none; color:#ef4444; font-size:11px; font-weight:700; cursor:pointer; padding:4px;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                    🧹 Очистить жестко кэш и настройки
                </button>
                <p style="font-size: 11px; color: #aaa; margin: 0;">v1.2 (Network-First)</p>
            </div>
        </div>
    </div>
    <style>
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    </style>`;
};

// Функция быстрого сохранения URL-скрипта
window.handleSaveInlineSetup = function () {
    const url = document.getElementById('inline-gas-url')?.value.trim();
    if (!url) {
        showToast('Пожалуйста, укажите URL скрипта', 'error');
        return;
    }
    
    // Сохраняем URL в памяти и localStorage
    api.setGasUrl(url);
    setUI({ showSetupInline: false });
    showToast('Связь настроена!', 'success');
    
    // Пингуем GAS-веб приложение в фоне для тестов связи
    checkGasConnection(url);
};

// Фоновый пинг
async function checkGasConnection(url) {
    if (window.logApiCall) window.logApiCall('send', 'ping_check', { url });
    try {
        const res = await fetch(url, { method: 'GET', mode: 'cors' });
        if (res.ok) {
            const data = await res.json();
            if (window.logApiCall) window.logApiCall('recv', 'ping_check', data);
            showToast('Соединение с Google Apps Script успешно установлено!', 'success');
        } else {
            throw new Error(`Ошибка сети: ${res.status}`);
        }
    } catch(e) {
        if (window.logApiCall) window.logApiCall('error', 'ping_check', e.message);
        showToast('Не удалось установить соединение. Проверьте правильность URL.', 'warning');
    }
}

// Функция входа
window.handleLogin = async function () {
    const input = document.getElementById('auth-password');
    const errEl = document.getElementById('auth-error');
    const password = input ? input.value.trim() : '';

    if (!password) {
        if (errEl) { errEl.textContent = 'Введите пароль'; errEl.style.display = 'block'; }
        return;
    }

    if (errEl) errEl.style.display = 'none';
    setUI({ loading: true });

    try {
        const { token } = await api.authenticate(password);
        if (token) localStorage.setItem('auth_token', token);

        // Подгружаем все данные с бэкенда
        const [masters, clients, services, bookings, transactions, shifts, business] = await Promise.all([
            api.getMasters(), api.getClients(), api.getServices(),
            api.getBookings(), api.getTransactions(), api.getShifts(), api.getSettings()
        ]);

        setState({ 
            isAuthenticated: true, 
            masters: masters || [], 
            clients: clients || [], 
            services: services || [], 
            bookings: bookings || [], 
            transactions: transactions || [], 
            shifts: shifts || [], 
            business: business || state.business 
        });
        
        navigate('dashboard');
        showToast('Добро пожаловать!', 'success');
    } catch (e) {
        setUI({ loading: false });
        if (errEl) { 
            errEl.textContent = e.message || 'Ошибка авторизации. Проверьте правильность пароля.'; 
            errEl.style.display = 'block'; 
        }
        showToast(e.message || 'Ошибка авторизации', 'error');
    }
};

// Функция жесткого сброса кэша PWA и настроек
window.handleHardReset = function () {
    if (confirm('Вы уверены, что хотите сбросить все локальные настройки приложения (URL, сохраненные сессии и кэш)?')) {
        // Очищаем localStorage и sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Очищаем кэш Service Worker
        if ('caches' in window) {
            caches.keys().then(function (names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        // Отменяем регистрацию Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        alert('Локальные данные очищены. Приложение перезапустится.');
        location.reload(true);
    }
};

window.renderSetup = function () {
    const currentUrl = api.gasUrl || '';
    const currentName = state.business?.name || 'Мой салон красоты';
    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;box-sizing:border-box;">
        <div class="card animate-scale-in" style="width:100%;max-width:440px;padding:36px 32px;backdrop-filter:blur(20px);background:rgba(255,255,255,0.95);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;overflow:hidden;box-sizing:border-box;">
            
            <!-- Анимация загрузки подключения -->
            ${state.ui.loading ? `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;animation:fadeIn 0.3s forwards;">
                <span class="spinner" style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#764ba2;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;"></span>
                <div style="font-weight:800;color:#1a1a2e;font-size:15px;animation:pulse 1.5s infinite;display:inline-block;">Проверка соединения...</div>
            </div>
            ` : ''}

            <div style="text-align:center;margin-bottom:28px;">
                <div style="font-size:48px;margin-bottom:8px;">⚙️</div>
                <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0 0 4px;">Настройка подключения</h1>
                <p style="color:#666;font-size:13px;margin:0;">Подключите ваш бизнес к бэкенду Google</p>
            </div>

            <div class="form-group" style="margin-bottom:16px;text-align:left;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">URL Google Apps Script</label>
                <input type="url" id="setup-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/..." 
                    value="${currentUrl}" style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>
            <div class="form-group" style="margin-bottom:16px;text-align:left;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">Название бизнеса</label>
                <input type="text" id="setup-business-name" class="form-input" placeholder="Мой салон красоты"
                    value="${currentName}" style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>
            <div class="form-group" style="margin-bottom:24px;text-align:left;">
                <label class="form-label" style="font-weight:600;font-size:13px;margin-bottom:6px;display:block;color:#374151;">Пароль доступа администратора</label>
                <input type="password" id="setup-password" class="form-input" placeholder="Введите или придумайте пароль"
                    style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;">
            </div>

            <div style="display:flex;gap:10px;">
                <button onclick="navigate('auth')" class="btn btn-secondary" style="flex:1;padding:14px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;">
                    Отмена
                </button>
                <button onclick="handleSetupSave()" class="btn btn-primary" style="flex:2;padding:14px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;">
                    Сохранить и войти
                </button>
            </div>
        </div>
    </div>`;
};

window.handleSetupSave = async function () {
    const gasUrl = document.getElementById('setup-gas-url')?.value.trim();
    const name = document.getElementById('setup-business-name')?.value.trim();
    const password = document.getElementById('setup-password')?.value.trim();

    if (!gasUrl) { showToast('Укажите URL скрипта', 'error'); return; }
    if (!name) { showToast('Укажите название бизнеса', 'error'); return; }
    if (!password) { showToast('Введите пароль', 'error'); return; }

    api.setGasUrl(gasUrl);
    setUI({ loading: true });

    try {
        const { token } = await api.authenticate(password);
        if (token) {
            api.setToken(token);
            const business = await api.updateSettings({ name });
            const [masters, clients, services, bookings, transactions, shifts] = await Promise.all([
                api.getMasters(), api.getClients(), api.getServices(),
                api.getBookings(), api.getTransactions(), api.getShifts()
            ]);

            setState({ 
                isAuthenticated: true, 
                masters: masters || [], 
                clients: clients || [], 
                services: services || [], 
                bookings: bookings || [], 
                transactions: transactions || [], 
                shifts: shifts || [], 
                business: business || state.business 
            });
            navigate('dashboard');
            showToast('Настройка и вход успешно завершены!', 'success');
        } else {
            throw new Error('Не удалось получить токен авторизации');
        }
    } catch (e) {
        console.error('Setup Error:', e);
        showToast('Не удалось подключиться к скрипту. Проверьте URL и пароль.', 'error');
    } finally {
        setUI({ loading: false });
    }
};
