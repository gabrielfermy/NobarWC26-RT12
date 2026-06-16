-- Fix all administrator RLS policies to use the non-recursive public.is_admin() function

-- 1. Table: matches
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke matches" ON public.matches;
CREATE POLICY "Admin memiliki akses penuh ke matches" ON public.matches FOR ALL TO authenticated
    USING (public.is_admin());

-- 2. Table: transactions
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke transactions" ON public.transactions;
CREATE POLICY "Admin memiliki akses penuh ke transactions" ON public.transactions FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Table: predictions
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke predictions" ON public.predictions;
CREATE POLICY "Admin memiliki akses penuh ke predictions" ON public.predictions FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Table: withdrawals
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke withdrawals" ON public.withdrawals;
CREATE POLICY "Admin memiliki akses penuh ke withdrawals" ON public.withdrawals FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Storage bucket policy: withdrawals
DROP POLICY IF EXISTS "Admin dapat mengelola bukti transfer" ON storage.objects;
CREATE POLICY "Admin dapat mengelola bukti transfer" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'withdrawals' AND public.is_admin());
