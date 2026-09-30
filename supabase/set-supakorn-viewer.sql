-- Set Supakorn's account to the read-only Viewer role.
update public.profiles
set role = 'viewer', updated_at = timezone('utc', now())
where id = (
  select id
  from auth.users
  where lower(email) = lower('Supakorn10623@gmail.com')
);

-- Verify the account after running the update.
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('Supakorn10623@gmail.com');
