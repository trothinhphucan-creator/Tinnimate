-- Fix is_admin() to read from app_metadata (service-role-only) instead of
-- user_metadata (user-editable), preventing privilege escalation.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;
