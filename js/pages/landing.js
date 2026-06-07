// ============================================
// landing.js — Интерактивный премиум-лендинг Suluu Business
// ============================================

// Инициализация состояний для интерактива лендинга
if (state.ui.landingActiveRole === undefined) state.ui.landingActiveRole = 'owner';
if (state.ui.simRole === undefined) state.ui.simRole = 'owner';
if (state.ui.simUseFinance === undefined) state.ui.simUseFinance = true;
if (state.ui.simBookings === undefined) {
    state.ui.simBookings = [
        { id: 1, client: 'Анна К.', service: 'Маникюр + Покрытие', master: 'Екатерина', time: '10:00', price: 1200 },
        { id: 2, client: 'Мария С.', service: 'Стрижка женская', master: 'Александр', time: '12:30', price: 1800 },
        { id: 3, client: 'Дмитрий В.', service: 'Стрижка мужская', master: 'Александр', time: '14:00', price: 1000 }
    ];
}
if (state.ui.simClient === undefined) state.ui.simClient = '';
if (state.ui.simService === undefined) state.ui.simService = 'Окрашивание волос';
if (state.ui.simMaster === undefined) state.ui.simMaster = 'Екатерина';
if (state.ui.simTime === undefined) state.ui.simTime = '16:00';
if (state.ui.openInstructions === undefined) {
    state.ui.openInstructions = {
        bookings: false,
        employees: false,
        clients: false,
        services: false,
        finance: false
    };
}

// Рендеринг всей страницы лендинга
window.renderLanding = function () {
    return `
    <div class="landing-page bg-[#0b0f1a] text-white min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white" style="font-family: 'Inter', sans-serif;">
        <!-- Фоновые радиальные градиенты для эффекта глубины (Mesh bg) -->
        <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-[800px] right-10 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div class="absolute bottom-[400px] left-10 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <!-- Sticky Header -->
        <header class="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f1a]/80 border-b border-white/5 transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <!-- Logo -->
                <div class="flex items-center gap-3 cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                            <path d="M6 3h12l4 6-10 12L2 9z"></path>
                            <path d="M11 3 8 9l4 12 4-12-3-6"></path>
                            <path d="M2 9h20"></path>
                        </svg>
                    </div>
                    <div>
                        <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">Suluu Business</span>
                        <div class="text-[10px] text-indigo-400/80 font-semibold tracking-wider uppercase">Beauty Ecosystem</div>
                    </div>
                </div>

                <!-- Nav links (Desktop) -->
                <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#features" class="hover:text-indigo-400 transition-colors duration-200">Особенности</a>
                    <a href="#roles" class="hover:text-indigo-400 transition-colors duration-200">Роли</a>
                    <a href="#simulator" class="hover:text-indigo-400 transition-colors duration-200">Интерактив</a>
                    <a href="#instructions" class="hover:text-indigo-400 transition-colors duration-200">Инструкции</a>
                    <a href="#contact" class="hover:text-indigo-400 transition-colors duration-200">Контакты</a>
                </nav>

                <!-- Auth Buttons -->
                <div class="flex items-center gap-4">
                    <button onclick="goToAuth(false)" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-200">
                        Войти
                    </button>
                    <button onclick="goToAuth(true)" class="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all duration-200 shadow-md shadow-indigo-600/20">
                        Регистрация
                    </button>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center relative">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
                <span class="flex h-2 w-2 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Экосистема Suluu v2.3.0-PRO
            </div>
            
            <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
                Автономное управление вашим <br class="hidden sm:inline">
                <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">бьюти-бизнесом</span>
            </h1>

            <p class="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Интуитивная CRM-платформа для салонов красоты и мастеров. Календарь записей, смены сотрудников, база клиентов и финансовый аудит — всё в одном гибком PWA-приложении.
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onclick="goToAuth(true)" class="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-xl shadow-indigo-500/20 active:scale-98 transition-all duration-200">
                    Попробовать бесплатно
                </button>
                <a href="#simulator" class="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 block">
                    Попробовать демо-симулятор
                </a>
            </div>

            <!-- Mini stats ribbon -->
            <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-b border-white/5 py-8">
                <div>
                    <div class="text-3xl font-extrabold text-white">50+</div>
                    <div class="text-xs text-slate-400 mt-1">Шаблонов услуг</div>
                </div>
                <div>
                    <div class="text-3xl font-extrabold text-white">100%</div>
                    <div class="text-xs text-slate-400 mt-1">PWA автономность</div>
                </div>
                <div>
                    <div class="text-3xl font-extrabold text-white">2 мин</div>
                    <div class="text-xs text-slate-400 mt-1">Регистрация и старт</div>
                </div>
                <div>
                    <div class="text-3xl font-extrabold text-white">3 роли</div>
                    <div class="text-xs text-slate-400 mt-1">Разграничения доступа</div>
                </div>
            </div>
        </section>

        <!-- Features Grid Section -->
        <section id="features" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
            <div class="text-center mb-16">
                <h2 class="text-3xl font-bold tracking-tight text-white mb-4">
                    Всё, что нужно для роста вашего салона
                </h2>
                <p class="text-slate-400 max-w-2xl mx-auto">
                    Каждый инструмент спроектирован с заботой о скорости работы и удобстве интерфейса.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="calendar" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Онлайн-записи и Календарь</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Интуитивно понятный таймлайн. Запись клиента в пару кликов, управление статусами визита, фильтрация по мастерам и услугам.
                    </p>
                </div>

                <!-- Card 2 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="users" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Управление мастерами</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Контроль рабочих смен, привязка предоставляемых услуг, расчет начисленной заработной платы на основе процента от выполненной работы.
                    </p>
                </div>

                <!-- Card 3 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="smile" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">База клиентов</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Детальная история посещений, контакты, подсчет количества визитов и суммарной выручки по каждому клиенту автоматически.
                    </p>
                </div>

                <!-- Card 4 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="grid" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Шаблоны услуг</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Быстрый выбор из 50+ готовых шаблонов услуг популярных категорий. Массовое сохранение и настройка длительности и цен.
                    </p>
                </div>

                <!-- Card 5 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="dollar-sign" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Опциональный учет финансов</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Транзакции, кассы и кошельки. Включайте финансовый модуль, если хотите видеть полную аналитику, или отключайте для упрощения работы сотрудников.
                    </p>
                </div>

                <!-- Card 6 -->
                <div class="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        <i data-feather="smartphone" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Полноценное PWA-приложение</h3>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        Установите приложение на телефон или планшет прямо из браузера. Быстрый отклик, работа на мобильных устройствах и стабильное соединение.
                    </p>
                </div>
            </div>
        </section>

        <!-- Interactive Simulator Section -->
        <section id="simulator" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
            <div class="text-center mb-12">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Интерактивный симулятор</div>
                <h2 class="text-3xl font-bold text-white mb-4">Попробуйте Suluu Business прямо сейчас</h2>
                <p class="text-slate-400 max-w-2xl mx-auto">
                    Переключайте параметры слева и мгновенно смотрите, как реагирует интерфейс демонстрационного приложения справа!
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <!-- Simulator Admin Controls (Left Panel) -->
                <div class="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <i data-feather="sliders" class="w-5 h-5 text-indigo-400"></i>
                        Панель управления
                    </h3>

                    <!-- 1. Role Selection -->
                    <div class="mb-8">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Выберите роль</label>
                        <div class="flex flex-col gap-2">
                            <button onclick="setSimRole('owner')" class="flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${state.ui.simRole === 'owner' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'border-white/10 bg-transparent text-slate-400 hover:bg-white/5'}">
                                <span class="flex items-center gap-2">
                                    <i data-feather="key" class="w-4 h-4"></i> Владелец салона
                                </span>
                                ${state.ui.simRole === 'owner' ? '<span class="w-2 h-2 rounded-full bg-indigo-400"></span>' : ''}
                            </button>
                            <button onclick="setSimRole('manager')" class="flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${state.ui.simRole === 'manager' ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'border-white/10 bg-transparent text-slate-400 hover:bg-white/5'}">
                                <span class="flex items-center gap-2">
                                    <i data-feather="user-check" class="w-4 h-4"></i> Менеджер салона
                                </span>
                                ${state.ui.simRole === 'manager' ? '<span class="w-2 h-2 rounded-full bg-purple-400"></span>' : ''}
                            </button>
                            <button onclick="setSimRole('master')" class="flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${state.ui.simRole === 'master' ? 'bg-pink-600/20 border-pink-500 text-pink-200' : 'border-white/10 bg-transparent text-slate-400 hover:bg-white/5'}">
                                <span class="flex items-center gap-2">
                                    <i data-feather="scissors" class="w-4 h-4"></i> Мастер (Сотрудник)
                                </span>
                                ${state.ui.simRole === 'master' ? '<span class="w-2 h-2 rounded-full bg-pink-400"></span>' : ''}
                            </button>
                        </div>
                    </div>

                    <!-- 2. Finance Toggle -->
                    <div class="mb-8 border-t border-white/5 pt-6">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Настройка салона</label>
                        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span class="text-sm font-medium text-slate-300">Учитывать финансы</span>
                            <button onclick="toggleSimFinance()" class="w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${state.ui.simUseFinance ? 'bg-indigo-600' : 'bg-slate-700'}" style="position: relative;">
                                <div class="w-5 h-5 rounded-full bg-white shadow-md transform duration-200 ${state.ui.simUseFinance ? 'translate-x-6' : 'translate-x-0'}"></div>
                            </button>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">
                            При выключении этого тумблера весь функционал транзакций и финансового учета скрывается из меню и дашборда.
                        </p>
                    </div>

                    <!-- 3. Add Test Appointment -->
                    <div class="border-t border-white/5 pt-6">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Создать запись</label>
                        <form onsubmit="handleSimBookingSubmit(event)" class="flex flex-col gap-3">
                            <input type="text" placeholder="Имя клиента (например, Ольга)" required value="${state.ui.simClient}" onchange="setUI({simClient: this.value})"
                                class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                            
                            <select onchange="setUI({simService: this.value})" class="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2e] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <option value="Окрашивание волос" ${state.ui.simService === 'Окрашивание волос' ? 'selected' : ''}>Окрашивание волос — 4500 сом</option>
                                <option value="Стрижка + Укладка" ${state.ui.simService === 'Стрижка + Укладка' ? 'selected' : ''}>Стрижка + Укладка — 2000 сом</option>
                                <option value="Маникюр с гелем" ${state.ui.simService === 'Маникюр с гелем' ? 'selected' : ''}>Маникюр с гелем — 1500 сом</option>
                            </select>

                            <select onchange="setUI({simMaster: this.value})" class="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2e] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500">
                                <option value="Екатерина" ${state.ui.simMaster === 'Екатерина' ? 'selected' : ''}>Мастер Екатерина</option>
                                <option value="Александр" ${state.ui.simMaster === 'Александр' ? 'selected' : ''}>Мастер Александр</option>
                            </select>

                            <div class="flex gap-2">
                                <input type="text" placeholder="Время (16:00)" required value="${state.ui.simTime}" onchange="setUI({simTime: this.value})"
                                    class="w-1/2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white text-center focus:outline-none focus:border-indigo-500">
                                <button type="submit" class="w-1/2 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/15">
                                    Записать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Mock App Visualisation (Right Panel) -->
                <div class="lg:col-span-8 bg-[#0b0f1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                    <!-- Browser-like topbar -->
                    <div class="bg-[#121829] border-b border-white/5 px-4 py-3 flex items-center gap-2">
                        <div class="flex gap-1.5">
                            <span class="w-3 h-3 rounded-full bg-red-500/70 inline-block"></span>
                            <span class="w-3 h-3 rounded-full bg-yellow-500/70 inline-block"></span>
                            <span class="w-3 h-3 rounded-full bg-green-500/70 inline-block"></span>
                        </div>
                        <div class="bg-[#0b0f1a] text-slate-400 text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 mx-auto w-2/3 max-w-md justify-center border border-white/5">
                            <i data-feather="lock" class="w-3 h-3 text-indigo-400"></i>
                            <span>suluu.business/salon/demo</span>
                        </div>
                    </div>

                    <!-- Mini App Interface Layout -->
                    <div class="grid grid-cols-12 min-h-[480px] relative">
                        <!-- Sidebar inside mock -->
                        <div class="hidden md:flex md:col-span-3 bg-[#121829] border-r border-white/5 p-4 flex-col justify-between">
                            <div class="flex flex-col gap-6">
                                <!-- Mock Logo -->
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px]">S</div>
                                    <span class="text-xs font-bold text-white tracking-wide">Suluu App</span>
                                </div>

                                <!-- Mock Nav Menu -->
                                <div class="flex flex-col gap-1">
                                    ${renderMockMenuItem('dashboard', 'layout', 'Дашборд')}
                                    ${renderMockMenuItem('bookings', 'calendar', 'Записи')}
                                    ${renderMockMenuItem('masters', 'users', 'Сотрудники')}
                                    ${renderMockMenuItem('clients', 'smile', 'Клиенты')}
                                    ${renderMockMenuItem('services', 'grid', 'Услуги')}
                                    ${state.ui.simUseFinance ? renderMockMenuItem('finance', 'dollar-sign', 'Финансы') : ''}
                                </div>
                            </div>

                            <!-- Footer inside mock -->
                            <div class="border-t border-white/5 pt-3 mt-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        ${state.ui.simRole === 'owner' ? 'О' : state.ui.simRole === 'manager' ? 'М' : 'МС'}
                                    </div>
                                    <div class="overflow-hidden">
                                        <div class="text-[10px] font-bold text-white leading-tight truncate">
                                            ${state.ui.simRole === 'owner' ? 'Владелец' : state.ui.simRole === 'manager' ? 'Менеджер' : 'Мастер'}
                                        </div>
                                        <div class="text-[8px] text-slate-400 truncate">demo_session</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Content Area inside mock -->
                        <div class="col-span-12 md:col-span-9 bg-[#0e1322] p-4 md:p-6 flex flex-col justify-between relative pb-16 md:pb-6">
                            <div>
                                <!-- Top Bar in App Content -->
                                <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                                    <div>
                                        <h4 class="text-sm font-bold text-white">Интерактивный Календарь</h4>
                                        <p class="text-[10px] text-slate-400">Демонстрация работы расписания в реальном времени</p>
                                    </div>
                                    <span class="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold">
                                        Сегодня
                                    </span>
                                </div>

                                <!-- Live Financial Indicator -->
                                ${state.ui.simUseFinance ? `
                                <div class="grid grid-cols-2 gap-4 mb-6">
                                    <div class="bg-white/5 border border-white/5 p-3 rounded-xl">
                                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Общая выручка</div>
                                        <div class="text-base font-extrabold text-indigo-300 mt-0.5">${calculateSimTotal()} сом</div>
                                    </div>
                                    <div class="bg-white/5 border border-white/5 p-3 rounded-xl">
                                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Всего визитов</div>
                                        <div class="text-base font-extrabold text-white mt-0.5">${state.ui.simBookings.length}</div>
                                    </div>
                                </div>
                                ` : `
                                <div class="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl mb-6 text-center text-[10px] text-amber-300/80">
                                    <i data-feather="info" class="w-3.5 h-3.5 inline mr-1 align-text-bottom"></i> Учет финансов отключен. Страница «Финансы» и финансовые графики скрыты.
                                </div>
                                `}

                                <!-- Mock Calendar List -->
                                <div class="flex flex-col gap-2.5 max-h-[200px] md:max-h-[220px] overflow-y-auto scrollbar-hide">
                                    ${state.ui.simBookings.map(b => `
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors animate-fade-in">
                                        <div class="flex items-center gap-3">
                                            <div class="text-xs font-bold text-indigo-400 bg-indigo-500/10 w-12 py-1.5 rounded-lg text-center">${b.time}</div>
                                            <div class="max-w-[120px] sm:max-w-none">
                                                <div class="text-xs font-bold text-white truncate">${b.client}</div>
                                                <div class="text-[10px] text-slate-400 truncate">${b.service} • Мастер: <span class="text-indigo-300">${b.master}</span></div>
                                            </div>
                                        </div>
                                        ${state.ui.simUseFinance ? `
                                        <div class="text-xs font-bold text-slate-200">${b.price} сом</div>
                                        ` : ''}
                                    </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Footer inside Mock Area -->
                            <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 mb-1 md:mb-0">
                                <span class="max-w-[70%] sm:max-w-none leading-relaxed">* Вы можете свободно тестировать любые параметры. Данные симулятора хранятся в сессии.</span>
                                <button onclick="resetSim()" class="text-indigo-400 hover:text-indigo-300 font-semibold">Сбросить</button>
                            </div>

                            <!-- Mobile Bottom Navigation Bar -->
                            <div class="flex md:hidden absolute bottom-0 left-0 right-0 bg-[#121829] border-t border-white/5 py-2 px-3 justify-around items-center z-10 rounded-b-3xl">
                                ${renderMockBottomNav()}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Role Explorer Section -->
        <section id="roles" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
            <div class="text-center mb-12">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Ролевая модель доступа</div>
                <h2 class="text-3xl font-bold text-white mb-4">Разграничение прав пользователей</h2>
                <p class="text-slate-400 max-w-2xl mx-auto">
                    Гибкая система прав обеспечивает безопасность ваших данных и комфорт для сотрудников.
                </p>
            </div>

            <!-- Role tabs buttons -->
            <div class="flex justify-center mb-8">
                <div class="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10">
                    <button onclick="setLandingRole('owner')" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${state.ui.landingActiveRole === 'owner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'text-slate-400 hover:text-white'}">
                        Владелец
                    </button>
                    <button onclick="setLandingRole('manager')" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${state.ui.landingActiveRole === 'manager' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'text-slate-400 hover:text-white'}">
                        Менеджер
                    </button>
                    <button onclick="setLandingRole('master')" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${state.ui.landingActiveRole === 'master' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'text-slate-400 hover:text-white'}">
                        Мастер
                    </button>
                </div>
            </div>

            <!-- Role details display -->
            <div class="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto backdrop-blur-md">
                ${renderLandingRoleDetails()}
            </div>
        </section>

        <!-- Documentation & Guide Section (Accordions) -->
        <section id="instructions" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
            <div class="text-center mb-16">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Инструкция по применению</div>
                <h2 class="text-3xl font-bold text-white mb-4">Руководство пользователя</h2>
                <p class="text-slate-400 max-w-2xl mx-auto">
                    Узнайте, как максимально эффективно использовать все разделы Suluu Business для вашего салона.
                </p>
            </div>

            <div class="max-w-4xl mx-auto flex flex-col gap-4">
                <!-- Accordion 1: Bookings -->
                ${renderAccordionItem('bookings', 'calendar', 'Раздел «Записи» (Календарь)', `
                    <div class="text-slate-300 text-sm space-y-4">
                        <p><strong class="text-white">Таймлайн и сетка часов:</strong> Основной экран приложения отображает расписание по часам. Записи распределены вертикально по времени, а горизонтально — по мастерам. Это позволяет видеть загрузку всего салона на одном экране.</p>
                        <p><strong class="text-white">Создание записи:</strong> Чтобы добавить новую запись, кликните на пустую ячейку расписания напротив нужного времени и мастера. Откроется диалоговое окно, где вы сможете выбрать клиента из базы (или создать нового), указать перечень услуг (стоимость и длительность рассчитаются автоматически), изменить дату и время.</p>
                        <p><strong class="text-white">Статусы визитов:</strong> Для удобного контроля каждый визит имеет статус:
                            <span class="block mt-2 pl-4 border-l-2 border-slate-500">
                                • <strong class="text-indigo-300">Ожидается (Запланировано):</strong> Клиент записан, визит подтвержден.<br>
                                • <strong class="text-amber-300">В процессе:</strong> Клиент пришел, мастер начал выполнение услуги.<br>
                                • <strong class="text-emerald-300">Выполнено:</strong> Услуга оказана, оплата принята.<br>
                                • <strong class="text-red-400">Отменено:</strong> Запись аннулирована по инициативе клиента или салона.
                            </span>
                        </p>
                        <p><strong class="text-white">Анализ записей:</strong> Вы можете фильтровать список записей по датам (сверху есть быстрый фильтр по периоду), конкретному мастеру или услуге.</p>
                    </div>
                `)}

                <!-- Accordion 2: Masters -->
                ${renderAccordionItem('employees', 'users', 'Раздел «Сотрудники» (Мастера)', `
                    <div class="text-slate-300 text-sm space-y-4">
                        <p><strong class="text-white">Список мастеров:</strong> В этом разделе отображаются карточки всех специалистов салона с указанием их специализации, процента заработной платы, телефона и закрепленных услуг.</p>
                        <p><strong class="text-white">Схемы выплат и процент:</strong> Каждому мастеру задается персональный процент от стоимости оказанных услуг (например, 40%). При переходе записи в статус «Выполнено» сумма дохода мастера автоматически фиксируется, а в конце смены или периода система покажет сумму к выплате.</p>
                        <p><strong class="text-white">Управление графиком работы:</strong> Установите для каждого мастера рабочее время по умолчанию (например, с 09:00 до 20:00). Это ограничит возможность создания записей в нерабочее время сотрудника.</p>
                        <p><strong class="text-white">Привязка услуг:</strong> Вы можете выбрать, какие именно услуги из каталога выполняет конкретный мастер. При добавлении записи клиенту будут предложены только подходящие специалисты.</p>
                    </div>
                `)}

                <!-- Accordion 3: Clients -->
                ${renderAccordionItem('clients', 'smile', 'Раздел «Клиенты» (Клиентская база)', `
                    <div class="text-slate-300 text-sm space-y-4">
                        <p><strong class="text-white">Картотека:</strong> Система хранит имена, номера телефонов и полную историю визитов каждого клиента салона.</p>
                        <p><strong class="text-white">Аналитика лояльности:</strong> По каждому клиенту в реальном времени собирается статистика:
                            <span class="block mt-2 pl-4 border-l-2 border-slate-500">
                                • Количество успешных визитов.<br>
                                • Суммарная выручка, которую клиент принес вашему бизнесу.<br>
                                • Дата последнего визита.
                            </span>
                        </p>
                        <p><strong class="text-white">Быстрый поиск:</strong> Начните вводить имя или номер телефона в строке поиска сверху, чтобы мгновенно отфильтровать базу клиентов.</p>
                    </div>
                `)}

                <!-- Accordion 4: Services -->
                ${renderAccordionItem('services', 'grid', 'Раздел «Услуги» (Каталог и Шаблоны)', `
                    <div class="text-slate-300 text-sm space-y-4">
                        <p><strong class="text-white">Категории услуг:</strong> Структурируйте каталог по категориям (например, «Парикмахерский зал», «Ногтевой сервис», «Косметология») для удобного поиска при оформлении записи.</p>
                        <p><strong class="text-white">Карточка услуги:</strong> Для каждой услуги задается название, длительность в минутах (влияет на сетку календаря) и стандартная цена.</p>
                        <p><strong class="text-white">Шаблоны глобального каталога:</strong> Если вы только открыли салон, воспользуйтесь встроенной библиотекой шаблонов (50+ самых популярных бьюти-услуг). Выберите нужные чекбоксами и нажмите в самом верху кнопку «Сохранить», чтобы мгновенно импортировать их в ваш каталог без ручного заполнения.</p>
                    </div>
                `)}

                <!-- Accordion 5: Finance -->
                ${renderAccordionItem('finance', 'dollar-sign', 'Раздел «Финансы» (Транзакции и Кошельки)', `
                    <div class="text-slate-300 text-sm space-y-4">
                        <p><strong class="text-white">Кошельки и кассы:</strong> Создавайте различные платежные счета (например, «Касса наличные», «Расчетный счет», «Электронный кошелек»). Это позволит четко контролировать, где находятся деньги салона.</p>
                        <p><strong class="text-white">Доходы и расходы:</strong> Доходы от записей зачисляются на выбранный кошелек автоматически при выполнении записи. Все прочие хозяйственные операции (аренда, закупка материалов, выплата зарплаты) регистрируются вручную через кнопку «Новая транзакция» с указанием категории расхода.</p>
                        <p><strong class="text-white">Гибкое отключение финансового модуля:</strong> В настройках салона (или при регистрации) владелец может снять галочку <strong class="text-indigo-300">«Учитывать финансы»</strong>. В этом случае разделы транзакций, кошельков и финансовой аналитики скрываются из всего приложения для всех сотрудников. Это удобно, если вы используете Suluu только для планирования записей.</p>
                    </div>
                `)}
            </div>
        </section>

        <!-- Contact Form Section -->
        <section id="contact" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
            <div class="bg-gradient-to-br from-indigo-950/40 to-purple-950/20 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-md">
                <div class="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div class="md:col-span-5">
                        <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-4">Свяжитесь со мной</h2>
                        <p class="text-slate-400 text-sm leading-relaxed mb-6">
                            Остались вопросы или есть предложения по сотрудничеству? Заполните форму, и я свяжусь с вами в ближайшее время.
                        </p>
                        <div class="flex flex-col gap-3 text-sm text-slate-300">
                            <div class="flex items-center gap-3">
                                <i data-feather="mail" class="w-4 h-4 text-indigo-400"></i>
                                <span>support@suluu.app</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <i data-feather="phone" class="w-4 h-4 text-indigo-400"></i>
                                <span>+996 (555) 012-345</span>
                            </div>
                        </div>
                    </div>

                    <div class="md:col-span-7">
                        <form onsubmit="handleLandingContactSubmit(event)" class="flex flex-col gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-2">Ваше имя</label>
                                <input type="text" id="contact-name" required placeholder="Иван"
                                    class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 mb-2">Номер телефона</label>
                                    <input type="tel" id="contact-phone" required placeholder="+996 (___) __-__-__"
                                        class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 mb-2">Тема</label>
                                    <select id="contact-subject" class="w-full px-4 py-3 rounded-xl bg-[#121829] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500">
                                        <option value="Подключение салона">Подключение салона</option>
                                        <option value="Техническая поддержка">Техническая поддержка</option>
                                        <option value="Партнерство / Предложение">Партнерство / Предложение</option>
                                        <option value="Другое">Другое</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-2">Сообщение</label>
                                <textarea id="contact-message" required rows="3" placeholder="Расскажите о вашем вопросе..."
                                    class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"></textarea>
                            </div>
                            <button type="submit" class="py-3 px-6 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/15 active:scale-98">
                                Отправить сообщение
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="border-t border-white/5 bg-[#080c16] py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">S</div>
                    <span class="text-sm font-bold text-slate-300">Suluu Business © 2026. Все права защищены.</span>
                </div>
                <div class="flex gap-6 text-sm text-slate-400">
                    <a href="#features" class="hover:text-white transition-colors">Особенности</a>
                    <a href="#roles" class="hover:text-white transition-colors">Роли</a>
                    <a href="#instructions" class="hover:text-white transition-colors font-semibold text-indigo-400">Инструкция</a>
                </div>
            </div>
        </footer>
    </div>
    `;
};

// Функция перехода на экран авторизации
window.goToAuth = function (isRegister) {
    setState({ currentPage: 'auth' });
    setUI({ isRegisterMode: isRegister, authError: '' });
};

// --- Вспомогательные функции для интерактива лендинга ---

// Рендеринг элемента меню в демо-окне
function renderMockMenuItem(menuKey, icon, label) {
    const isSelected = menuKey === 'bookings'; // Календарь всегда выделен для демонстрации
    const isRoleDenied = isMenuItemDeniedForRole(menuKey, state.ui.simRole);
    
    if (isRoleDenied) {
        return `
        <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-semibold text-slate-600 cursor-not-allowed select-none opacity-40">
            <i data-feather="${icon}" class="w-3.5 h-3.5"></i>
            <span>${label}</span>
            <i data-feather="lock" class="w-2.5 h-2.5 ml-auto"></i>
        </div>
        `;
    }
    
    return `
    <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200 cursor-pointer'}">
        <i data-feather="${icon}" class="w-3.5 h-3.5"></i>
        <span>${label}</span>
    </div>
    `;
}

// Рендеринг нижнего меню в мобильной версии демо-окна
function renderMockBottomNav() {
    const items = [
        { key: 'dashboard', icon: 'layout', label: 'Дашборд' },
        { key: 'bookings', icon: 'calendar', label: 'Записи' },
        { key: 'masters', icon: 'users', label: 'Мастера' },
        { key: 'clients', icon: 'smile', label: 'Клиенты' },
        { key: 'services', icon: 'grid', label: 'Услуги' },
        { key: 'finance', icon: 'dollar-sign', label: 'Финансы' }
    ];

    return items.map(item => {
        if (item.key === 'finance' && !state.ui.simUseFinance) return '';
        const isDenied = isMenuItemDeniedForRole(item.key, state.ui.simRole);
        if (isDenied) return '';

        const isSelected = item.key === 'bookings';
        return `
        <div class="flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}">
            <i data-feather="${item.icon}" class="w-4 h-4"></i>
            <span class="text-[8px] font-medium leading-none">${item.label}</span>
        </div>
        `;
    }).join('');
}

// Проверка прав для демо-меню в соответствии с ролью
function isMenuItemDeniedForRole(menuKey, role) {
    if (role === 'owner') return false; // владельцу видно все
    if (role === 'manager') {
        if (menuKey === 'super_admin_panel') return true;
        // в демо менеджер видит все кроме панели суперадмина
        return false;
    }
    if (role === 'master') {
        // мастеру доступны только Записи и Услуги
        return !['bookings', 'services'].includes(menuKey);
    }
    return false;
}

// Переключатель роли в симуляторе
window.setSimRole = function (role) {
    setUI({ simRole: role });
};

// Переключатель финансов в симуляторе
window.toggleSimFinance = function () {
    setUI({ simUseFinance: !state.ui.simUseFinance });
};

// Подсчет общей выручки в симуляторе
function calculateSimTotal() {
    return state.ui.simBookings.reduce((sum, b) => sum + b.price, 0);
}

// Сброс данных симулятора
window.resetSim = function () {
    setUI({
        simRole: 'owner',
        simUseFinance: true,
        simBookings: [
            { id: 1, client: 'Анна К.', service: 'Маникюр + Покрытие', master: 'Екатерина', time: '10:00', price: 1200 },
            { id: 2, client: 'Мария С.', service: 'Стрижка женская', master: 'Александр', time: '12:30', price: 1800 },
            { id: 3, client: 'Дмитрий В.', service: 'Стрижка мужская', master: 'Александр', time: '14:00', price: 1000 }
        ],
        simClient: '',
        simService: 'Окрашивание волос',
        simMaster: 'Екатерина',
        simTime: '16:00'
    });
    showToast('Симулятор сброшен до исходных настроек', 'success');
};

// Обработка отправки формы записи в симуляторе
window.handleSimBookingSubmit = function (e) {
    e.preventDefault();
    const client = state.ui.simClient.trim();
    if (!client) return;

    let price = 4500;
    if (state.ui.simService === 'Стрижка + Укладка') price = 2000;
    if (state.ui.simService === 'Маникюр с гелем') price = 1500;

    const newBooking = {
        id: Date.now(),
        client: client,
        service: state.ui.simService,
        master: state.ui.simMaster,
        time: state.ui.simTime.trim() || '16:00',
        price: price
    };

    const updatedBookings = [...state.ui.simBookings, newBooking];
    // Сортируем записи по времени
    updatedBookings.sort((a, b) => a.time.localeCompare(b.time));

    setUI({
        simBookings: updatedBookings,
        simClient: '' // сброс инпута
    });

    showToast(`Запись для ${client} успешно смоделирована!`, 'success');
};

// Переключатель роли во вкладке Описание Ролей
window.setLandingRole = function (role) {
    setUI({ landingActiveRole: role });
};

// Описание ролей
function renderLandingRoleDetails() {
    const role = state.ui.landingActiveRole;
    if (role === 'owner') {
        return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
            <div class="md:col-span-4 text-center md:text-left">
                <div class="w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto md:mx-0 mb-4">
                    <i data-feather="key" class="w-10 h-10"></i>
                </div>
                <h4 class="text-2xl font-extrabold text-white">Владелец салона</h4>
                <p class="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">Owner / Creator</p>
            </div>
            <div class="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 text-slate-300 text-sm">
                <p><strong class="text-white">Полные административные права:</strong> Владелец регистрирует салон, задает его название, валюту, тему оформления и базовый рабочий график.</p>
                <p><strong class="text-white">Финансовый аудит:</strong> Единственная роль, имеющая доступ к удалению кошельков, управлению транзакциями без ограничений и просмотру сводной аналитики прибыли/выручки за весь период.</p>
                <p><strong class="text-white">Управление командой:</strong> Принимает или отклоняет заявки от менеджеров и мастеров на вступление в салон, а также гибко разграничивает права доступа менеджеров.</p>
                <div class="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-indigo-300">
                    <i data-feather="shield" class="w-5 h-5 flex-shrink-0"></i>
                    <span>Владелец может включать или отключать модуль учета финансов при создании/настройке салона.</span>
                </div>
            </div>
        </div>
        `;
    }
    if (role === 'manager') {
        return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
            <div class="md:col-span-4 text-center md:text-left">
                <div class="w-20 h-20 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto md:mx-0 mb-4">
                    <i data-feather="user-check" class="w-10 h-10"></i>
                </div>
                <h4 class="text-2xl font-extrabold text-white">Менеджер салона</h4>
                <p class="text-xs text-purple-400 font-bold uppercase tracking-wider mt-1">Administrator / Manager</p>
            </div>
            <div class="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 text-slate-300 text-sm">
                <p><strong class="text-white">Операционное управление:</strong> Оформляет новые записи, меняет статусы визитов клиентов, следит за текущей загрузкой салона в календаре.</p>
                <p><strong class="text-white">Гибкие права доступа:</strong> Права менеджера настраиваются владельцем. Например, менеджеру можно запретить изменять каталог услуг, удалять записи клиентов или просматривать конкретные кошельки.</p>
                <p><strong class="text-white">Смены и касса:</strong> Менеджер открывает и закрывает рабочие смены мастеров, сверяет кассу на конец рабочего дня и регистрирует текущие доходы и расходы.</p>
                <div class="bg-purple-500/5 border border-purple-500/10 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-purple-300">
                    <i data-feather="info" class="w-5 h-5 flex-shrink-0"></i>
                    <span>Менеджер — правая рука владельца, обеспечивающая стабильную работу бьюти-точки.</span>
                </div>
            </div>
        </div>
        `;
    }
    if (role === 'master') {
        return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
            <div class="md:col-span-4 text-center md:text-left">
                <div class="w-20 h-20 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto md:mx-0 mb-4">
                    <i data-feather="scissors" class="w-10 h-10"></i>
                </div>
                <h4 class="text-2xl font-extrabold text-white">Мастер (Специалист)</h4>
                <p class="text-xs text-pink-400 font-bold uppercase tracking-wider mt-1">Specialist / Artist</p>
            </div>
            <div class="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 text-slate-300 text-sm">
                <p><strong class="text-white">Личный календарь:</strong> Мастер видит только свое личное расписание. Посторонние записи других мастеров для него скрыты в целях конфиденциальности.</p>
                <p><strong class="text-white">Контроль выработки:</strong> Отслеживает сумму выполненных услуг за текущий день или выбранный период.</p>
                <p><strong class="text-white">Расчет заработной платы:</strong> При включенном учете финансов мастер видит начисленный процент от выполненных визитов (например, 40%), что мотивирует его и исключает ошибки в бухгалтерии.</p>
                <div class="bg-pink-500/5 border border-pink-500/10 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-pink-300">
                    <i data-feather="check-circle" class="w-5 h-5 flex-shrink-0"></i>
                    <span>Мастер сфокусирован только на своей работе и обслуживании клиентов без лишнего шума в UI.</span>
                </div>
            </div>
        </div>
        `;
    }
    return '';
}

// Рендеринг аккордеона для Инструкций
function renderAccordionItem(key, icon, title, contentHtml) {
    const isOpen = state.ui.openInstructions[key] === true;
    return `
    <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
        <button onclick="toggleAccordion('${key}')" class="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-3 font-bold text-white text-base">
                <i data-feather="${icon}" class="w-5 h-5 text-indigo-400"></i>
                ${title}
            </span>
            <i data-feather="${isOpen ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-slate-400"></i>
        </button>
        <div class="transition-all duration-300 ${isOpen ? 'border-t border-white/5 p-6 block bg-slate-950/20' : 'hidden'}">
            ${contentHtml}
        </div>
    </div>
    `;
}

// Переключение состояния аккордеона
window.toggleAccordion = function (key) {
    const current = state.ui.openInstructions[key] === true;
    const openInstructions = { ...state.ui.openInstructions, [key]: !current };
    setUI({ openInstructions });
};

// Обработка отправки формы связи
window.handleLandingContactSubmit = function (e) {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !phone || !message) return;

    const contactRequest = {
        id: Date.now(),
        name,
        phone,
        subject,
        message,
        createdAt: new Date().toISOString()
    };

    // Сохраняем в localStorage для имитации
    try {
        const stored = JSON.parse(localStorage.getItem('suluu_contact_requests') || '[]');
        stored.push(contactRequest);
        localStorage.setItem('suluu_contact_requests', JSON.stringify(stored));
        console.log('Suluu Business Contact Request Saved:', contactRequest);
    } catch (err) {
        console.error('Error saving contact request:', err);
    }

    // Очищаем форму
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-message').value = '';

    showToast(`Спасибо, ${name}! Открываем диалог в WhatsApp...`, 'success');

    // Формируем текст сообщения
    const whatsappText = `Здравствуйте! Меня зовут ${name}.\nМой телефон: ${phone}.\nТема: ${subject}.\n\nСообщение:\n${message}`;
    const whatsappUrl = `https://wa.me/99650888268?text=${encodeURIComponent(whatsappText)}`;

    // Перенаправляем на WhatsApp
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
    }, 800);
};
