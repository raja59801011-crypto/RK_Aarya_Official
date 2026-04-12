/*
  # RK Group Voice Chat - Complete Schema

  ## Overview
  Creates all tables for the RK Group Voice Chat application.

  ## Tables
  1. `profiles` - User profiles with username, avatar, coins balance, roles
  2. `rooms` - Voice chat rooms/party halls
  3. `room_seats` - 15-seat grid for each room (seat occupancy)
  4. `coin_transactions` - Coin transfer history between users
  5. `agency_members` - Agency membership tracking
  6. `agency_earnings` - Agency earnings records

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write own data
  - Super admins have elevated access
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  phone text UNIQUE,
  coins bigint DEFAULT 0,
  role text DEFAULT 'user' CHECK (role IN ('user', 'coin_seller', 'agency_owner', 'super_admin')),
  agency_id uuid,
  is_profile_locked boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  owner_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  max_seats integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE TABLE IF NOT EXISTS room_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  seat_number integer NOT NULL CHECK (seat_number >= 1 AND seat_number <= 15),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_locked boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  joined_at timestamptz,
  UNIQUE (room_id, seat_number)
);

ALTER TABLE room_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view seats"
  ON room_seats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert into seats"
  ON room_seats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own seat or admins can update any"
  ON room_seats FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can delete own seat or admins can delete any"
  ON room_seats FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id),
  to_user_id uuid REFERENCES profiles(id),
  amount bigint NOT NULL CHECK (amount > 0),
  transaction_type text DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'gift', 'purchase', 'admin_grant')),
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Coin sellers and admins can insert transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('coin_seller', 'super_admin')
    )
  );

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES profiles(id),
  total_earnings bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view agencies"
  ON agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agency owners and admins can insert agencies"
  ON agencies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agency_owner', 'super_admin')
    )
  );

CREATE POLICY "Agency owners and admins can update agencies"
  ON agencies FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS agency_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  member_id uuid REFERENCES profiles(id),
  coins_earned bigint DEFAULT 0,
  period_start timestamptz DEFAULT now(),
  period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agency_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view own earnings"
  ON agency_earnings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = member_id OR
    EXISTS (
      SELECT 1 FROM agencies WHERE id = agency_id AND owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Agency owners and admins can insert earnings"
  ON agency_earnings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agencies WHERE id = agency_id AND owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN agency_id uuid REFERENCES agencies(id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO rooms (name, description) 
VALUES ('RK Royal Club', 'The main party hall of RK Group')
ON CONFLICT DO NOTHING;
