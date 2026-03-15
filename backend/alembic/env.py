from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.core.database import Base
from app.core.config import settings
import app.models.user
import app.models.trip
import app.models.stop
import app.models.itinerary
import app.models.role
import app.models.packing
import app.models.expense
import app.models.outfit
import app.models.moodboard
import app.models.chat
import app.models.poll
import app.models.document
import app.models.safety
import app.models.photo

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("+aiosqlite", ""))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    engine = create_engine(settings.DATABASE_URL.replace("+aiosqlite", ""))
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
