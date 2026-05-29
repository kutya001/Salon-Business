// ============================================
// auth.js — Авторизация по пин-коду и настройка
// ============================================

// Инициализируем pinInput в состоянии UI, если он отсутствует
if (state.ui.pinInput === undefined) state.ui.pinInput = '';
if (state.ui.pinError === undefined) state.ui.pinError = false;

window.renderAuth = function () {
    const loading = state.ui.loading;
    const isConfigured = api.isConfigured();
    const pin = state.ui.pinInput || '';
    const hasError = state.ui.pinError;
    const logsCount = (state.apiLogs || []).length;

    // Стеклянный спиннер загрузки
    const spinnerHtml = loading ? `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;animation:fadeIn 0.3s forwards;">
        <span class="spinner" style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#764ba2;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;"></span>
        <div style="font-weight:800;color:#1a1a2e;font-size:15px;animation:pulse 1.5s infinite;">Авторизация...</div>
    </div>
    ` : '';

    // Генерируем 4 точки индикаторов ввода пин-кода
    let dotsHtml = '';
    for (let i = 0; i < 4; i++) {
        const active = i < pin.length;
        dotsHtml += `
        <div style="
            width: 16px; 
            height: 16px; 
            border-radius: 50%; 
            background: ${active ? '#764ba2' : '#e2e8f0'}; 
            border: 2px solid ${active ? '#764ba2' : '#cbd5e1'};
            transform: ${active ? 'scale(1.25)' : 'scale(1)'};
            transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: ${active ? '0 0 8px rgba(118,75,162,0.4)' : 'none'};
        "></div>`;
    }

    // Клавиатура
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let keyboardHtml = digits.map(d => `
        <button onclick="handlePinDigit('${d}')" class="pin-btn" ${loading ? 'disabled' : ''}>${d}</button>
    `).join('');
    
    // Добавляем нижний ряд: Очистка, 0, Назад
    keyboardHtml += `
        <button onclick="handlePinClear()" class="pin-btn pin-btn-special" ${loading ? 'disabled' : ''} style="font-size: 14px; font-weight: 700;">C</button>
        <button onclick="handlePinDigit('0')" class="pin-btn" ${loading ? 'disabled' : ''}>0</button>
        <button onclick="handlePinDelete()" class="pin-btn pin-btn-special" ${loading ? 'disabled' : ''}>⌫</button>
    `;

    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;box-sizing:border-box;">
        <div class="card animate-scale-in" style="width:100%;max-width:380px;padding:32px 24px;text-align:center;backdrop-filter:blur(20px);background:rgba(255,255,255,0.96);border-radius:28px;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;overflow:hidden;box-sizing:border-box;">
            
            ${spinnerHtml}

            <div style="font-size:44px;margin-bottom:8px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">💎</div>
            <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0 0 4px;letter-spacing:-0.02em;">Suluu Business</h1>
            <p style="color:#666;font-size:13px;margin:0 0 24px;">Введите PIN-код для входа</p>

            <div id="auth-error" style="display:${hasError ? 'block' : 'none'};background:#fee2e2;color:#dc2626;padding:10px 14px;border-radius:12px;font-size:13px;margin-bottom:20px;font-weight:700;animation:fadeIn 0.2s;">
                Неверный пин-код доступа
            </div>

            <!-- Индикаторы PIN -->
            <div class="${hasError ? 'shake' : ''}" style="display:flex;justify-content:center;gap:20px;margin-bottom:32px;height:24px;align-items:center;">
                ${dotsHtml}
            </div>

            <!-- Цифровая клавиатура -->
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:14px;max-width:280px;margin:0 auto 24px;justify-items:center;">
                ${keyboardHtml}
            </div>

            <!-- Плашка GAS URL -->
            <div style="margin: 16px 0; padding: 10px 12px; border-radius: 12px; background: rgba(118, 75, 162, 0.05); border: 1px solid rgba(118, 75, 162, 0.1); font-size: 11px; text-align: left; box-sizing:border-box; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight: 600; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; font-family: monospace;" title="${api.gasUrl || ''}">
                        🔗 ${api.gasUrl ? api.gasUrl.substring(0, 32) + '...' : 'URL бэкенда не задан'}
                    </span>
                    <button onclick="setUI({showSetupInline: !state.ui.showSetupInline})" style="color: #764ba2; font-weight: 700; background: none; border: none; cursor: pointer; font-size: 10px; padding: 4px 6px; border-radius: 6px;">
                        Изменить
                    </button>
                </div>
                ${state.ui.showSetupInline ? `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px; border-top: 1px dashed rgba(118, 75, 162, 0.2); padding-top: 8px;">
                    <input type="url" id="inline-gas-url" value="${api.gasUrl || ''}" placeholder="https://script.google.com/macros/s/.../exec" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid #cbd5e1; font-size:10px; font-family:monospace; outline:none;" onfocus="this.style.borderColor='#764ba2'" onblur="this.style.borderColor='#cbd5e1'">
                    <div style="display:flex; gap:8px;">
                        <button onclick="handleInlineUrlSave()" style="flex:1; background:#764ba2; color:white; border:none; border-radius:8px; padding:8px; font-weight:700; cursor:pointer;">Сохранить</button>
                        <button onclick="handleHardReset()" style="flex:1; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; padding:8px; font-weight:700; cursor:pointer;">Сброс PWA</button>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Монитор запросов -->
            <div style="text-align: left; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
                <span style="font-size: 11px; font-weight: 800; color: #1a1a2e; display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                    📡 Сетевая интеграция (GAS API)
                </span>
                <div style="max-height: 80px; overflow-y: auto; background: #0f172a; border-radius: 10px; padding: 8px; font-family: monospace; font-size: 9px; color: #38bdf8; border: 1px solid #1e293b; box-sizing:border-box;">
                    ${logsCount === 0 ? `
                    <div style="color: #64748b; text-align: center; padding: 10px 0;">Ожидание ввода PIN...</div>
                    ` : state.apiLogs.map(log => {
                        let color = '#a78bfa';
                        let prefix = '📤';
                        if (log.type === 'recv') {
                            color = '#34d399';
                            prefix = '📥';
                        } else if (log.type === 'error') {
                            color = '#f87171';
                            prefix = '❌';
                        }
                        return `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px; margin-bottom: 2px;">
                            <span style="color: ${color}; font-weight: 700;">${prefix} ${log.action}</span>
                            <span style="color: #e2e8f0; font-size: 8px; word-break: break-all;"> — ${log.details.substring(0, 100)}</span>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <p style="margin-top: 20px; font-size: 10px; color: #aaa;">Suluu Business v2.0 (PIN-code)</p>
        </div>
    </div>
    <style>
        .pin-btn {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #f1f5f9;
            border: 2px solid transparent;
            font-size: 24px;
            font-weight: 700;
            color: #1a1a2e;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            outline: none;
            transition: all 0.1s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
        }
        .pin-btn:active {
            transform: scale(0.9);
            background: #e2e8f0;
            border-color: #cbd5e1;
        }
        .pin-btn-special {
            background: rgba(118, 75, 162, 0.05);
            color: #764ba2;
            font-size: 18px;
        }
        .pin-btn-special:active {
            background: rgba(118, 75, 162, 0.15);
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }
        .shake {
            animation: shake 0.25s ease-in-out;
        }
    </style>`;
};

// Обработка ввода цифры
window.handlePinDigit = function (digit) {
    if (state.ui.loading) return;
    
    // Сбрасываем ошибку при новом вводе
    if (state.ui.pinError) {
        setUI({ pinError: false });
    }

    let pin = state.ui.pinInput || '';
    if (pin.length >= 4) return;

    pin += digit;
    setUI({ pinInput: pin });

    // При вводе 4 цифры запускаем авторизацию автоматически
    if (pin.length === 4) {
        handleLogin(pin);
    }
};

// Удаление одной цифры
window.handlePinDelete = function () {
    if (state.ui.loading) return;
    let pin = state.ui.pinInput || '';
    if (pin.length === 0) return;
    
    pin = pin.substring(0, pin.length - 1);
    setUI({ pinInput: pin, pinError: false });
};

// Полная очистка
window.handlePinClear = function () {
    if (state.ui.loading) return;
    setUI({ pinInput: '', pinError: false });
};

// Функция входа по пин-коду
async function handleLogin(pin) {
    setUI({ loading: true, pinError: false });

    try {
        const { token } = await api.authenticate(pin);
        if (token) localStorage.setItem('auth_token', token);

        // Подгружаем ВСЕ данные с бэкенда за ОДИН запрос
        const allData = await api.getAll();

        setState({ 
            isAuthenticated: true, 
            masters: allData.masters || [], 
            clients: allData.clients || [], 
            services: allData.services || [], 
            bookings: allData.bookings || [], 
            transactions: allData.transactions || [], 
            shifts: allData.shifts || [], 
            business: allData.business || state.business,
            currentPage: 'dashboard'
        });
        
        setUI({ pinInput: '', loading: false });
        showToast('Добро пожаловать!', 'success');
    } catch (e) {
        console.error('Login Error:', e);
        // Очищаем ввод, включаем тряску точек и показываем тост/ошибку
        setUI({ pinInput: '', loading: false, pinError: true });
        showToast('Неверный пин-код доступа', 'error');
    }
}

// ============================================
// setup.js — Упрощенная форма первой настройки
// ============================================

window.renderSetup = function () {
    const currentUrl = api.gasUrl || '';
    const loading = state.ui.loading;

    return `
    <div class="auth-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;box-sizing:border-box;">
        <div class="card animate-scale-in" style="width:100%;max-width:420px;padding:40px 32px;backdrop-filter:blur(20px);background:rgba(255,255,255,0.96);border-radius:28px;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;overflow:hidden;box-sizing:border-box;text-align:center;">
            
            <!-- Спиннер загрузки -->
            ${loading ? `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;animation:fadeIn 0.3s forwards;">
                <span class="spinner" style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#764ba2;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;"></span>
                <div style="font-weight:800;color:#1a1a2e;font-size:15px;animation:pulse 1.5s infinite;">Подключение к Google...</div>
            </div>
            ` : ''}

            <div style="text-align:center;margin-bottom:28px;">
                <div style="font-size:52px;margin-bottom:12px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1));">⚙️</div>
                <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0 0 6px;">Подключение</h1>
                <p style="color:#666;font-size:13px;margin:0;">Введите URL вашего скрипта Google Apps Script</p>
            </div>

            <div id="setup-error" style="display:none;background:#fee2e2;color:#dc2626;padding:10px 14px;border-radius:12px;font-size:12px;margin-bottom:16px;font-weight:700;text-align:left;"></div>

            <div class="form-group" style="margin-bottom:24px;text-align:left;">
                <label class="form-label" style="font-weight:700;font-size:12px;margin-bottom:6px;display:block;color:#4a5568;">URL Google Apps Script</label>
                <input type="url" id="setup-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/.../exec" 
                    value="${currentUrl}" style="width:100%;padding:14px 16px;border-radius:14px;border:2px solid #e2e8f0;font-size:13px;box-sizing:border-box;outline:none;font-family:monospace;transition:all 0.3s;"
                    onfocus="this.style.borderColor='#764ba2';this.style.boxShadow='0 0 0 3px rgba(118,75,162,0.1)'"
                    onblur="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
            </div>

            <button onclick="handleSetupSave()" class="btn btn-primary" style="width:100%;padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;">
                Подключить и войти
            </button>

            <p style="margin-top: 24px; font-size: 10px; color: #aaa;">Suluu Business v2.0</p>
        </div>
    </div>`;
};

// Функция сохранения URL первой настройки
window.handleSetupSave = async function () {
    const gasUrl = document.getElementById('setup-gas-url')?.value.trim();
    const errEl = document.getElementById('setup-error');

    if (!gasUrl) { 
        showToast('Пожалуйста, укажите URL скрипта', 'error'); 
        if (errEl) { errEl.textContent = 'Пожалуйста, укажите URL скрипта'; errEl.style.display = 'block'; }
        return; 
    }

    if (errEl) errEl.style.display = 'none';
    setUI({ loading: true });

    try {
        // Сохраняем URL в памяти и localStorage
        api.setGasUrl(gasUrl);
        
        // 1. Проверяем, настроен ли пин-код на бэкенде
        const { configured } = await api.isPinConfigured();

        if (!configured) {
            // Если пин-код не настроен, то бэкенд разрешает любые операции
            // Получаем токен без пин-кода (бэкенд создаст его автоматически)
            const { token } = await api.authenticate("");
            if (token) api.setToken(token);

            // Сразу загружаем все данные и входим на дашборд!
            const allData = await api.getAll();

            setState({ 
                isAuthenticated: true, 
                masters: allData.masters || [], 
                clients: allData.clients || [], 
                services: allData.services || [], 
                bookings: allData.bookings || [], 
                transactions: allData.transactions || [], 
                shifts: allData.shifts || [], 
                business: allData.business || state.business,
                currentPage: 'dashboard'
            });
            
            showToast('Успешно подключено! Установите пин-код безопасности в настройках.', 'info');
        } else {
            // Если пин-код уже настроен в таблице, перенаправляем на экран ввода пин-кода
            setState({ currentPage: 'auth' });
            showToast('Успешно подключено. Пожалуйста, введите ваш пин-код.', 'success');
        }
    } catch (e) {
        console.error('Setup Error:', e);
        if (errEl) { 
            errEl.textContent = 'Не удалось подключиться к бэкенду. Проверьте правильность URL скрипта и доступ к таблице.'; 
            errEl.style.display = 'block'; 
        }
        showToast('Ошибка подключения к бэкенду', 'error');
    } finally {
        setUI({ loading: false });
    }
};

// Функция сохранения URL из inline-редактора
window.handleInlineUrlSave = function () {
    const newUrl = document.getElementById('inline-gas-url')?.value.trim();
    if (!newUrl) {
        showToast('Пожалуйста, укажите URL', 'error');
        return;
    }
    
    api.setGasUrl(newUrl);
    setUI({ showSetupInline: false });
    showToast('URL бэкенда обновлен!', 'success');
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
