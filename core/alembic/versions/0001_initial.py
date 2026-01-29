"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-01-29 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # schema_migrations (if using raw SQL runner, but Alembic tracks versions automatically)
    op.execute("""
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('email', sa.String(100), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email_verified', sa.Boolean, server_default=sa.text('FALSE')),
        sa.Column('email_verification_code', sa.String(6)),
        sa.Column('email_verification_expires_at', sa.TIMESTAMP),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('FALSE')),
    )

    # user_sessions
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('token', sa.String(255), nullable=False, unique=True),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('expires_at', sa.TIMESTAMP, nullable=False),
        sa.Column('is_valid', sa.Boolean, server_default=sa.text('TRUE')),
    )

    # chat_history
    op.create_table(
        'chat_history',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('prompt', sa.Text, nullable=False),
        sa.Column('response', sa.Text, nullable=False),
        sa.Column('sources', sa.JSON),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # user_credits
    op.create_table(
        'user_credits',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('amount', sa.Numeric(12,3), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.TIMESTAMP, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('TRUE')),
    )

    # credit_transactions
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('transaction_type', sa.String(20), nullable=False),
        sa.Column('amount', sa.Numeric(12,3), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # indexes
    op.create_index('idx_users_username', 'users', ['username'], unique=False)
    op.create_index('idx_users_email', 'users', ['email'], unique=False)
    op.create_index('idx_sessions_token', 'user_sessions', ['token'], unique=False)
    op.create_index('idx_sessions_user_id', 'user_sessions', ['user_id'], unique=False)
    op.create_index('idx_chat_history_user_id', 'chat_history', ['user_id'], unique=False)
    op.create_index('idx_user_credits_user_id', 'user_credits', ['user_id'], unique=False)
    op.create_index('idx_user_credits_expires', 'user_credits', ['expires_at'], unique=False)
    op.create_index('idx_credit_transactions_user_id', 'credit_transactions', ['user_id'], unique=False)
    op.create_index('idx_credit_transactions_created', 'credit_transactions', ['created_at'], unique=False)


def downgrade():
    op.drop_index('idx_credit_transactions_created', table_name='credit_transactions')
    op.drop_index('idx_credit_transactions_user_id', table_name='credit_transactions')
    op.drop_index('idx_user_credits_expires', table_name='user_credits')
    op.drop_index('idx_user_credits_user_id', table_name='user_credits')
    op.drop_index('idx_chat_history_user_id', table_name='chat_history')
    op.drop_index('idx_sessions_user_id', table_name='user_sessions')
    op.drop_index('idx_sessions_token', table_name='user_sessions')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_username', table_name='users')

    op.drop_table('credit_transactions')
    op.drop_table('user_credits')
    op.drop_table('chat_history')
    op.drop_table('user_sessions')
    op.drop_table('users')
    op.execute("DROP TABLE IF EXISTS schema_migrations;")
