CREATE TABLE IF NOT EXISTS sports (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  banner_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(20) NOT NULL DEFAULT 'audience',
  club_id BIGINT,
  primary_sport_id BIGINT REFERENCES sports(id),
  secondary_sport_id BIGINT REFERENCES sports(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leagues (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sport_id BIGINT REFERENCES sports(id),
  season VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stadiums (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(80),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  home_team VARCHAR(120) NOT NULL,
  away_team VARCHAR(120) NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  stadium_id BIGINT REFERENCES stadiums(id),
  league_id BIGINT REFERENCES leagues(id),
  club_id BIGINT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  ticket_sale_open_at TIMESTAMPTZ,
  description TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stands (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  stadium_id BIGINT REFERENCES stadiums(id),
  name VARCHAR(1) NOT NULL,
  rows INTEGER NOT NULL,
  seats_per_row INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, name)
);

CREATE TABLE IF NOT EXISTS approvals (
  id BIGSERIAL PRIMARY KEY,
  resource_type VARCHAR(30) NOT NULL,
  resource_id BIGINT NOT NULL,
  submitted_by BIGINT REFERENCES users(id),
  reviewed_by BIGINT REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
