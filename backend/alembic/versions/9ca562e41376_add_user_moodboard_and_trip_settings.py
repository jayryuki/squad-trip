"""add user_moodboard and trip_settings

Revision ID: 9ca562e41376
Revises: add_packed_status_to_packing
Create Date: 2026-03-15 22:15:21.549695

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9ca562e41376"
down_revision: Union[str, Sequence[str], None] = "add_packed_status_to_packing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "trip_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("moodboard_thumbnail_threshold", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trip_id"),
    )
    op.create_index(op.f("ix_trip_settings_id"), "trip_settings", ["id"], unique=False)
    op.create_table(
        "user_moodboards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("items", sa.JSON(), nullable=True),
        sa.Column("thumbnail_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_moodboards_id"), "user_moodboards", ["id"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_user_moodboards_id"), table_name="user_moodboards")
    op.drop_table("user_moodboards")
    op.drop_index(op.f("ix_trip_settings_id"), table_name="trip_settings")
    op.drop_table("trip_settings")
