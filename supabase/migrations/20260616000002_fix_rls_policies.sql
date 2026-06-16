-- Fix RLS Policies for transactions and predictions to support decoupled auth profiles

DROP POLICY IF EXISTS "User dapat melihat transaksi pending sendiri" ON public.transactions;
CREATE POLICY "User dapat melihat transaksi pending sendiri" ON public.transactions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = transactions.user_id AND auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "User dapat membuat transaksi baru" ON public.transactions;
CREATE POLICY "User dapat membuat transaksi baru" ON public.transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = transactions.user_id AND auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "User dapat melihat tebakan sendiri" ON public.predictions;
CREATE POLICY "User dapat melihat tebakan sendiri" ON public.predictions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = predictions.user_id AND auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "User dapat membuat tebakan baru" ON public.predictions;
CREATE POLICY "User dapat membuat tebakan baru" ON public.predictions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = predictions.user_id AND auth_user_id = auth.uid()));
