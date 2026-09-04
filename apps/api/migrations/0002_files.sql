-- module:storage

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  size bigint,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX files_user_id_idx ON files (user_id);
