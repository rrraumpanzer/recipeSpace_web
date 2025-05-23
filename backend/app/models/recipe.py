from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, ARRAY, SmallInteger
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Recipe(Base):
    __tablename__ = 'recipes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    ingredients = Column(ARRAY(String), nullable=False)
    cooking_time = Column(Integer, nullable=False)
    difficulty = Column(SmallInteger, nullable=False)
    image = Column(String(255))
    steps = Column(Text)  #Использую markdown

    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    likes_count = Column(Integer, default=0)
    
    
    