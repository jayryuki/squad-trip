"""add packed_status to packing_items

Revision ID: add_packed_status_to_packing
Revises: add_list_name_to_packing
Create Date: 2026-03-15 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_packed_status_to_packing"
down_revision: Union[str, Sequence[str], None] = "add_list_name_to_packing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "packing_items",
        sa.Column("packed_status", sa.String(), nullable=True, server_default="{}"),
    )


def downgrade() -> None:
    op.drop_column("packing_items", "packed_status")
