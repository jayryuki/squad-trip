"""add emoji to users

Revision ID: add_emoji_to_users
Revises: adde0a98a15f
Create Date: 2026-03-15 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_emoji_to_users"
down_revision: Union[str, Sequence[str], None] = "adde0a98a15f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add emoji column to users table."""
    op.add_column("users", sa.Column("emoji", sa.String(), nullable=True))


def downgrade() -> None:
    """Remove emoji column from users table."""
    op.drop_column("users", "emoji")
