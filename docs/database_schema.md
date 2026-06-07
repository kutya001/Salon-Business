# Схема базы данных Supabase и Row Level Security (RLS)

---

## 1. Схема сущностей и связей (Entity-Relationship)
База данных Suluu Business спроектирована в соответствии с принципами реляционных БД и мультиарендности (multi-tenancy). Все данные изолированы на уровне идентификаторов организаций (`business_id`).

### Таблицы БД:

#### 1.1. `public.profiles` (Пользовательские профили)
Наследуется от `auth.users`. Создается автоматически с помощью триггера `on_auth_user_created` при регистрации.
- `id` (UUID, PRIMARY KEY, REFERENCES auth.users)
- `username` (TEXT, UNIQUE, NOT NULL)
- `role` (TEXT, CHECK: `owner`, `manager`, `master`, `super_admin`)
- `created_at` (TIMESTAMPTZ)

#### 1.2. `public.business` (Организации / Салоны)
- `id` (UUID, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `owner_id` (UUID, REFERENCES public.profiles(id))
- `currency` (TEXT, DEFAULT 'сом')
- `description` (TEXT)
- `address` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `work_schedule` (JSONB, хранит рабочий график по дням недели)
- `theme` (TEXT, DEFAULT 'hair')
- `use_finance` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ)

#### 1.3. `public.business_members` (Заявки и Членство в салонах)
Связывает мастеров и менеджеров со структурами салонов.
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `user_id` (UUID, REFERENCES public.profiles(id))
- `role` (TEXT, CHECK: `manager`, `master`)
- `status` (TEXT, CHECK: `pending`, `approved`, `rejected`)
- `permissions` (JSONB, содержит кастомные права менеджеров)
- `created_at` (TIMESTAMPTZ)

#### 1.4. `public.categories` (Категории услуг салона)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `name` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ)

#### 1.5. `public.services` (Каталог услуг салона)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `category_id` (UUID, REFERENCES public.categories(id))
- `name` (TEXT, NOT NULL)
- `price` (DECIMAL, DEFAULT 0)
- `duration` (INTEGER, длительность в минутах)
- `gender_category` (TEXT)
- `description` (TEXT)
- `global_service_id` (UUID, REFERENCES public.global_services(id)) — связь с шаблоном
- `created_at` (TIMESTAMPTZ)

#### 1.6. `public.masters` (Сотрудники / Мастера салона)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `name` (TEXT, NOT NULL)
- `phone` (TEXT)
- `specialization` (TEXT)
- `avatar` (TEXT)
- `percentage` (NUMERIC, процент от услуг, по умолчанию 40)
- `work_hours_start` (TEXT, по умолчанию '09:00')
- `work_hours_end` (TEXT, по умолчанию '20:00')
- `services` (JSONB, массив UUID услуг, которые оказывает мастер)
- `user_id` (UUID, REFERENCES public.profiles(id)) — связь с учетной записью
- `created_at` (TIMESTAMPTZ)

#### 1.7. `public.clients` (Клиенты)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `name` (TEXT, NOT NULL)
- `phone` (TEXT)
- `visits` (INTEGER, DEFAULT 0)
- `revenue` (DECIMAL, DEFAULT 0)
- `last_visit` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

#### 1.8. `public.bookings` (Записи / Календарь)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `master_id` (UUID, REFERENCES public.masters(id))
- `client_id` (UUID, REFERENCES public.clients(id))
- `service_id` (UUID, REFERENCES public.services(id)) — основная услуга (fallback)
- `services` (JSONB) — массив UUID выбранных услуг для поддержки мульти-услуг
- `date` (DATE, NOT NULL)
- `time` (TEXT, NOT NULL)
- `status` (TEXT, DEFAULT 'pending')
- `price` (DECIMAL) — итоговая стоимость записи
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### 1.9. `public.wallets` (Кассы и Кошельки салона)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `name` (TEXT, NOT NULL)
- `icon` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 1.10. `public.transaction_categories` (Финансовые категории)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `name` (TEXT, NOT NULL)
- `type` (TEXT, CHECK: `income`, `expense`)
- `created_at` (TIMESTAMPTZ)

#### 1.11. `public.shifts` (Кассовые смены)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `status` (TEXT, CHECK: `open`, `closed`, по умолчанию `open`)
- `opened_at` (TIMESTAMPTZ)
- `closed_at` (TIMESTAMPTZ)
- `date` (DATE, NOT NULL)
- `opening_cash` (DECIMAL, DEFAULT 0)
- `closing_cash` (DECIMAL, DEFAULT 0)
- `created_at` (TIMESTAMPTZ)

#### 1.12. `public.transactions` (Финансовые транзакции)
- `id` (UUID, PRIMARY KEY)
- `business_id` (UUID, REFERENCES public.business(id))
- `type` (TEXT, CHECK: `income`, `expense`)
- `amount` (DECIMAL, NOT NULL)
- `description` (TEXT)
- `payment_method` (UUID, REFERENCES public.wallets(id))
- `category_id` (UUID, REFERENCES public.transaction_categories(id))
- `booking_id` (UUID, REFERENCES public.bookings(id)) — связь с визитом
- `shift_id` (UUID, REFERENCES public.shifts(id)) — привязка к смене
- `transaction_date_time` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

#### 1.13. `public.global_categories` & `public.global_services` (Глобальные шаблоны)
Используются для предоставления готовых справочников услуг при первом запуске салона.
- `global_categories`: `id` (UUID), `name` (TEXT, UNIQUE)
- `global_services`: `id` (UUID), `category_id` (UUID), `name` (TEXT), `price` (DECIMAL), `duration` (INTEGER), `gender_category` (TEXT), `description` (TEXT)

---

## 2. Разграничение доступа (Row Level Security)
Безопасность данных обеспечивается включенным RLS на всех таблицах. Проверка прав осуществляется с помощью SECURITY DEFINER функций СУБД PostgreSQL.

### Вспомогательные SQL-функции проверки прав:
1. `is_super_admin(p_user_id)`: Проверяет, имеет ли пользователь роль `super_admin` в таблице `profiles`.
2. `is_business_owner(p_business_id, p_user_id)`: Проверяет, является ли пользователь владельцем организации.
3. `is_business_member_approved(p_business_id, p_user_id, p_role)`: Проверяет, подтверждено ли членство пользователя в салоне и совпадает ли его роль.

### Примеры RLS-политик:
- **Profiles**: Чтение разрешено всем авторизованным. Обновление только своего профиля. Полный доступ разрешен суперадминистраторам.
- **Business**: Создание записи разрешено только пользователям с ролью `owner`. Изменение/удаление разрешено только владельцу салона (`owner_id = auth.uid()`).
- **Bookings, Masters, Services, Clients, Wallets, Transactions**:
  - `SELECT`: разрешен суперадминистраторам, владельцу бизнеса, а также подтвержденным членам организации (менеджерам и мастерам).
  - `INSERT` / `UPDATE` / `DELETE`: разрешены суперадминистраторам, владельцу бизнеса и подтвержденным менеджерам организации. Мастерам доступ к модификации данных запрещен.
- **Global Templates**: Чтение разрешено всем пользователям. Модификация (INSERT/UPDATE/DELETE) разрешена исключительно суперадминистраторам.
