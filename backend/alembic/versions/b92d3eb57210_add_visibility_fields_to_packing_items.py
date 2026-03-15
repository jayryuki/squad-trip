"""add visibility fields to packing_items

Revision ID: b92d3eb57210
Revises: add_cars_table
Create Date: 2026-03-15 14:00:55.223846

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b92d3eb57210"
down_revision: Union[str, Sequence[str], None] = "add_cars_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "packing_items",
        sa.Column("visibility", sa.String(), nullable=True, server_default="public"),
    )
    op.add_column(
        "packing_items",
        sa.Column("visible_to", sa.String(), nullable=True, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("packing_items", "visible_to")
    op.drop_column("packing_items", "visibility")
