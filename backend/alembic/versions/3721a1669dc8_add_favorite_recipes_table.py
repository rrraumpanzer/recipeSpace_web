"""Add favorite recipes table

Revision ID: 3721a1669dc8
Revises: 4db06e232c7e
Create Date: 2025-05-26 20:01:34.137113

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3721a1669dc8'
down_revision: Union[str, None] = '4db06e232c7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Создание таблицы favorite_recipes
    op.create_table(
        'favorite_recipes',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'recipe_id')
    )
    
    # Добавление отношения в таблицу users
    op.add_column('users', sa.Column('favorite_recipes', sa.Integer(), nullable=True))
    
    # Добавление отношения в таблицу recipes
    op.add_column('recipes', sa.Column('favorited_by', sa.Integer(), nullable=True))


def downgrade():
    # Удаление отношений
    op.drop_column('recipes', 'favorited_by')
    op.drop_column('users', 'favorite_recipes')
    
    # Удаление таблицы favorite_recipes
    op.drop_table('favorite_recipes')
