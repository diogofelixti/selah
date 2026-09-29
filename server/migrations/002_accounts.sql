-- Contas (login com Google), sessões e o documento de sincronização de cada pessoa.
create table users (
  id uuid primary key default gen_random_uuid(),
  google_sub text not null unique,
  email text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Só o hash SHA-256 do token fica no banco.
create table sessions (
  token_hash bytea primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
create index sessions_user on sessions (user_id);

create table sync_docs (
  user_id uuid primary key references users (id) on delete cascade,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
