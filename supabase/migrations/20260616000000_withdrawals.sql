-- 1. Tabel Penarikan Dana (Withdrawals)
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk withdrawals
CREATE POLICY "User dapat melihat penarikan sendiri" ON withdrawals FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = withdrawals.user_id AND auth_user_id = auth.uid()));

CREATE POLICY "User dapat membuat penarikan baru" ON withdrawals FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = withdrawals.user_id AND auth_user_id = auth.uid()));

CREATE POLICY "Admin memiliki akses penuh ke withdrawals" ON withdrawals FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Membuat bucket storage untuk bukti transfer penarikan (opsional jika sudah ada, atau buat via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('withdrawals', 'withdrawals', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan RLS untuk bucket withdrawals
DROP POLICY IF EXISTS "Bukti transfer dapat dilihat publik" ON storage.objects;
CREATE POLICY "Bukti transfer dapat dilihat publik" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'withdrawals');

DROP POLICY IF EXISTS "Admin dapat mengelola bukti transfer" ON storage.objects;
CREATE POLICY "Admin dapat mengelola bukti transfer" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'withdrawals' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

