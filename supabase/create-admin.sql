-- =============================================================================
-- CREATE ADMIN ACCOUNT — paste and run once in Supabase SQL Editor
--
-- Run AFTER setup.sql (profiles table must exist).
--
-- Login after run:
--   Email    : jeffson@gmail.com
--   Password : 123Admin
-- =============================================================================

create extension if not exists "pgcrypto";

-- Create auth user + admin profile (or promote existing user)
do $$
declare
  admin_user_id uuid;
  admin_email constant text := 'jeffson@gmail.com';
  admin_password constant text := '123Admin';
begin
  select id into admin_user_id from auth.users where email = admin_email;

  if admin_user_id is null then
    admin_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Jeffson"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      admin_user_id,
      admin_user_id::text,
      jsonb_build_object('sub', admin_user_id::text, 'email', admin_email),
      'email',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  end if;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (admin_user_id, admin_email, 'Jeffson', 'admin', true)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = 'admin',
    is_active = true;
end $$;

-- Verify
select
  u.id,
  u.email,
  u.email_confirmed_at is not null as email_confirmed,
  p.full_name,
  p.role,
  p.is_active
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'jeffson@gmail.com';
