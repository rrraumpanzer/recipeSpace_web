from datetime import datetime
from pydantic import BaseModel
from typing import Optional


#class FavoriteRecipeBase(BaseModel):
#    user_id: int
#    recipe_id: int


#class FavoriteRecipeCreate(FavoriteRecipeBase):
#    pass

#class FavoriteRecipeInDB(BaseModel):
#    user_id: int
#    recipe_id: int
#    created_at: datetime#
#
#    user: Optional[UserInDB] = None
#    recipe: Optional[RecipeInDB] = None
#
#    class Config:
#        from_attributes = True  # или ранее использовавшееся название: orm_mode = True