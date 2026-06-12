-- 1. Main User Streak Configuration Table
CREATE TABLE IF NOT EXISTS app_user_streaks (
    streak_id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL,
    activity_identifier VARCHAR(128) NOT NULL,
    local_scheduled_time TIME NOT NULL,
    target_iana_timezone VARCHAR(64) NOT NULL,
    tally_current_streak INT DEFAULT 0 NOT NULL,
    tally_max_streak INT DEFAULT 0 NOT NULL,
    custom_anchor_paragraph TEXT,
    selected_archetype VARCHAR(32) DEFAULT 'PROFESSIONAL' NOT NULL
);

-- 2. Granular Daily Activity Verification Log
CREATE TABLE IF NOT EXISTS customer_activity_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    streak_id VARCHAR(64) REFERENCES app_user_streaks(streak_id) ON DELETE CASCADE,
    resolved_calendar_date DATE NOT NULL,
    server_utc_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    execution_state VARCHAR(32) NOT NULL, -- 'COMPLETED', 'FROZEN'
    -- Hard safety block preventing double insertion records per calendar day
    CONSTRAINT unique_streak_per_day UNIQUE (streak_id, resolved_calendar_date)
);

-- 3. Guarded Asset Inventory Vault (Streak Freezes)
CREATE TABLE IF NOT EXISTS account_inventory_vault (
    account_id VARCHAR(64) PRIMARY KEY,
    available_freeze_tokens INT DEFAULT 1 NOT NULL,
    -- Database integrity guardrail preventing negative asset depletion loops
    CONSTRAINT asset_floor_limit CHECK (available_freeze_tokens >= 0)
);

-- 4. Shared Group Freeze Token Pool Vault
CREATE TABLE IF NOT EXISTS group_inventory_vault (
    group_id VARCHAR(64) PRIMARY KEY,
    available_freeze_tokens INT DEFAULT 0 NOT NULL,
    CONSTRAINT group_asset_floor_limit CHECK (available_freeze_tokens >= 0)
);

-- 5. User Group Membership Mapping
CREATE TABLE IF NOT EXISTS group_memberships (
    account_id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES group_inventory_vault(group_id) ON DELETE CASCADE
);

-- 6. Shared Group Freeze Token Consumption Audit Log
CREATE TABLE IF NOT EXISTS group_freeze_audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES group_inventory_vault(group_id) ON DELETE CASCADE,
    account_id VARCHAR(64) NOT NULL,
    streak_id VARCHAR(64) NOT NULL REFERENCES app_user_streaks(streak_id) ON DELETE CASCADE,
    resolved_calendar_date DATE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_group_streak_date UNIQUE (group_id, streak_id, resolved_calendar_date)
);
