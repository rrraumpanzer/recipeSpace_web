"""create users table

Revision ID: bf84ee989515
Revises: 
Create Date: 2025-05-23 19:00:08.701576

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf84ee989515'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('username', sa.String, unique=True, index=True),
        sa.Column('email', sa.String, unique=True, index=True),
        sa.Column('password_hash', sa.String),
        sa.Column('bio', sa.String, nullable=True),
        sa.Column('profile_picture', sa.String, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('users')
    pass
