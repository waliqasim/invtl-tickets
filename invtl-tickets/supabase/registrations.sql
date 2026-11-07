-- INVTL registrations. Run once in the Supabase SQL editor for the INVTL project (not TORQ).

-- 1. Registration settings on each event
alter table events
  add column if not exists slug text,
  add column if not exists registration_open boolean not null default false,
  add column if not exists capacity integer,
  add column if not exists gate_word text,
  add column if not exists pass_counter integer not null default 0;

create unique index if not exists events_slug_key on events (slug) where slug is not null;

-- 2. Registrations
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  pass_number integer not null,
  pass_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  email text not null check (char_length(email) <= 254),
  party_size integer not null default 1 check (party_size between 1 and 4),
  status text not null default 'valid' check (status in ('valid', 'checked_in', 'cancelled')),
  checked_in_at timestamptz,
  cancelled_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, pass_number)
);

create unique index if not exists registrations_event_email_key
  on registrations (event_id, lower(email));
create index if not exists registrations_event_idx on registrations (event_id);

-- 3. Lock it down. Only the server (service role key) touches this table.
--    Pitlane reads it through server API routes that check the admin is signed in.
alter table registrations enable row level security;

-- 4. Claim a pass safely (one pass per email per event, respects capacity and the open/closed switch)
create or replace function claim_pass(
  p_event_id uuid,
  p_first text,
  p_last text,
  p_email text,
  p_party int
) returns registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  ev events;
  heads int;
  r registrations;
begin
  select * into ev from events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  -- Same email already registered: hand back their existing pass
  select * into r from registrations
   where event_id = p_event_id and lower(email) = lower(p_email) and status <> 'cancelled';
  if found then
    return r;
  end if;

  if not ev.registration_open then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if ev.capacity is not null then
    select coalesce(sum(party_size), 0) into heads
      from registrations
     where event_id = p_event_id and status <> 'cancelled';
    if heads + p_party > ev.capacity then
      raise exception 'EVENT_FULL:%', greatest(ev.capacity - heads, 0);
    end if;
  end if;

  -- A cancelled pass for this email is reused rather than duplicated
  select * into r from registrations
   where event_id = p_event_id and lower(email) = lower(p_email) and status = 'cancelled';
  if found then
    update registrations
       set status = 'valid', cancelled_at = null, party_size = p_party,
           first_name = p_first, last_name = p_last
     where id = r.id
     returning * into r;
    return r;
  end if;

  update events set pass_counter = pass_counter + 1
   where id = p_event_id
   returning pass_counter into ev.pass_counter;

  insert into registrations (event_id, pass_number, first_name, last_name, email, party_size)
  values (p_event_id, ev.pass_counter, p_first, p_last, lower(p_email), p_party)
  returning * into r;

  return r;
end
$$;

revoke execute on function claim_pass(uuid, text, text, text, int) from public, anon, authenticated;
