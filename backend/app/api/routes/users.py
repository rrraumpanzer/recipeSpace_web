from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
AVATARS_DIR = "static/avatars"
import os
import uuid
from app.database.base_user import UserBase, UserCreate, UserUpdate, UserInDB
from app.models.user import User
from app.database.connection import get_db
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from psycopg2 import IntegrityError
from datetime import datetime, timedelta

from app.api.auth import (
    create_access_token,
    get_current_user,
    get_current_active_user,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    pwd_context
)

user_router = APIRouter(
    tags=["User"],
)

@user_router.post("/signup", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def sign_user_up(
    user: UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Регистрирует нового пользователя.

    Аргументы:
        user: Модель UserCreate - username, email, password
        db: Сессия
    
    Возвращает:
        Данные созданного пользователя.
    """
    print("\033[33m DEBUG: \033[0m" + f'Начало создания нового пользователя: {user.username}')
    print("\033[33m DEBUG: \033[0m" + f'Проверка существование пользователя {user.username} и почты {user.email}')
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
    )
    print("\033[33m DEBUG: \033[0m" + f'Внесение пользователя {user.username} в БД.')
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Обновляем объект, чтобы получить ID
    print("\033[33m DEBUG: \033[0m" + f'Новый пользователь с ID {new_user.id} создан.')
    
    return new_user


@user_router.patch("/update/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Обновление данных о пользователе.
    
    Аргументы:
        user_id: Идентификатор пользователя
        user_data: Модель UserUpdate - username, email, bio, profile_picture
        db: Сессия
        current_user: Словарь с данными аутентифицированного пользователя
    
    Возвращает:
        Обновлённые данные пользователя.
    """
    print("\033[33m DEBUG: \033[0m" + f'Обновление пользователя с ID {user_id}.')
    print("\033[33m DEBUG: \033[0m" + f'Проверка на попытку изменить другого пользователя.')
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user")
    
    print("\033[33m DEBUG: \033[0m" + f'Проверка на наличие пользователя с ID {user_id} в БД.')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for field, value in user_data.dict(exclude_unset=True).items():
        if field == "password":
            user.password_hash = pwd_context.hash(value)
        else:
            setattr(user, field, value)
    print("\033[33m DEBUG: \033[0m" + f'Обновление полей {user_data}')
    db.commit()
    db.refresh(user)
    return user

@user_router.post("/upload-avatar/{user_id}")
async def upload_avatar(
    user_id: int,
    user_data: UserUpdate, 
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  
):
    
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Генерируем уникальное имя файла
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(AVATARS_DIR, new_filename)

    # Сохраняем файл на сервер
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Обновляем путь в БД (здесь должна быть логика обновления записи пользователя)
    # Например:
    # db.query(User).filter(User.id == user_id).update({"avatar_path": f"/static/avatars/{new_filename}"})
    # db.commit()

    return {"message": "Avatar uploaded!", "path": f"/static/avatars/{new_filename}"}

@user_router.delete("/delete/{user_id}", response_model=None)
async def delete_user(user_id: int, db: Session = Depends(get_db)) -> dict:
    """
    Удаление аккаунта пользователя из базы данных.

    Аргументы: 
        user_id: Идентификатор пользователя.
        db: Сессия
    
    Возвращает:
        Сообщение об удалении пользователя с идентификатором.
    """
    try:
        print("\033[33m DEBUG: \033[0m" + f'Начало удаления пользователя с ID {user_id}')
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            print("\033[33m DEBUG: \033[0m" + f"Пользователь с ID {user_id} не найден")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        db.delete(user)
        db.commit()
        
        return {"message": f"Пользователь с ID {user_id} удалён"}
            
    except IntegrityError as e:
        db.rollback()
        print("\033[33m DEBUG: \033[0m" + f"Ошибка целостности при удалении пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error occurred"
        )
    except Exception as e:
        db.rollback()
        print("\033[33m DEBUG: \033[0m" + f"Ошибка при удалении пользователя: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )



@user_router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Аутентификация пользователя по паролю

    Аргументы:
        form_data: Содержимое формы входа - username, password
        db: Сессия
    
    Возвращает:
        Сгенерированный токен в формате {"access_token", "token_type"}
    """
    
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