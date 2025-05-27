from datetime import datetime
from typing import List, Optional
from fastapi import Form
from pydantic import BaseModel

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str]
    ingredients: List[str]
    cooking_time_minutes: int
    difficulty: int
    image: Optional[str] = None
    steps: str
    author_id: int
    
    


class RecipeCreate(RecipeBase):

    @classmethod
    def as_form(
        cls,
        title: str = Form(...),
        description: str = Form(...),
        tags: List[str] = Form(...),
        ingredients: List[str] = Form(...),
        cooking_time_minutes: int = Form(...),
        difficulty: int = Form(...),
        steps: str = Form(...),
        author_id: int = Form(...)
    ):
        return cls(title=title, description=description, tags=tags, ingredients=ingredients, cooking_time_minutes=cooking_time_minutes, difficulty=difficulty, steps=steps, author_id=author_id)
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    cooking_time_minutes: Optional[int] = None
    difficulty: Optional[int] = None
    image: Optional[str] = None
    steps: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        title: str = Form(...),
        description: str = Form(...),
        tags: List[str] = Form(...),
        ingredients: List[str] = Form(...),
        cooking_time_minutes: int = Form(...),
        difficulty: int = Form(...),
        steps: str = Form(...) 
    ):
        return cls(title=title, description=description, tags=tags, ingredients=ingredients, cooking_time_minutes=cooking_time_minutes, difficulty=difficulty, steps=steps)


class RecipeInDB(RecipeBase):
    id: int
    likes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True