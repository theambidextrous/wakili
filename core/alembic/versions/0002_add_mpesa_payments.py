"""Add mpesa_payments table for M-Pesa transaction logging

Revision ID: 0002_add_mpesa_payments
Revises: 0001_initial
Create Date: 2026-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0002_add_mpesa_payments'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create mpesa_payments table
    op.create_table(
        'mpesa_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('amount_kes', sa.Numeric(10, 2), nullable=True),
        sa.Column('amount_credits', sa.Numeric(12, 3), nullable=True),
        sa.Column('checkout_request_id', sa.String(255), nullable=False, unique=True),
        sa.Column('mpesa_receipt_number', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='initiated'),
        sa.Column('callback_response', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_mpesa_payments_user_id'),
    )
    
    # Create indexes for faster lookups
    op.create_index('idx_mpesa_payments_user_id', 'mpesa_payments', ['user_id'])
    op.create_index('idx_mpesa_payments_checkout_request_id', 'mpesa_payments', ['checkout_request_id'])
    op.create_index('idx_mpesa_payments_phone_number', 'mpesa_payments', ['phone_number'])
    op.create_index('idx_mpesa_payments_status', 'mpesa_payments', ['status'])
    op.create_index('idx_mpesa_payments_created_at', 'mpesa_payments', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_mpesa_payments_created_at', table_name='mpesa_payments')
    op.drop_index('idx_mpesa_payments_status', table_name='mpesa_payments')
    op.drop_index('idx_mpesa_payments_phone_number', table_name='mpesa_payments')
    op.drop_index('idx_mpesa_payments_checkout_request_id', table_name='mpesa_payments')
    op.drop_index('idx_mpesa_payments_user_id', table_name='mpesa_payments')
    
    # Drop table
    op.drop_table('mpesa_payments')
