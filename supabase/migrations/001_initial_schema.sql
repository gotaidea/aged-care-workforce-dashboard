-- Aged Care Workforce Intelligence Dashboard
-- Initial schema

-- Employment data from ABS Labour Force + AIHW
CREATE TABLE IF NOT EXISTS employment_data (
    id BIGSERIAL PRIMARY KEY,
    period DATE NOT NULL,
    care_type TEXT NOT NULL CHECK (care_type IN ('home_care', 'residential', 'sector_wide')),
    employed_total INTEGER,
    employed_fulltime INTEGER,
    employed_parttime INTEGER,
    employed_casual INTEGER,
    unemployment_rate NUMERIC(5,2),
    participation_rate NUMERIC(5,2),
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period, care_type, source)
);

-- Wage Price Index from ABS
CREATE TABLE IF NOT EXISTS wage_data (
    id BIGSERIAL PRIMARY KEY,
    period DATE NOT NULL,
    industry TEXT NOT NULL,
    wpi_index NUMERIC(8,3),
    wpi_annual_change NUMERIC(5,2),
    source TEXT NOT NULL DEFAULT 'ABS WPI',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period, industry)
);

-- Job advertisement volumes
CREATE TABLE IF NOT EXISTS job_ads (
    id BIGSERIAL PRIMARY KEY,
    period DATE NOT NULL,
    care_type TEXT NOT NULL CHECK (care_type IN ('home_care', 'residential', 'sector_wide')),
    platform TEXT NOT NULL,
    role_category TEXT,
    ad_count INTEGER,
    state TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period, care_type, platform, role_category, state)
);

-- Workforce characteristics from AIHW
CREATE TABLE IF NOT EXISTS workforce_characteristics (
    id BIGSERIAL PRIMARY KEY,
    period DATE NOT NULL,
    care_type TEXT NOT NULL CHECK (care_type IN ('home_care', 'residential', 'sector_wide')),
    metric TEXT NOT NULL,
    value NUMERIC(10,4),
    unit TEXT,
    source TEXT NOT NULL DEFAULT 'AIHW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period, care_type, metric)
);

-- Provider-level data (manual entry v1, agent v2)
CREATE TABLE IF NOT EXISTS provider_data (
    id BIGSERIAL PRIMARY KEY,
    provider_name TEXT NOT NULL,
    abn TEXT,
    care_type TEXT CHECK (care_type IN ('home_care', 'residential', 'both')),
    period DATE NOT NULL,
    headcount INTEGER,
    fte NUMERIC(10,1),
    casual_ratio NUMERIC(5,2),
    turnover_rate NUMERIC(5,2),
    wage_expense_aud BIGINT,
    total_revenue_aud BIGINT,
    wage_pct_revenue NUMERIC(5,2),
    source TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider_name, period)
);

-- News ticker items from RSS feeds
CREATE TABLE IF NOT EXISTS news_items (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    source TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (url)
);

-- Shortage occupation flags from Jobs and Skills Australia
CREATE TABLE IF NOT EXISTS shortage_status (
    id BIGSERIAL PRIMARY KEY,
    period DATE NOT NULL,
    occupation TEXT NOT NULL,
    anzsco_code TEXT,
    care_type TEXT CHECK (care_type IN ('home_care', 'residential', 'sector_wide')),
    shortage_level TEXT,
    source TEXT NOT NULL DEFAULT 'JSA',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (period, occupation)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employment_period ON employment_data (period DESC);
CREATE INDEX IF NOT EXISTS idx_employment_care_type ON employment_data (care_type, period DESC);
CREATE INDEX IF NOT EXISTS idx_wage_period ON wage_data (period DESC);
CREATE INDEX IF NOT EXISTS idx_job_ads_period ON job_ads (period DESC, platform);
CREATE INDEX IF NOT EXISTS idx_workforce_period ON workforce_characteristics (period DESC, care_type);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_period ON provider_data (period DESC, provider_name);

-- Row-level security: read-only for anon users
ALTER TABLE employment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortage_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON employment_data FOR SELECT USING (true);
CREATE POLICY "public read" ON wage_data FOR SELECT USING (true);
CREATE POLICY "public read" ON job_ads FOR SELECT USING (true);
CREATE POLICY "public read" ON workforce_characteristics FOR SELECT USING (true);
CREATE POLICY "public read" ON provider_data FOR SELECT USING (true);
CREATE POLICY "public read" ON news_items FOR SELECT USING (true);
CREATE POLICY "public read" ON shortage_status FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON employment_data
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON wage_data
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON job_ads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workforce_characteristics
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON provider_data
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
