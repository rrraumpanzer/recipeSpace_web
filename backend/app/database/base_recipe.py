from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
from enum import Enum

class DifficultyLevel(int, Enum):
    VERY_EASY = 1
    EASY = 2
    MEDIUM = 3
    HARD = 4
    VERY_HARD = 5

class RecipeBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    ingredients: List[str] = Field(..., min_items=1)
    instructions: str = Field(..., min_length=20)
    cooking_time: int = Field(..., gt=0, description="Cooking time in minutes")
    difficulty: DifficultyLevel
    servings: int = Field(..., gt=0)
    tags: List[str] = []

class RecipeCreate(RecipeBase):
    image_url: Optional[HttpUrl] = None

class RecipeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    ingredients: Optional[List[str]] = Field(None, min_items=1)
    instructions: Optional[str] = Field(None, min_length=20)
    cooking_time: Optional[int] = Field(None, gt=0)
    difficulty: Optional[DifficultyLevel] = None
    servings: Optional[int] = Field(None, gt=0)
    tags: Optional[List[str]] = None
    image_url: Optional[HttpUrl] = None

class RecipeInDB(RecipeBase):
    id: int
    author_id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    views_count: int = 0

    class Config:
        orm_mode = True