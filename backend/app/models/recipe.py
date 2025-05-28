from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, SmallInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base
from sqlalchemy.dialects.postgresql import ARRAY
class Recipe(Base):
    __tablename__ = 'recipes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    tags = Column(ARRAY(String), nullable=False)
    ingredients = Column(ARRAY(String), nullable=False)
    cooking_time_minutes = Column(Integer, nullable=False)
    difficulty = Column(SmallInteger, nullable=False)
    image = Column(String(255))
    steps = Column(Text)  #Использую markdown
    favorited_by = relationship("FavoriteRecipe", back_populates="recipe")

    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    likes_count = Column(Integer, default=0)
    
    
    