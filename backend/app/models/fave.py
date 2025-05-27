from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey 
from sqlalchemy.sql import func
from app.database.connection import Base
from sqlalchemy.orm import relationship

class FavoriteRecipe(Base):
    __tablename__ = "favorite_recipes"

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorite_recipes")
    recipe = relationship("Recipe", back_populates="favorited_by")