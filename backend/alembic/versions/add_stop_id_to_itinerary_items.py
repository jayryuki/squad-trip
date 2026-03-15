"""add stop_id to itinerary_items

Revision ID: add_stop_id_to_itinerary_items
Revises: add_emoji_to_users
Create Date: 2026-03-15 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_stop_id_to_itinerary_items"
down_revision: Union[str, Sequence[str], None] = "add_emoji_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add stop_id column to itinerary_items table."""
    with op.batch_alter_table("itinerary_items") as batch_op:
        batch_op.add_column(sa.Column("stop_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_itinerary_items_stop_id",
            "stops",
            ["stop_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    """Remove stop_id column from itinerary_items table."""
    with op.batch_alter_table("itinerary_items") as batch_op:
        batch_op.drop_constraint("fk_itinerary_items_stop_id", type_="foreignkey")
        batch_op.drop_column("stop_id")
