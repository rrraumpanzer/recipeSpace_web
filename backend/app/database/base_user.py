from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing import Annotated, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: Annotated[str, StringConstraints(min_length=3, max_length=50)]
    email: EmailStr

class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]

class UserUpdate(BaseModel):
    username: Optional[Annotated[str, StringConstraints(min_length=3, max_length=50)]] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

class UserInDB(UserBase):
    id: int
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Заменило orm_mode в Pydantic v2