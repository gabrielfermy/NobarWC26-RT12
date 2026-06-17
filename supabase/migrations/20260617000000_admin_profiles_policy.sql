-- Add RLS policy for Admin to have full access to profiles table without infinite recursion
DROP POLICY IF EXISTS "Admin memiliki akses penuh ke profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE POLICY "Admin memiliki akses penuh ke profiles" ON public.profiles FOR ALL TO authenticated
    USING (public.is_admin());

