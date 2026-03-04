"""rename metadata column to catalog_metadata

Revision ID: e06e3c1ce1ab
Revises: 5729719d7b25
Create Date: 2026-03-04 10:00:05.560563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e06e3c1ce1ab'
down_revision: Union[str, None] = '5729719d7b25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('catalog_entries', 'metadata', new_column_name='catalog_metadata')


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('catalog_entries', 'catalog_metadata', new_column_name='metadata')
