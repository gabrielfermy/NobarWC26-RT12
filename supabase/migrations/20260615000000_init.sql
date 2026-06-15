-- 1. Tabel Pertandingan (Matches)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(50) NOT NULL, -- Contoh: '32 Besar', '16 Besar', 'Perempat Final', 'Final'
    score_a INTEGER,
    score_b INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Profil User / Peserta (Profiles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Transaksi / Invoice (Transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('qris', 'cash')),
    transaction_reference VARCHAR(255),
    is_printed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Tebak Skor / Prediksi (Predictions)
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    predicted_score_a INTEGER NOT NULL,
    predicted_score_b INTEGER NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS
CREATE POLICY "Jadwal dapat dilihat siapa saja" ON matches FOR SELECT TO public USING (true);
CREATE POLICY "Profil dapat dilihat siapa saja" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Tebakan lunas dapat dilihat siapa saja" ON predictions FOR SELECT TO public 
    USING (EXISTS (SELECT 1 FROM transactions WHERE id = predictions.transaction_id AND payment_status = 'paid'));
CREATE POLICY "Transaksi lunas dapat dilihat siapa saja" ON transactions FOR SELECT TO public USING (payment_status = 'paid');

CREATE POLICY "User dapat mengelola profil sendiri" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "User dapat melihat transaksi pending sendiri" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat transaksi baru" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User dapat melihat tebakan sendiri" ON predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat tebakan baru" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin memiliki akses penuh ke matches" ON matches FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin memiliki akses penuh ke transactions" ON transactions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin memiliki akses penuh ke predictions" ON predictions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger sinkronisasi profil saat user baru terdaftar di Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'phone_number', '-'),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
