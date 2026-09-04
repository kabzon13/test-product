-- module:oauth

ALTER TABLE users ADD COLUMN provider text;
ALTER TABLE users ADD COLUMN provider_account_id text;

CREATE INDEX users_provider_account_idx ON users (provider, provider_account_id);
