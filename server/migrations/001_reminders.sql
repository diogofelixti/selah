-- Lembrete diário: uma linha por aparelho inscrito (o endpoint de push identifica o aparelho).
create table reminders (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  minutes integer not null check (minutes between 0 and 1439),
  tz text not null,
  lang text not null check (lang in ('pt', 'en')),
  last_sent_on date,
  done_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
