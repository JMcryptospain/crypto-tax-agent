-- CryptoTax EU Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- User profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  country text check (country in ('ES', 'FR', 'DE')),
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Wallet connections
create table public.wallet_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  address text not null,
  chains_detected text[] default '{}',
  label text,
  created_at timestamptz default now() not null
);

alter table public.wallet_connections enable row level security;
create policy "Users can manage own wallets" on public.wallet_connections for all using (auth.uid() = user_id);

-- Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  source text not null check (source in ('wallet', 'csv_binance', 'csv_coinbase')),
  tx_hash text,
  timestamp timestamptz not null,
  type text not null check (type in ('buy', 'sell', 'swap', 'transfer', 'staking_reward', 'airdrop', 'unknown')),
  asset_in text,
  amount_in numeric,
  asset_out text,
  amount_out numeric,
  fee_amount numeric,
  fee_asset text,
  price_eur numeric,
  raw_data jsonb,
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Create index for efficient querying by user and date
create index idx_transactions_user_date on public.transactions (user_id, timestamp);

-- Tax reports
create table public.tax_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  country text not null check (country in ('ES', 'FR', 'DE')),
  tax_year integer not null,
  total_gains_eur numeric default 0,
  total_losses_eur numeric default 0,
  net_taxable_eur numeric default 0,
  tax_owed_eur numeric default 0,
  summary_markdown text,
  optimization_tips jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.tax_reports enable row level security;
create policy "Users can manage own reports" on public.tax_reports for all using (auth.uid() = user_id);
