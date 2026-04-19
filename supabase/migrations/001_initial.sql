-- ============================================================
-- ShopList - Initial Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- STORES
-- ============================================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('woolworths', 'coles', 'aldi', 'iga', 'other')),
  postcode TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  external_id TEXT,
  address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chain, external_id)
);

CREATE INDEX idx_stores_postcode ON stores(postcode);
CREATE INDEX idx_stores_chain ON stores(chain);

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HOUSEHOLD MEMBERS
-- ============================================================
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);

-- ============================================================
-- HOUSEHOLD SETTINGS
-- ============================================================
CREATE TABLE household_settings (
  household_id UUID PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  home_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  home_postcode TEXT,
  preferred_chain TEXT CHECK (preferred_chain IN ('woolworths', 'coles', 'aldi', 'iga', 'any')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  barcode TEXT,
  default_category TEXT NOT NULL DEFAULT 'Pantry',
  default_unit TEXT DEFAULT 'ea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, canonical_name)
);

CREATE INDEX idx_products_household ON products(household_id);
CREATE INDEX idx_products_name_trgm ON products USING GIN (canonical_name gin_trgm_ops);

-- ============================================================
-- SHOPPING LISTS
-- ============================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Shopping List',
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_shopping_lists_household ON shopping_lists(household_id);
CREATE INDEX idx_shopping_lists_active ON shopping_lists(household_id) WHERE completed_at IS NULL;

-- ============================================================
-- LIST ITEMS
-- ============================================================
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pantry',
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  estimated_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_list_items_list ON list_items(list_id);
CREATE INDEX idx_list_items_category ON list_items(list_id, category);

-- ============================================================
-- RECEIPTS
-- ============================================================
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  store_name TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  store_chain TEXT,
  total DECIMAL(10, 2),
  purchase_date DATE,
  raw_text TEXT,
  parsed_json JSONB,
  image_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipts_household ON receipts(household_id);
CREATE INDEX idx_receipts_date ON receipts(household_id, purchase_date DESC);

-- ============================================================
-- PURCHASE HISTORY
-- ============================================================
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2),
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_history_household ON purchase_history(household_id);
CREATE INDEX idx_purchase_history_product ON purchase_history(household_id, product_id);
CREATE INDEX idx_purchase_history_date ON purchase_history(household_id, purchased_at DESC);

-- ============================================================
-- MARKET PRICES
-- ============================================================
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_chain TEXT NOT NULL CHECK (store_chain IN ('woolworths', 'coles', 'aldi', 'iga', 'other')),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'ea',
  unit_price DECIMAL(10, 4),
  unit_type TEXT,
  is_special BOOLEAN NOT NULL DEFAULT FALSE,
  was_price DECIMAL(10, 2),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_prices_product ON market_prices USING GIN (product_name gin_trgm_ops);
CREATE INDEX idx_market_prices_chain ON market_prices(store_chain);
CREATE INDEX idx_market_prices_fetched ON market_prices(fetched_at DESC);

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  default_household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

CREATE OR REPLACE FUNCTION is_household_member(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_household_owner(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select" ON stores FOR SELECT USING (true);
CREATE POLICY "stores_insert" ON stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "market_prices_select" ON market_prices FOR SELECT USING (true);
CREATE POLICY "market_prices_insert" ON market_prices FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "market_prices_update" ON market_prices FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "profiles_select_own" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "households_select" ON households FOR SELECT USING (is_household_member(id));
CREATE POLICY "households_insert" ON households FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "households_update" ON households FOR UPDATE USING (is_household_owner(id));
CREATE POLICY "households_delete" ON households FOR DELETE USING (is_household_owner(id));

CREATE POLICY "members_select" ON household_members FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "members_insert" ON household_members FOR INSERT WITH CHECK (is_household_owner(household_id) OR auth.uid() = user_id);
CREATE POLICY "members_delete" ON household_members FOR DELETE USING (is_household_owner(household_id) OR user_id = auth.uid());

CREATE POLICY "settings_select" ON household_settings FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "settings_insert" ON household_settings FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "settings_update" ON household_settings FOR UPDATE USING (is_household_member(household_id));

CREATE POLICY "products_select" ON products FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "products_update" ON products FOR UPDATE USING (is_household_member(household_id));

CREATE POLICY "lists_select" ON shopping_lists FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "lists_insert" ON shopping_lists FOR INSERT WITH CHECK (is_household_member(household_id));
CREATE POLICY "lists_update" ON shopping_lists FOR UPDATE USING (is_household_member(household_id));
CREATE POLICY "lists_delete" ON shopping_lists FOR DELETE USING (is_household_owner(household_id));

CREATE POLICY "items_select" ON list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = list_id AND is_household_member(sl.household_id))
);
CREATE POLICY "items_insert" ON list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = list_id AND is_household_member(sl.household_id))
);
CREATE POLICY "items_update" ON list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = list_id AND is_household_member(sl.household_id))
);
CREATE POLICY "items_delete" ON list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = list_id AND is_household_member(sl.household_id))
);

CREATE POLICY "receipts_select" ON receipts FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "receipts_insert" ON receipts FOR INSERT WITH CHECK (is_household_member(household_id));

CREATE POLICY "history_select" ON purchase_history FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "history_insert" ON purchase_history FOR INSERT WITH CHECK (is_household_member(household_id));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER household_settings_updated_at
  BEFORE UPDATE ON household_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
