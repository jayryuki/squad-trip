"""add list_name to packing_items

Revision ID: add_list_name_to_packing
Revises: b92d3eb57210
Create Date: 2026-03-15 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_list_name_to_packing"
down_revision: Union[str, Sequence[str], None] = "b92d3eb57210"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "packing_items",
        sa.Column("list_name", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("packing_items", "list_name")
