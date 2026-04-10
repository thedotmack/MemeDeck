-- Partners/referrers table
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  partner_code TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'default',
  -- Use BIGINT for lamports precision - no decimals for Solana amounts
  total_earnings_lamports BIGINT DEFAULT 0,
  total_claimed_lamports BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referral relationships
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES partners(id),
  referred_wallet_address TEXT UNIQUE NOT NULL,
  referral_code TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(referred_wallet_address)
);

-- Fee transactions for audit trail - ALL amounts in lamports for precision
CREATE TABLE fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  referrer_id UUID REFERENCES partners(id),
  -- All amounts stored as BIGINT lamports - no floating point precision loss
  trade_amount_lamports BIGINT NOT NULL,
  platform_fee_lamports BIGINT NOT NULL,
  referrer_share_lamports BIGINT DEFAULT 0,
  user_discount_lamports BIGINT DEFAULT 0,
  tier TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Constraint to ensure precision integrity
  CONSTRAINT fee_calculation_integrity CHECK (
    platform_fee_lamports >= referrer_share_lamports + user_discount_lamports - referrer_share_lamports
  )
);

-- Referrer earnings claims - amounts in lamports
CREATE TABLE earnings_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  amount_lamports BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_wallet ON referrals(referred_wallet_address);
CREATE INDEX idx_fee_transactions_trade ON fee_transactions(trade_id);
CREATE INDEX idx_fee_transactions_referrer ON fee_transactions(referrer_id);
CREATE INDEX idx_partners_code ON partners(partner_code);
CREATE INDEX idx_partners_wallet ON partners(wallet_address);