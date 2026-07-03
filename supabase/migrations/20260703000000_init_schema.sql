-- 1. SCHEMAS & TRIGGERS CONFIGURATION

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme text default 'dark',            -- 'dark' | 'light'
  accent_color text default '#3D6BFF',
  density text default 'comfortable',   -- 'comfortable' | 'compact'
  created_at timestamptz default now()
);

-- Profiles sync trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, theme, accent_color, density)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    'dark',
    '#3D6BFF',
    'comfortable'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Content taxonomy
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  parent_id uuid references public.categories(id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null
);

-- Articles / News Items
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  key_points jsonb,                     -- array of strings
  body text,
  category_id uuid references public.categories(id),
  importance smallint check (importance between 1 and 3), -- 1 low, 2 med, 3 high
  reading_time_minutes int,
  difficulty text,                      -- 'beginner'|'intermediate'|'advanced'
  source_name text,
  source_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table public.article_entities (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  entity_type text check (entity_type in ('person','country','organization')),
  entity_name text not null
);

create table public.article_tags (
  article_id uuid references public.articles(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table public.related_articles (
  article_id uuid references public.articles(id) on delete cascade,
  related_article_id uuid references public.articles(id) on delete cascade,
  primary key (article_id, related_article_id)
);

-- Timeline
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  topic_slug text,
  article_id uuid references public.articles(id)
);

-- Trending Topics
create table public.trending_topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  mention_count int default 0,
  window_date date default current_date
);

-- Knowledge Vault (user-scoped)
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, article_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade,
  content text not null,
  highlight_ref jsonb,                  -- {start, end, quoted_text} if inline highlight
  created_at timestamptz default now()
);

create table public.saved_pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  storage_path text not null,           -- Supabase Storage reference
  created_at timestamptz default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  author text,
  source_article_id uuid references public.articles(id) on delete set null,
  created_at timestamptz default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Study Mode
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  topic text,
  next_review_at timestamptz default now(),
  interval_days int default 1,
  ease_factor numeric default 2.5
);

create table public.mind_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  graph_data jsonb not null,            -- nodes/edges
  created_at timestamptz default now()
);

create table public.pyqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  year int,
  topic text,
  source_exam text
);

create table public.thinkers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  era text,
  key_ideas text,
  key_texts jsonb
);

-- Productivity
create table public.reading_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade,
  read_at timestamptz default now(),
  duration_seconds int
);

create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date
);

create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamptz default now(),
  duration_minutes int,
  topic text
);

-- Live data cache
create table public.live_data_cache (
  key text primary key,                 -- e.g. 'stocks:SPX', 'crypto:BTC'
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- 2. FULL TEXT SEARCH INDEX
alter table public.articles
  add column textsearchable_index_col tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body, ''))
  ) stored;

create index articles_textsearch_idx on public.articles using gin(textsearchable_index_col);

-- Indexes
create index idx_articles_category on public.articles(category_id);
create index idx_articles_published on public.articles(published_at desc);
create index idx_bookmarks_user on public.bookmarks(user_id);
create index idx_notes_user on public.notes(user_id);
create index idx_flashcards_review on public.flashcards(user_id, next_review_at);
create index idx_timeline_date on public.timeline_events(event_date);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES

-- User-scoped tables
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.saved_pdfs enable row level security;
alter table public.quotes enable row level security;
alter table public.ideas enable row level security;
alter table public.flashcards enable row level security;
alter table public.mind_maps enable row level security;
alter table public.reading_activity enable row level security;
alter table public.streaks enable row level security;
alter table public.pomodoro_sessions enable row level security;

-- Public read / system tables
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_entities enable row level security;
alter table public.article_tags enable row level security;
alter table public.related_articles enable row level security;
alter table public.timeline_events enable row level security;
alter table public.trending_topics enable row level security;
alter table public.pyqs enable row level security;
alter table public.thinkers enable row level security;
alter table public.live_data_cache enable row level security;

-- 4. CREATE SECURITY POLICIES

-- User-scoped policies
create policy "Allow users to manage their own profile"
  on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "Allow users to manage their own bookmarks"
  on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own notes"
  on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own saved_pdfs"
  on public.saved_pdfs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own quotes"
  on public.quotes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own ideas"
  on public.ideas for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own flashcards"
  on public.flashcards for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own mind_maps"
  on public.mind_maps for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own reading_activity"
  on public.reading_activity for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own streaks"
  on public.streaks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Allow users to manage their own pomodoro_sessions"
  on public.pomodoro_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public select policies
create policy "Allow public read of categories" on public.categories for select using (true);
create policy "Allow public read of tags" on public.tags for select using (true);
create policy "Allow public read of articles" on public.articles for select using (true);
create policy "Allow public read of article_entities" on public.article_entities for select using (true);
create policy "Allow public read of article_tags" on public.article_tags for select using (true);
create policy "Allow public read of related_articles" on public.related_articles for select using (true);
create policy "Allow public read of timeline_events" on public.timeline_events for select using (true);
create policy "Allow public read of trending_topics" on public.trending_topics for select using (true);
create policy "Allow public read of pyqs" on public.pyqs for select using (true);
create policy "Allow public read of thinkers" on public.thinkers for select using (true);
create policy "Allow public read of live_data_cache" on public.live_data_cache for select using (true);

-- 5. SEED DATA

-- Seed categories (static UUIDs)
insert into public.categories (id, slug, name, icon) values
  ('e1451f28-024e-4f11-9a7f-e274cfb7d601', 'politics', 'Politics', '🏛️'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d602', 'international-affairs', 'International Affairs', '🌐'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d603', 'india', 'India', '🇮🇳'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d604', 'ai', 'AI', '🤖'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d605', 'technology', 'Technology', '💻'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d606', 'economy', 'Economy', '📈'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d607', 'science', 'Science', '🧪'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d608', 'gaming', 'Gaming', '🎮'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d609', 'editing-creative', 'Editing & Creative', '🎨'),
  ('e1451f28-024e-4f11-9a7f-e274cfb7d610', 'learning', 'Learning', '📚');

-- Seed tags (static UUIDs)
insert into public.tags (id, slug, label) values
  ('d1451f28-024e-4f11-9a7f-e274cfb7e701', 'Semiconductors', 'Semiconductors'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e702', 'Supply Chains', 'Supply Chains'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e703', 'Geopolitics', 'Geopolitics'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e704', 'Asia-Pacific', 'Asia-Pacific'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e705', 'AI', 'AI'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e706', 'LLMs', 'LLMs'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e707', 'Inference Compute', 'Inference Compute'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e708', 'Machine Learning', 'Machine Learning'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e709', 'India', 'India'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e710', 'Cabinet Decisions', 'Cabinet Decisions'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e711', 'Manufacturing', 'Manufacturing'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e712', 'Inflation', 'Inflation'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e713', 'Federal Reserve', 'Federal Reserve'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e714', 'Macroeconomics', 'Macroeconomics'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e715', 'Interest Rates', 'Interest Rates'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e716', 'Climate Policy', 'Climate Policy'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e717', 'Trade', 'Trade'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e718', 'European Union', 'European Union'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e719', 'Carbon Tax', 'Carbon Tax'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e720', 'Physics', 'Physics'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e721', 'Fusion', 'Fusion'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e722', 'Clean Energy', 'Clean Energy'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e723', 'Science Breakthrough', 'Science Breakthrough'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e724', 'Quantum Computing', 'Quantum Computing'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e725', 'Silicon', 'Silicon'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e726', 'Nanotechnology', 'Nanotechnology'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e727', 'Foreign Policy', 'Foreign Policy'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e728', 'Strategic Autonomy', 'Strategic Autonomy'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e729', 'Next.js', 'Next.js'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e730', 'Web Dev', 'Web Dev'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e731', 'Performance', 'Performance'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e732', 'React', 'React'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e733', 'Space', 'Space'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e734', 'SpaceX', 'SpaceX'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e735', 'Engineering', 'Engineering'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e736', 'Aerospace', 'Aerospace'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e737', 'Rust', 'Rust'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e738', 'Compilers', 'Compilers'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e739', 'Software Engineering', 'Software Engineering'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e740', 'Systems Programming', 'Systems Programming'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e741', 'Gaming', 'Gaming'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e742', 'AI in Games', 'AI in Games'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e743', 'Rendering', 'Rendering'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e744', 'Game Tech', 'Game Tech'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e745', 'Video Editing', 'Video Editing'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e746', 'Color Grading', 'Color Grading'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e747', 'DaVinci Resolve', 'DaVinci Resolve'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e748', 'Learning', 'Learning'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e749', 'Neuroscience', 'Neuroscience'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e750', 'Study Tips', 'Study Tips'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e751', 'Cognitive Science', 'Cognitive Science'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e752', 'Political Science', 'Political Science'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e753', 'International Relations', 'International Relations'),
  ('d1451f28-024e-4f11-9a7f-e274cfb7e754', 'Realism', 'Realism');

-- Seed sample articles (static UUIDs)
insert into public.articles (id, slug, title, summary, key_points, body, category_id, importance, reading_time_minutes, difficulty, source_name, source_url, published_at) values
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f801',
    'geopolitical-shifts-east-asia-chips',
    'Geopolitical Shifts in East Asian Semiconductor Supply Chains',
    'As unilateral export restrictions tighten, Taiwan, Japan, and South Korea are reforming security alliances to protect lithography expertise and silicon manufacturing capabilities.',
    '["New multilateral agreements aim to establish joint research centers for sub-2nm lithography.", "Industrial policy subsidies in Japan have triggered a rapid expansion of local foundries in Kumamoto.", "Export controls on chemical precursors are forcing South Korean manufacturers to diversify raw material sourcing."]',
    'The global semiconductor landscape is undergoing its most significant structural shift since the dawn of the silicon age. A series of unilateral export controls and strategic security alliances are redrawing the map of chip manufacturing, with profound implications for East Asian economies.

For decades, the division of labor was highly optimized: American design houses, Dutch lithography systems, Taiwanese precision foundries, Japanese chemical suppliers, and South Korean memory giants worked in a highly integrated global web. Today, that web is being deliberately untangled.

### The Rise of the Kumamoto Silicon Cluster
Japan''s Ministry of Economy, Trade and Industry (METI) has pioneered a massive subsidy program, bringing TSMC to Kumamoto and funding the local venture Rapidus. This represents a strategic attempt to reclaim Japan''s historical dominance in fabrication, backed by solid local chemical and tool suppliers like Tokyo Electron.

### Taiwan''s Defense Strategy
Taiwan remains the undisputed hub for advanced foundry services. However, Taiwan is utilizing "silicon diplomacy" to entrench its global position. By building satellite fabs in Germany and the United States, TSMC ensures that international powers remain deeply invested in the defense of Taiwan''s logistical integrity.

Meanwhile, South Korea''s Samsung and SK Hynix are navigating complex waivers. They are building new gigafabs within their domestic borders while attempting to sustain legacy operations elsewhere, requiring a massive retooling of supply pipelines.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d602', -- International Affairs
    3,
    5,
    'advanced',
    'Foreign Policy Review',
    'https://example.com/east-asia-chips',
    '2026-07-03T08:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f802',
    'openai-scaling-frontiers-gpt5',
    'OpenAI Details ''Frontier-V'' Architecture and Scaling Milestones',
    'Leaked internal specifications confirm OpenAI''s upcoming model relies on hybrid mixture-of-experts (MoE) and localized planning steps to overcome traditional scaling laws.',
    '["Frontier-V introduces a multi-step reasoning overlay that optimizes computation at inference time.", "The model uses dynamic routing across 256 specialized sub-networks.", "System achieves significant energy efficiency improvements compared to GPT-4o."]',
    'OpenAI has internally circulated technical documentation detailing their next-generation reasoning engine, codenamed "Frontier-V" (commonly referred to as GPT-5). The paper reveals how the organization bypassed the traditional compute bottlenecks that have slowed LLM progress over the last 18 months.

### Inference-Time Compute
Rather than simply scaling parameters during pre-training, Frontier-V shifts the computational weight to the inference phase. By introducing a ''System 2'' planning mechanism, the model halts generation to evaluate intermediate reasoning steps before emitting tokens. This allows it to solve complex scientific and mathematical proofs that stump current architectures.

### Sparse MoE Architectures
The hardware requirements are optimized through a sparse Mixture of Experts (MoE) routing layer. With 256 routing paths, only a fraction of the total parameters are activated for any single token. This reduces latency and mitigates the massive thermal demands previously associated with frontier AI models.

Industry analysts suggest that the deployment of Frontier-V will reshape cloud infrastructure demands, forcing hyper-scalers to rapidly build out localized edge clusters capable of managing specialized inference routines close to users.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d604', -- AI
    3,
    4,
    'advanced',
    'MIT Technology Archive',
    'https://example.com/openai-frontier-v',
    '2026-07-03T10:30:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f803',
    'india-semiconductor-mission-2026',
    'India Semiconductor Mission Expands Guarantees to Fabrication Projects',
    'The Indian Cabinet approved an additional $5 billion in fiscal support, widening incentives to cover compound semiconductor fabrication facilities and advanced packaging hubs.',
    '["Incentives now cover up to 50% of project costs for silicon carbide and gallium nitride fabs.", "Three new assembly and testing (OSAT) projects were cleared for construction in Gujarat and Assam.", "Domestic talent creation program will fund chip design labs in 100 universities."]',
    'India is raising the stakes in the global semiconductor race. The Union Cabinet today approved a major expansion of the India Semiconductor Mission (ISM), adding $5 billion in capital funding and easing joint-venture requirements for global technology groups.

### Compound Semiconductor Push
Recognizing the high barriers to entry for advanced sub-5nm silicon nodes, India''s strategy shifts focus slightly toward compound semiconductors. These materials—specifically silicon carbide (SiC) and gallium nitride (GaN)—are vital for electric vehicles, solar inverters, and high-frequency defense telecommunications.

### Geopolitical Realignment
By offering robust fiscal stability guarantees, India is positioning itself as a reliable secondary sourcing destination in the ''China+1'' supply chain strategy. Partnerships with players in Taiwan, Japan, and the EU are expected to accelerate tech transfers over the next three years.

Critics note that the availability of high-purity water, stable electricity, and logistical infrastructure remains a challenge in rural industrial zones. However, fast-tracked construction in Dholera, Gujarat, demonstrates the government''s resolve to bypass bureaucratic bottlenecks.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d603', -- India
    2,
    3,
    'intermediate',
    'Economic Times',
    'https://example.com/ism-expansion',
    '2026-07-03T05:15:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f804',
    'global-inflation-macro-outlook',
    'Federal Reserve Signals Sustained Neutral Rates Amid Structural Changes',
    'Chairman reports that structural labor shortages and green transition capital demands are locking the neutral interest rate (r-star) higher than pre-pandemic levels.',
    '["The estimated long-run neutral interest rate has been revised upward to 3.25%.", "Supply-side structural changes, including near-shoring, are keeping base costs sticky.", "Central banks globally are forced to adjust their 10-year yield targets upward."]',
    'In a landmark address at the Jackson Hole symposium, the Federal Reserve Chair confirmed what economists have suspected for years: the era of near-zero interest rates is permanently behind us. The neutral rate of interest (known to economists as r-star) has drifted structurally higher.

### The Dynamics of High r-star
Several key global trends are keeping the cost of capital elevated:
1. **The Green Transition:** Decarbonization requires trillions of dollars in upfront capital investments, driving up loan demand.
2. **De-Globalization:** Reshoring manufacturing lines to friendly nations requires duplicate infrastructure, reducing global supply chain efficiencies.
3. **Demographics:** Aging workforces in developed markets are reducing the pool of national savings while driving up health-care costs.

### Market Implications
For equity markets, a structurally higher r-star forces a reassessment of valuations. Technology companies relying on distant future cash flows must operate under tighter capital discipline. Meanwhile, fixed-income yields are locked into a range that makes bonds a highly competitive asset class once again.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d606', -- Economy
    2,
    4,
    'intermediate',
    'Bloomberg Economics',
    'https://example.com/fed-neutral-rates',
    '2026-07-02T14:20:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f805',
    'eu-carbon-border-adjustment-mechanism',
    'EU Carbon Border Adjustment Mechanism (CBAM) Enters Critical Enforcement Phase',
    'Importers must now acquire carbon certificates matching the weekly emissions price of domestic industrial materials, raising tensions with major developing trading partners.',
    '["The transition phase ends; actual tariffs are now applied to steel, cement, aluminum, and fertilizers.", "Tensions rise with India and China, who label the regulation a unilateral trade barrier.", "European manufacturers warn of raw material price volatility during the adjustment period."]',
    'The European Union has commenced full enforcement of its pioneering Carbon Border Adjustment Mechanism (CBAM). As of this month, importers must purchase digital carbon certificates that match the carbon price that domestic EU manufacturers pay under the Emission Trading System (ETS).

This represents the world''s first carbon border tax, designed to prevent ''carbon leakage''—where European firms outsource high-emission manufacturing to countries with looser environmental laws.

### Trade Friction
Developing nations, led by India, Brazil, and China, are preparing a formal challenge at the World Trade Organization. They argue that CBAM violates the principle of ''Common but Differentiated Responsibilities'' (CBDR) established in international climate treaties, effectively penalizing developing industrial bases.

EU officials maintain that CBAM is a non-discriminatory environmental policy, arguing that any country that establishes its own domestic carbon pricing mechanism can deduct those costs from the CBAM requirements at the border.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d601', -- Politics
    2,
    5,
    'advanced',
    'Financial Times',
    'https://example.com/cbam-enforcement',
    '2026-07-02T09:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f806',
    'fusion-energy-breakthrough-ignition',
    'National Ignition Facility Exceeds 5 Megajoules of Fusion Yield',
    'Physicists achieve a new record yield in laser-driven inertial confinement fusion, outputting more than double the electrical energy directed at the target fuel pellet.',
    '["The experiment yielded approximately 5.4 MJ of fusion energy using a 2.1 MJ laser pulse.", "Improvements in diamond fuel capsule symmetry helped prevent early plasma cooling.", "Engineering challenges remain in scaling this single-shot mechanism to a continuous power plant."]',
    'Physicists at the Lawrence Livermore National Laboratory have announced a major milestone in the quest for clean, limitless energy. For the second time this year, the National Ignition Facility (NIF) has achieved ''scientific breakeven'' (ignition), this time yielding a record 5.4 megajoules of energy from a 2.1 megajoule laser target pulse.

### Inertial Confinement Fusion
NIF utilizes a process called inertial confinement fusion. A tiny capsule containing deuterium and tritium is placed inside a gold cylinder (hohlraum). 192 intense laser beams hit the inner walls of the cylinder, generating X-rays that cause the capsule to compress violently, heating the fuel to stellar core temperatures.

### The Engineering Challenge
While the energy yield at the target represents a gain of 2.5x, the lasers themselves consume over 300 megajoules of electricity from the grid to charge and fire. To make fusion commercial, the efficiency of the laser systems must improve by orders of magnitude, and the system must fire at a rate of 10 times per second, rather than once per day.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d607', -- Science
    3,
    4,
    'advanced',
    'Scientific American',
    'https://example.com/nif-5mj-yield',
    '2026-07-01T16:45:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f807',
    'quantum-entanglement-silicon-nodes',
    'Researchers Map Remote Entanglement Across Silicon-Spin Qubits',
    'A joint research group successfully established quantum entanglement between two silicon-spin qubits spaced 10 centimeters apart, demonstrating scalable microchip integration paths.',
    '["Silicon spin qubits maintain coherence longer than superconducting equivalents when cooled.", "An integrated microwave resonator acted as the quantum bridge between remote nodes.", "The design uses standard CMOS manufacturing, easing potential industrial mass production."]',
    'A consortium of physicists at Delft University and Princeton has cleared a major hurdle in quantum processor design. They demonstrated remote entanglement between two spin qubits housed on distinct silicon chips separated by 10 centimeters of fiber interface.

### Silicon Spin Qubits
Most public quantum computers today (IBM, Google) use superconducting qubits, which require huge dilution refrigerators and are highly sensitive to thermal noise. Silicon spin qubits, on the other hand, utilize the spin of a single electron trapped in a silicon quantum dot. They are extremely compact—about the size of a standard transistor—and can be fabricated using standard silicon microchip processes.

### The Microwave Bridge
By routing a superconducting microwave resonator between the two quantum dots, researchers created a channel that allows the qubits to share state information over macro distances. This enables a modular architecture where smaller quantum processors can be linked together like nodes in a server rack, bypassing the physical constraints of placing thousands of qubits on a single wafer.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d607', -- Science
    2,
    5,
    'advanced',
    'Nature Physics Journal',
    'https://example.com/silicon-spin-entanglement',
    '2026-07-01T11:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f808',
    'indias-foreign-policy-multi-alignment',
    'Navigating Multi-Alignment: India''s Geopolitics in a Multipolar World',
    'By strengthening ties with the Quad while maintaining active participation in BRICS, India is implementing a pragmatic foreign policy focused on strategic autonomy and national development.',
    '["India continues bilateral defense co-production deals with France and the US.", "Simultaneously, energy purchases and logistical agreements with Russia remain stable.", "Strategic autonomy is leveraged to secure domestic industrial growth and tech transfers."]',
    'India''s contemporary foreign policy is a masterclass in pragmatic diplomacy. Rejecting the rigid alliance systems of the Cold War, New Delhi has pioneered a doctrine of ''multi-alignment''—engaging with multiple competing centers of global power to secure its own national interest.

### The Quad vs. BRICS Balance
To the West, India is a vital pillar of the Quadrilateral Security Dialogue (alongside the US, Japan, and Australia), serving as a democratic counterbalance in the Indo-Pacific. To the East, India remains a founding member of BRICS and the Shanghai Cooperation Organisation (SCO), ensuring its voice is heard in forums that seek to reform global governance structures.

### Defense and Energy Autonomy
This multi-layered approach is highly apparent in India''s defense procurements. While importing advanced Rafale jets from France and co-producing jet engines with GE in the United States, New Delhi continues to acquire defense hardware and crude oil from Russia, resisting Western pressure to isolate Moscow.

According to Indian diplomats, this policy is not opportunistic; it is a necessity driven by India''s developmental imperatives and its complex neighborhood borders.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d601', -- Politics
    3,
    6,
    'intermediate',
    'Indian Council on World Affairs',
    'https://example.com/india-multi-alignment',
    '2026-06-30T09:30:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f809',
    'nextjs-app-router-performance-2026',
    'Next.js 16 App Router Optimizes Server Actions for Edge Runtime',
    'The latest Next.js release optimizes edge-side data hydration, slashing first-input delay on lightweight Server Component routes by up to 35%.',
    '["Data payload serialization is now handled concurrently during regional streaming.", "Edge-rendered Server Actions bypass cold-start delays through pre-warmed lambdas.", "Devs get improved tooling to visualize Client vs Server bundle sizes in real-time."]',
    'Vercel has released Next.js 16, introducing a series of internal architectural optimizations designed to reduce cold starts and speed up regional serverless functions.

### Edge Hydration Optimizations
In Next.js 16, the App Router serializes server-component payloads during the streaming phase. This allows the client browser to start parsing interactive layout elements before the full HTML document has finished downloading, preventing page lag.

### Cold-Start Bypass
For Edge functions utilizing Server Actions, Next.js now coordinates with Vercel''s regional router to keep pre-warmed isolates active based on real-time client traffic patterns. This effectively removes the 150ms cold-start latency that previously degraded search and form submittals in remote regions.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d605', -- Technology
    1,
    3,
    'intermediate',
    'Vercel Engineering',
    'https://example.com/nextjs16-performance',
    '2026-06-29T17:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f810',
    'spacex-starship-payload-milestones',
    'SpaceX Starship Achieves Rapid Reusability Flight Cadence',
    'SpaceX successfully caught both the Super Heavy booster and the Starship upper stage in consecutive test launches, paving the way for immediate commercial operations.',
    '["Both stages were caught by the launch tower mechanical arms (''chopsticks'') at Starbase, Texas.", "Turnaround time between booster inspections was reduced to under 48 hours.", "The system is now cleared for its first operational satellite deployment payload."]',
    'SpaceX has achieved a major milestone in space exploration. For two consecutive launches, the spaceflight company successfully launched, recovered, and inspected both stages of its massive Starship launch vehicle in under two days.

### Chopstick Recovery System
The recovery technique relies on the launch tower''s mechanical arms, affectionately nicknamed ''chopsticks.'' As the Super Heavy booster descends, it decelerates to a hover directly beside the tower, which closes its arms to catch the booster by its grid fins. The upper Starship stage performed a similar landing maneuver over the Gulf of Mexico before returning to the pad.

### Mars Logistical Infrastructure
With rapid reusability proved, the marginal cost per launch is projected to fall below $5 million. This shifts the economics of space access, enabling the heavy logistics required for NASA''s Artemis program and Elon Musk''s long-term goal of building a permanent colony on Mars.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d605', -- Technology
    2,
    4,
    'intermediate',
    'SpaceFlight Now',
    'https://example.com/starship-reusability',
    '2026-06-29T06:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f811',
    'rust-compiler-cargo-speedup',
    'Rust Compiler Team Integrates Parallel Frontend by Default',
    'Rust''s package manager, Cargo, now compiles multi-crate workspace projects up to 40% faster by executing code validation checks on multiple cores.',
    '["Parallel frontend is now enabled for all stable rustc toolchains.", "Memory footprint during compilation of large codebases was reduced by 15%.", "Developers can configure thread pool sizes directly in their cargo configs."]',
    'The Rust compiler team has merged a long-awaited optimization that enables a parallelized frontend by default in stable releases. This change dramatically improves compilation speeds, especially on high-core-count workstation processors.

### Parallel Frontend Architecture
Previously, while rustc could parallelize code generation (via LLVM), the frontend phase—responsible for parsing, name resolution, and type checking—ran in a single thread. The new architecture introduces a concurrent query system that checks independent functions and modules across all available CPU cores.

### Impact on Developer Workflows
For massive projects like the Linux kernel or Web browsers, local compile-and-test loops will feel significantly faster, removing a major source of friction in Rust development.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d605', -- Technology
    1,
    3,
    'advanced',
    'Rust Lang Blog',
    'https://example.com/rust-parallel-compiler',
    '2026-06-28T14:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f812',
    'grand-theft-auto-vi-rendering-engine',
    'GTA VI Technical Leaks Reveal Advanced AI-Driven Animation Engine',
    'Rockstar Games'' upcoming title uses localized neural networks to synthesize realistic human movement and reaction behaviors based on environmental stimuli.',
    '["Dynamic muscle deformation and facial reactions are rendered in real-time.", "The engine integrates weather physics, matching pedestrian gaits to wind and surface wetness.", "Network requirements are optimized via a custom local GPU shader pipeline."]',
    'Technical documentation leaked from Rockstar Games reveals how their upcoming title, Grand Theft Auto VI, leverages machine learning to power pedestrian behaviors.

### Neural Motion Synthesis
Traditionally, game characters rely on pre-recorded motion-capture files blended together. GTA VI introduces an animation engine that uses a lightweight neural network to synthesize locomotion in real-time. This allows a pedestrian to adjust their posture, weight distribution, and stride when walking on sand, dodging vehicles, or walking through high winds, avoiding unnatural animations.

### System Optimization
To run this without bottlenecking the CPU, Rockstar developers offloaded the neural network calculations directly onto GPU shaders, co-opting standard ray-tracing hardware to process motion queries.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d608', -- Gaming
    1,
    4,
    'beginner',
    'Eurogamer Tech',
    'https://example.com/gta-vi-tech-leak',
    '2026-06-27T11:30:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f813',
    'davinci-resolve-ai-color-grading',
    'DaVinci Resolve 19.5 Introduces Neural Color Harmony Panels',
    'Blackmagic Design integrates spatial-temporal color matching models, allowing editors to match exposure and tone across complex multi-camera shoots in seconds.',
    '["AI model matches shots across different camera sensors (ARRI, RED, Sony) automatically.", "Neural engine corrects skin tones while leaving ambient environmental lighting untouched.", "Optimized for Apple Silicon M4 Ultra and Nvidia Blackwell platforms."]',
    'Blackmagic Design has announced DaVinci Resolve 19.5, centering its update on new AI-assisted color grading workflows. The feature set aims to eliminate the tedious manual matching previously required for multi-cam shoots.

### Spatial-Temporal Match
The core engine analyzes the high-dynamic-range (HDR) distribution of a reference shot and maps its aesthetic profile to target clips. By recognizing objects and environmental lighting, the model ensures that skin tones remain natural, adjusting only the secondary lighting and color shifts to match the reference look.

### Platform Optimization
Resolve 19.5 is built to run locally, utilizing the dedicated tensor cores of modern GPUs to process high-resolution 8K ProRes files without requiring cloud connectivity.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d609', -- Editing & Creative
    1,
    3,
    'intermediate',
    'Post Magazine',
    'https://example.com/resolve-neural-color',
    '2026-06-26T09:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f814',
    'spaced-repetition-cognitive-science',
    'Neuroscience Confirms Spaced Repetition Triggers Dendritic Spine Growth',
    'A new study maps the structural changes in mouse brains during learning, proving that distributed review sessions trigger long-term synaptic connections.',
    '["Spaced review intervals trigger repeated localized protein synthesis in synapses.", "Cramming shows high initial activation but leads to rapid synaptic pruning within 72 hours.", "The optimal revision intervals are mathematically linked to neural recovery rates."]',
    'A groundbreaking study published in the journal Neuron provides physical evidence of what cognitive scientists have argued for decades: spaced repetition is the most effective way to store information in the human brain.

### The Synaptic Mechanism
Using advanced live-imaging microscopes, researchers tracked dendritic spine growth—the physical sites of connections between neurons—in mice learning complex maze paths. They found that when review sessions were spaced out, dendritic spines grew larger and more stable, cementing the memory.

### The Problem with Cramming
Conversely, when mice were trained in a single, prolonged session (cramming), dendritic spines showed rapid initial growth but collapsed and were pruned within three days. Without periods of rest, the brain does not trigger the protein synthesis required to stabilize the new connection.

These findings validate the algorithms used in spaced repetition software like Anki and KnowledgeOS''s Study Mode.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d610', -- Learning
    2,
    4,
    'intermediate',
    'Neuron Research Journal',
    'https://example.com/synaptic-spaced-repetition',
    '2026-06-25T15:00:00Z'
  ),
  (
    'a1451f28-024e-4f11-9a7f-e274cfb7f815',
    'political-realism-modern-conflicts',
    'Re-evaluating Political Realism in 21st Century Hegemonic Rivalries',
    'International relations scholars argue that classic realism, emphasizing security dilemmas and national interests, best explains the current multipolar tensions in Europe and Asia.',
    '["Thucydides'' trap remains a relevant framework for analyzing the US-China relationship.", "The decline of multilateral treaties points to a return of raw power politics.", "Middle powers are increasingly forming shifting, task-oriented partnerships."]',
    'In the post-Cold War era, many theorists claimed that international trade, international law, and global institutions would render classic power politics obsolete. Today, as geopolitical conflicts flare across continents, scholars are returning to the cold logic of Political Realism.

### The Security Dilemma
Realism posits that because the international system is anarchic (lacking a global government), states must secure their own survival. This leads to the ''security dilemma'': actions one nation takes to defend itself are perceived as threats by neighbors, leading to an arms race.

### Middle Power Pragmatism
Unlike the bipolar era of the Cold War, modern realism is characterized by the pragmatism of middle powers (like India, Turkey, and Brazil). These nations refuse to align with single blocs, choosing instead to negotiate issue-by-issue, forging task-oriented alliances.

For students of political science, understanding these realist dynamics is vital for analyzing the actions of major powers in today''s landscape.',
    'e1451f28-024e-4f11-9a7f-e274cfb7d601', -- Politics
    3,
    5,
    'advanced',
    'Geopolitical Quarterly',
    'https://example.com/realism-modern-conflict',
    '2026-06-24T10:00:00Z'
  );

-- Seed Article Entities
insert into public.article_entities (article_id, entity_type, entity_name) values
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'country', 'Taiwan'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'country', 'Japan'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'country', 'South Korea'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'organization', 'TSMC'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'organization', 'OpenAI'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'person', 'Sam Altman'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'country', 'India'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'organization', 'Ministry of Electronics'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'organization', 'Federal Reserve'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'country', 'United States'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'organization', 'European Union'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'country', 'India'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'country', 'China'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'organization', 'National Ignition Facility'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'country', 'United States'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'organization', 'Delft University'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'organization', 'Princeton University'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'country', 'India'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'organization', 'Quad'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'organization', 'BRICS'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'organization', 'Vercel'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'organization', 'SpaceX'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'person', 'Elon Musk'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'organization', 'Rust Foundation'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'organization', 'Rockstar Games'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'organization', 'Blackmagic Design'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'organization', 'Max Planck Institute'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'country', 'United States'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'country', 'China'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'country', 'India');

-- Seed Article Tags
insert into public.article_tags (article_id, tag_id) values
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'd1451f28-024e-4f11-9a7f-e274cfb7e701'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'd1451f28-024e-4f11-9a7f-e274cfb7e702'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'd1451f28-024e-4f11-9a7f-e274cfb7e703'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'd1451f28-024e-4f11-9a7f-e274cfb7e704'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'd1451f28-024e-4f11-9a7f-e274cfb7e705'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'd1451f28-024e-4f11-9a7f-e274cfb7e706'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'd1451f28-024e-4f11-9a7f-e274cfb7e707'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'd1451f28-024e-4f11-9a7f-e274cfb7e708'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'd1451f28-024e-4f11-9a7f-e274cfb7e701'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'd1451f28-024e-4f11-9a7f-e274cfb7e709'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'd1451f28-024e-4f11-9a7f-e274cfb7e710'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'd1451f28-024e-4f11-9a7f-e274cfb7e711'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'd1451f28-024e-4f11-9a7f-e274cfb7e712'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'd1451f28-024e-4f11-9a7f-e274cfb7e713'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'd1451f28-024e-4f11-9a7f-e274cfb7e714'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'd1451f28-024e-4f11-9a7f-e274cfb7e715'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'd1451f28-024e-4f11-9a7f-e274cfb7e716'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'd1451f28-024e-4f11-9a7f-e274cfb7e717'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'd1451f28-024e-4f11-9a7f-e274cfb7e718'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'd1451f28-024e-4f11-9a7f-e274cfb7e719'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'd1451f28-024e-4f11-9a7f-e274cfb7e720'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'd1451f28-024e-4f11-9a7f-e274cfb7e721'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'd1451f28-024e-4f11-9a7f-e274cfb7e722'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'd1451f28-024e-4f11-9a7f-e274cfb7e723'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'd1451f28-024e-4f11-9a7f-e274cfb7e724'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'd1451f28-024e-4f11-9a7f-e274cfb7e725'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'd1451f28-024e-4f11-9a7f-e274cfb7e720'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'd1451f28-024e-4f11-9a7f-e274cfb7e726'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'd1451f28-024e-4f11-9a7f-e274cfb7e727'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'd1451f28-024e-4f11-9a7f-e274cfb7e703'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'd1451f28-024e-4f11-9a7f-e274cfb7e709'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'd1451f28-024e-4f11-9a7f-e274cfb7e728'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'd1451f28-024e-4f11-9a7f-e274cfb7e729'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'd1451f28-024e-4f11-9a7f-e274cfb7e730'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'd1451f28-024e-4f11-9a7f-e274cfb7e731'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'd1451f28-024e-4f11-9a7f-e274cfb7e732'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'd1451f28-024e-4f11-9a7f-e274cfb7e733'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'd1451f28-024e-4f11-9a7f-e274cfb7e734'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'd1451f28-024e-4f11-9a7f-e274cfb7e735'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'd1451f28-024e-4f11-9a7f-e274cfb7e736'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'd1451f28-024e-4f11-9a7f-e274cfb7e737'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'd1451f28-024e-4f11-9a7f-e274cfb7e738'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'd1451f28-024e-4f11-9a7f-e274cfb7e739'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'd1451f28-024e-4f11-9a7f-e274cfb7e740'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'd1451f28-024e-4f11-9a7f-e274cfb7e741'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'd1451f28-024e-4f11-9a7f-e274cfb7e742'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'd1451f28-024e-4f11-9a7f-e274cfb7e743'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'd1451f28-024e-4f11-9a7f-e274cfb7e744'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'd1451f28-024e-4f11-9a7f-e274cfb7e745'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'd1451f28-024e-4f11-9a7f-e274cfb7e746'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'd1451f28-024e-4f11-9a7f-e274cfb7e747'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'd1451f28-024e-4f11-9a7f-e274cfb7e705'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'd1451f28-024e-4f11-9a7f-e274cfb7e748'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'd1451f28-024e-4f11-9a7f-e274cfb7e749'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'd1451f28-024e-4f11-9a7f-e274cfb7e750'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'd1451f28-024e-4f11-9a7f-e274cfb7e751'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'd1451f28-024e-4f11-9a7f-e274cfb7e752'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'd1451f28-024e-4f11-9a7f-e274cfb7e753'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'd1451f28-024e-4f11-9a7f-e274cfb7e754'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'd1451f28-024e-4f11-9a7f-e274cfb7e703');

-- Seed Related Articles mappings
insert into public.related_articles (article_id, related_article_id) values
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'a1451f28-024e-4f11-9a7f-e274cfb7f802'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f801', 'a1451f28-024e-4f11-9a7f-e274cfb7f803'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'a1451f28-024e-4f11-9a7f-e274cfb7f801'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f802', 'a1451f28-024e-4f11-9a7f-e274cfb7f807'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'a1451f28-024e-4f11-9a7f-e274cfb7f801'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f803', 'a1451f28-024e-4f11-9a7f-e274cfb7f804'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'a1451f28-024e-4f11-9a7f-e274cfb7f803'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f804', 'a1451f28-024e-4f11-9a7f-e274cfb7f805'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'a1451f28-024e-4f11-9a7f-e274cfb7f804'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f805', 'a1451f28-024e-4f11-9a7f-e274cfb7f801'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'a1451f28-024e-4f11-9a7f-e274cfb7f807'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f806', 'a1451f28-024e-4f11-9a7f-e274cfb7f802'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'a1451f28-024e-4f11-9a7f-e274cfb7f806'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f807', 'a1451f28-024e-4f11-9a7f-e274cfb7f801'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'a1451f28-024e-4f11-9a7f-e274cfb7f803'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f808', 'a1451f28-024e-4f11-9a7f-e274cfb7f805'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'a1451f28-024e-4f11-9a7f-e274cfb7f802'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f809', 'a1451f28-024e-4f11-9a7f-e274cfb7f811'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'a1451f28-024e-4f11-9a7f-e274cfb7f806'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f810', 'a1451f28-024e-4f11-9a7f-e274cfb7f809'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'a1451f28-024e-4f11-9a7f-e274cfb7f809'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f811', 'a1451f28-024e-4f11-9a7f-e274cfb7f802'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'a1451f28-024e-4f11-9a7f-e274cfb7f802'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f812', 'a1451f28-024e-4f11-9a7f-e274cfb7f809'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'a1451f28-024e-4f11-9a7f-e274cfb7f809'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f813', 'a1451f28-024e-4f11-9a7f-e274cfb7f811'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'a1451f28-024e-4f11-9a7f-e274cfb7f811'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f814', 'a1451f28-024e-4f11-9a7f-e274cfb7f806'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'a1451f28-024e-4f11-9a7f-e274cfb7f808'),
  ('a1451f28-024e-4f11-9a7f-e274cfb7f815', 'a1451f28-024e-4f11-9a7f-e274cfb7f805');

-- Seed Trending Topics
insert into public.trending_topics (slug, label, mention_count) values
  ('middle-east', 'Middle East', 142),
  ('semiconductor-wars', 'Semiconductor Trade', 98),
  ('openai-gpt5', 'OpenAI GPT-5', 210),
  ('india-digital-rupee', 'India Digital Rupee', 64),
  ('fusion-ignition', 'Fusion Ignition', 51);
