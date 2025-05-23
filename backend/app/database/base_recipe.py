from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[str]
    cooking_time_minutes: int
    difficulty: int
    image: Optional[str] = None
    steps: str
    author_id: int


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    cooking_time_minutes: Optional[int] = None
    difficulty: Optional[int] = None
    image: Optional[str] = None
    steps: Optional[str] = None


class RecipeInDB(RecipeBase):
    id: int
    likes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True