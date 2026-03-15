"""Add cars table

Revision ID: add_cars_table
Revises: add_stop_id_to_itinerary_items
Create Date: 2026-03-15 12:02:36.694322

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_cars_table"
down_revision: Union[str, Sequence[str], None] = "add_stop_id_to_itinerary_items"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cars",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("driver_user_id", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(), nullable=False),
        sa.Column("make", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("total_seats", sa.Integer(), nullable=True),
        sa.Column("passenger_ids", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cars_id"), "cars", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cars_id"), table_name="cars")
    op.drop_table("cars")
