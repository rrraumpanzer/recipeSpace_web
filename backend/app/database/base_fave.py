from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class FavoriteRecipeResponse(BaseModel):
    user_id: int
    recipe_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True