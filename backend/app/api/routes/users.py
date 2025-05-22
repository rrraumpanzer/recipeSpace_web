from fastapi import APIRouter, Depends, HTTPException, status
from app.database.base_user import UserBase, UserCreate, UserUpdate, UserInDB
from app.models.user import User
from app.database.connection import get_db
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from psycopg2 import IntegrityError
from datetime import datetime, timedelta
import logging
from app.api.auth import (
    create_access_token,
    get_current_user,
    get_current_active_user,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    pwd_context
)
logger = logging.getLogger(__name__)


user_router = APIRouter(
    tags=["User"],
)

@user_router.post("/signup", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def sign_user_up(user: UserCreate, db: Session = Depends(get_db)):
    # Проверка существования пользователя
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    # Хеширование пароля
    hashed_password = pwd_context.hash(user.password)
    created_at = updated_at = datetime.utcnow()
    # Создание пользователя
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Обновляем объект, чтобы получить ID
    
    return new_user






@user_router.patch("/update/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Проверяем, что пользователь обновляет себя
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Обновляем только переданные поля
    for field, value in user_data.dict(exclude_unset=True).items():
        if field == "password":
            user.password_hash = pwd_context.hash(value)
        else:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


@user_router.delete("/delete/{user_id}", response_model=None)
async def delete_user(user_id: int, db: Session = Depends(get_db)) -> dict:
    """
    Удаление аккаунта пользователя из базы данных
    """
    try:
        logger.debug(f'Начало удаления пользователя с ID: {user_id}')
        
        # Получаем пользователя
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            logger.warning(f"Пользователь не найден: ID {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Удаляем пользователя
        db.delete(user)
        db.commit()
        
        return {"message": f"Пользователь с ID {user_id} удалён"}
            
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Ошибка целостности при удалении пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error occurred"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка при удалении пользователя: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )



@user_router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Ищем пользователя в базе данных
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем пароль
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@user_router.get("/me/", response_model=UserInDB)
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    return current_user