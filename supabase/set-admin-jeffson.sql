-- =============================================================================
-- Make jeffson@gmail.com an admin
-- IMPORTANT: Run as TWO separate queries in Supabase SQL Editor (Run each one)
-- =============================================================================

-- QUERY 1 — Run this first, then click Run
alter type public.app_role add value if not exists 'admin';

-- =============================================================================
-- QUERY 2 — Run this second (new query tab or after Query 1 succeeds)
-- =============================================================================

insert into public.profiles (id, email, full_name, role, is_active)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', 'Jeffson'),
  'admin'::public.app_role,
  true
from auth.users u
where u.email = 'jeffson@gmail.com'
on conflict (id) do update
  set
    role = 'admin'::public.app_role,
    full_name = excluded.full_name,
    is_active = true;

select email, full_name, role, is_active
from public.profiles
where email = 'jeffson@gmail.com';
