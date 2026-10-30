-- Run once in a NEW Supabase demonstration project containing test data only.
-- The assignment requires visitors to read and change tasks without logging in.
begin;

create table public.tasks (
  id bigint generated always as identity primary key,
  title text not null check (length(trim(title)) > 0),
  description text,
  completed boolean not null default false
);

alter table public.tasks enable row level security;
grant usage on schema public to anon;
grant select, insert, update, delete on table public.tasks to anon;
grant usage, select on sequence public.tasks_id_seq to anon;

create policy "Demo tasks: read" on public.tasks for select to anon using (true);
create policy "Demo tasks: create" on public.tasks for insert to anon with check (true);
create policy "Demo tasks: edit" on public.tasks for update to anon using (true) with check (true);
create policy "Demo tasks: delete" on public.tasks for delete to anon using (true);

insert into public.tasks (title, description, completed) values
  ('Finish the Task Manager', 'Check adding, editing and completing tasks.', false),
  ('Read the assignment instructions', 'Make a checklist of the required files.', true);

commit;
