-- Add RLS policy for Admin to have full access to profiles table
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke profiles" ON public.profiles;
CREATE POLICY "Admin memiliki akses penuh ke profiles" ON public.profiles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
