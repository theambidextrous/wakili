"""Add name column to users

Revision ID: 0003_add_name_to_users
Revises: 0002_add_mpesa_payments
Create Date: 2026-02-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_add_name_to_users'
down_revision = '0002_add_mpesa_payments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'name' column to users
    op.add_column('users', sa.Column('name', sa.String(100), nullable=True))

    # Backfill existing users: set name from username with nicer formatting
    # e.g., 'john_doe' -> 'John Doe'
    op.execute(
        """
        UPDATE users
        SET name = initcap(replace(username, '_', ' '))
        WHERE name IS NULL;
        """
    )


def downgrade() -> None:
    op.drop_column('users', 'name')
