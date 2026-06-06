-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop old tables to start fresh
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.masters CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.transaction_categories CASCADE;
DROP TABLE IF EXISTS public.business_members CASCADE;
DROP TABLE IF EXISTS public.business CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.global_services CASCADE;
DROP TABLE IF EXISTS public.global_categories CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'master', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_username TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'master');
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  
  -- Hardcode 'admin' username to super_admin
  IF v_username = 'admin' THEN
    v_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, v_username, v_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Business Settings
CREATE TABLE public.business (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'сом',
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    work_schedule JSONB DEFAULT '{}'::jsonb,
    theme TEXT DEFAULT 'hair',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Business Members (Employment Applications)
CREATE TABLE public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'master')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(business_id, user_id)
);

-- 4. Service Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Global Categories
CREATE TABLE public.global_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

-- Global Services (50+ templates)
CREATE TABLE public.global_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.global_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL,
    gender_category TEXT,
    description TEXT
);

-- 5. Masters
CREATE TABLE public.masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    specialization TEXT,
    avatar TEXT,
    percentage NUMERIC DEFAULT 40,
    work_hours_start TEXT DEFAULT '09:00',
    work_hours_end TEXT DEFAULT '20:00',
    services JSONB DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 6. Services
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 60,
    gender_category TEXT,
    description TEXT,
    global_service_id UUID REFERENCES public.global_services(id) ON DELETE SET NULL, -- link to templates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 7. Clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    visits INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 8. Bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    master_id UUID REFERENCES public.masters(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    services JSONB,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 9. Wallets
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 10. Transaction Categories
CREATE TABLE public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 11. Shifts
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    closed_at TIMESTAMP WITH TIME ZONE,
    date DATE NOT NULL,
    opening_cash DECIMAL(10, 2) DEFAULT 0,
    closing_cash DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 12. Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.business(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    payment_method UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    transaction_date_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.profiles, 
  public.business, 
  public.business_members, 
  public.categories, 
  public.masters, 
  public.services, 
  public.clients, 
  public.bookings, 
  public.wallets, 
  public.transaction_categories, 
  public.shifts, 
  public.transactions,
  public.global_categories,
  public.global_services;

-- Helper functions for RLS checks (SECURITY DEFINER to run with bypass)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business
    WHERE id = p_business_id AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_business_member_approved(p_business_id UUID, p_user_id UUID, p_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = p_business_id 
      AND user_id = p_user_id 
      AND status = 'approved'
      AND (p_role IS NULL OR role = p_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_services ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Allow select for all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow update for own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow all for super_admin" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- 2. Business Policies
CREATE POLICY "Allow select for all authenticated" ON public.business FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for owner" ON public.business FOR INSERT TO authenticated WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);
CREATE POLICY "Allow update/delete for owner" ON public.business FOR ALL TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Allow all for super_admin" ON public.business FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- 3. Business Members Policies
CREATE POLICY "Allow select for owner and user" ON public.business_members FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_business_owner(business_id, auth.uid())
);
CREATE POLICY "Allow insert for user" ON public.business_members FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'master')
);
CREATE POLICY "Allow update/delete for owner" ON public.business_members FOR ALL TO authenticated USING (
    public.is_business_owner(business_id, auth.uid())
);
CREATE POLICY "Allow all for super_admin" ON public.business_members FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- Global Templates Policies
CREATE POLICY "Allow select for all authenticated" ON public.global_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for all authenticated" ON public.global_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for super_admin" ON public.global_categories FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Allow all for super_admin" ON public.global_services FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- 4. Shared Tenant Tables Policies
-- Categories
CREATE POLICY "Allow select for owners, managers, and masters" ON public.categories FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid())
);
CREATE POLICY "Allow write for owners and managers" ON public.categories FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Services
CREATE POLICY "Allow select for owners, managers, and masters" ON public.services FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid())
);
CREATE POLICY "Allow write for owners and managers" ON public.services FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Clients
CREATE POLICY "Allow select for owners, managers, and masters" ON public.clients FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid())
);
CREATE POLICY "Allow write for owners and managers" ON public.clients FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Masters
CREATE POLICY "Allow select for owners, managers, and masters" ON public.masters FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid())
);
CREATE POLICY "Allow write for owners and managers" ON public.masters FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Bookings (Masters see only their own bookings)
CREATE POLICY "Allow select for bookings" ON public.bookings FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR
    public.is_business_owner(business_id, auth.uid()) OR
    public.is_business_member_approved(business_id, auth.uid(), 'manager') OR
    (public.is_business_member_approved(business_id, auth.uid(), 'master') AND 
     master_id IN (SELECT id FROM public.masters WHERE user_id = auth.uid()))
);
CREATE POLICY "Allow write for bookings" ON public.bookings FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR
    public.is_business_owner(business_id, auth.uid()) OR
    public.is_business_member_approved(business_id, auth.uid(), 'manager') OR
    (public.is_business_member_approved(business_id, auth.uid(), 'master') AND 
     master_id IN (SELECT id FROM public.masters WHERE user_id = auth.uid()))
);

-- Wallets
CREATE POLICY "Allow all for owners and managers" ON public.wallets FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Transaction Categories
CREATE POLICY "Allow all for owners and managers" ON public.transaction_categories FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Shifts
CREATE POLICY "Allow all for owners and managers" ON public.shifts FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Transactions
CREATE POLICY "Allow all for owners and managers" ON public.transactions FOR ALL TO authenticated USING (
    public.is_super_admin(auth.uid()) OR public.is_business_owner(business_id, auth.uid()) OR public.is_business_member_approved(business_id, auth.uid(), 'manager')
);

-- Helper RPC functions
CREATE OR REPLACE FUNCTION public.create_business_with_defaults(p_owner_id UUID, p_business_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
    v_hair_cat_id UUID;
    v_nail_cat_id UUID;
    v_username TEXT;
BEGIN
    -- 1. Create Business
    INSERT INTO public.business (name, owner_id)
    VALUES (p_business_name, p_owner_id)
    RETURNING id INTO v_business_id;

    -- 2. Create Default Wallets
    INSERT INTO public.wallets (business_id, name, icon) VALUES
    (v_business_id, 'Наличные', '💵'),
    (v_business_id, 'Расчетный счет', '💳');

    -- 3. Create Default Transaction Categories
    INSERT INTO public.transaction_categories (business_id, name, type) VALUES
    (v_business_id, 'Выручка от услуг', 'income'),
    (v_business_id, 'Продажа товаров', 'income'),
    (v_business_id, 'Зарплата', 'expense'),
    (v_business_id, 'Аренда', 'expense'),
    (v_business_id, 'Расходные материалы', 'expense');

    -- 4. Create Service Categories
    INSERT INTO public.categories (id, name, business_id) VALUES
    (uuid_generate_v4(), 'Парикмахерские услуги', v_business_id)
    RETURNING id INTO v_hair_cat_id;

    INSERT INTO public.categories (id, name, business_id) VALUES
    (uuid_generate_v4(), 'Маникюр и педикюр', v_business_id)
    RETURNING id INTO v_nail_cat_id;

    -- 5. Create Services
    INSERT INTO public.services (category_id, name, price, duration, gender_category, business_id) VALUES
    (v_hair_cat_id, 'Женская стрижка', 1200, 60, 'female', v_business_id),
    (v_hair_cat_id, 'Мужская стрижка', 800, 45, 'male', v_business_id),
    (v_nail_cat_id, 'Маникюр с покрытием Gel', 1500, 90, 'female', v_business_id);

    -- 6. Get Owner Username
    SELECT username INTO v_username FROM public.profiles WHERE id = p_owner_id;
    IF v_username IS NULL THEN
        v_username := 'Владелец';
    END IF;

    -- 7. Create Owner as Master
    INSERT INTO public.masters (business_id, name, user_id, specialization)
    VALUES (v_business_id, v_username, p_owner_id, 'Владелец / Мастер');

    -- 8. Add Owner to Business Members as Approved Master
    INSERT INTO public.business_members (business_id, user_id, role, status)
    VALUES (v_business_id, p_owner_id, 'master', 'approved');

    RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_update_user(target_user_id UUID, new_username TEXT, new_role TEXT, new_password TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only super_admin can edit users.';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET username = new_username, role = new_role
  WHERE id = target_user_id;

  -- Update password if provided
  IF new_password IS NOT NULL AND new_password <> '' THEN
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only super_admin can delete users.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
