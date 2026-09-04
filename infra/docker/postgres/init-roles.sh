#!/bin/sh
# Роли разделены заранее: migrator владеет схемой, app_user получает только DML.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE ROLE migrator LOGIN PASSWORD '${MIGRATOR_PASSWORD:-migrator}';
	CREATE ROLE app_user LOGIN PASSWORD '${APP_USER_PASSWORD:-app_user}';
	ALTER DATABASE "$POSTGRES_DB" OWNER TO migrator;
	ALTER SCHEMA public OWNER TO migrator;
	GRANT USAGE ON SCHEMA public TO app_user;
	-- pg-boss создаёт свою схему pgboss
	GRANT CREATE ON DATABASE "$POSTGRES_DB" TO app_user;
EOSQL
