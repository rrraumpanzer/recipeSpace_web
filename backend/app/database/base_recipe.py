from datetime import datetime
from typing import List, Optional
from fastapi import Form
from pydantic import BaseModel
import json

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
        title: str = Form(None),
        description: str = Form(None),
        tags: str = Form(None),  # Принимаем как строку JSON
        ingredients: str = Form(None),  # Принимаем как строку JSON
        cooking_time_minutes: int = Form(None),
        difficulty: int = Form(None),
        steps: str = Form(None),
        author_id: int = Form(None)
    ):
        # Парсим JSON строки в списки
        tags_list = json.loads(tags) if tags else None
        ingredients_list = json.loads(ingredients) if ingredients else None

        return cls(
            title=title, 
            description=description, 
            tags=tags_list, 
            ingredients=ingredients_list, 
            cooking_time_minutes=cooking_time_minutes, 
            difficulty=difficulty, 
            steps=steps, 
            author_id=author_id
            )
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    cooking_time_minutes: Optional[int] = None
    difficulty: Optional[int] = None
    steps: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        title: str = Form(None),
        description: str = Form(None),
        tags: str = Form(None),  # Принимаем как строку JSON
        ingredients: str = Form(None),  # Принимаем как строку JSON
        cooking_time_minutes: int = Form(None),
        difficulty: int = Form(None),
        steps: str = Form(None),
    ):
        # Парсим JSON строки в списки
        tags_list = json.loads(tags) if tags else None
        ingredients_list = json.loads(ingredients) if ingredients else None
        
        return cls(
            title=title,
            description=description,
            tags=tags_list,
            ingredients=ingredients_list,
            cooking_time_minutes=cooking_time_minutes,
            difficulty=difficulty,
            steps=steps,
        )

class RecipeFilter(BaseModel):
    skip: int
    limit: int
    tags: list[str]
    max_cooking_time: int
    min_cooking_time: int
    difficulty: int
    ingredients: list[str]



class RecipeInDB(RecipeBase):
    id: int
    likes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True