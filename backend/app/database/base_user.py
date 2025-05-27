from fastapi import Form
from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing import Annotated, Optional
from datetime import datetime
from typing import List

class UserBase(BaseModel):
    username: Annotated[str, StringConstraints(min_length=3, max_length=50)]
    email: str

class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]

    @classmethod
    def as_form(
        cls,
        username: str = Form(...),
        email: str = Form(...),
        password: str = Form(...)
    ):
        return cls(username=username, email=email, password=password)

class UserUpdate(BaseModel):
    username: Optional[Annotated[str, StringConstraints(min_length=3, max_length=50)]] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        username: str = Form(...),
        email: str = Form(...),
        bio: str = Form(...)
    ):
        return cls(username=username, email=email, bio=bio)

class UserInDB(UserBase):
    id: int
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True