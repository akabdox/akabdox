-- Fahrasa: three public counts for the landing page. Numbers only, no rows,
-- so anonymous visitors learn nothing about any member.

create function public.public_stats() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'members', (select count(*) from public.profiles),
    'books', (select count(*) from public.shelf_items),
    'listings', (select count(*) from public.listings where status = 'active')
  )
$$;

revoke execute on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;
