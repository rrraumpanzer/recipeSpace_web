from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)  # Хеш пароля
    bio = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True) #Путь к изображению в духе "/static/avatars/wseluiho782yh389hniult2h.png"
    is_active = Column(Boolean, default=True)
    favorite_recipes = relationship("FavoriteRecipe", back_populates="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())