-- Migration to add clipped_articles table
create table public.clipped_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  author text,
  content text not null,          -- cleaned HTML or markdown of the article body
  excerpt text,
  image_url text,
  source_url text not null,
  domain text,
  reading_time_minutes int,
  created_at timestamptz default now()
);

alter table public.clipped_articles enable row level security;

-- Policy to allow users to manage their own clips
create policy "users manage own clips" on public.clipped_articles
  for all using (user_id = auth.uid());

create index idx_clipped_articles_user on public.clipped_articles(user_id, created_at desc);
