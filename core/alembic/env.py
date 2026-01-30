import os
import sys
from logging.config import fileConfig
from dotenv import load_dotenv
from urllib.parse import quote_plus
from sqlalchemy import engine_from_config, pool
from alembic import context

# Load environment variables from .env.local (project root)
# Treat `core/` as the Python/FastAPI project root and load its `.env`
core_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
env_file = os.path.join(core_root, '.env')
if os.path.exists(env_file):
    load_dotenv(env_file, override=True)
else:
    raise FileNotFoundError(f"Required env file not found: {env_file}")

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Read DB URL from environment variables
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_PORT = os.getenv('PG_PORT', '5432')
PG_DB = os.getenv('PG_DB', 'chat_app')
PG_USER = os.getenv('PG_USER', '')
PG_PASSWORD = os.getenv('PG_PASSWORD', '')

# URL-encode user and password to handle special characters (e.g., '@', ':')
if PG_USER:
    _user = quote_plus(PG_USER)
    _pass = quote_plus(PG_PASSWORD) if PG_PASSWORD else ''
    userinfo = f"{_user}:{_pass}@"
else:
    userinfo = ''

db_url = f"postgresql://{userinfo}{PG_HOST}:{PG_PORT}/{PG_DB}"
# ConfigParser in alembic.ini treats '%' as interpolation markers, so escape them
safe_db_url = db_url.replace('%', '%%')
config.set_main_option('sqlalchemy.url', safe_db_url)

# no model metadata is provided (we use raw SQL), so the target_metadata is None
target_metadata = None

# other values from the config, defined by the needs of env.py, can be acquired:
# my_important_option = config.get_main_option("my_important_option")


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
