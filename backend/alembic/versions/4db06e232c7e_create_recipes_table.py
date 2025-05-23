"""create recipes table

Revision ID: 4db06e232c7e
Revises: bf84ee989515
Create Date: 2025-05-23 20:32:09.392880

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4db06e232c7e'
down_revision: Union[str, None] = 'bf84ee989515'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'recipes',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('title', sa.String(100)),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('ingridients', sa.ARRAY(sa.String)),
        sa.Column('cooking_time_minutes', sa.Integer),
        sa.Column('difficulty', sa.SmallInteger),
        sa.Column('image', sa.String(255), nullable=True),
        sa.Column('steps', sa.Text),
        sa.Column('author_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('likes_count', sa.Integer, default=0),

        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("recipes")
    pass
