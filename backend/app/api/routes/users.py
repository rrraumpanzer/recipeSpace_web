from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
AVATARS_DIR = "static/avatars"
import os
import aiofiles
import uuid
from typing import List
from app.database.base_user import UserBase, UserCreate, UserUpdate, UserInDB
from app.database.base_fave import FavoriteRecipeResponse
from app.database.base_recipe import RecipeInDB
from app.models.user import User
from app.models.fave import FavoriteRecipe
from app.models.recipe import Recipe
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
    user: UserCreate = Depends(UserCreate.as_form), 
    db: Session = Depends(get_db)
):
    """
    Регистрирует нового пользователя.

    Аргументы:
        username: str (min 3, max 50 chars)
        email: str
        password: str (min 8 chars)
        db: Сессия
    
    Возвращает:
        Данные созданного пользователя.
    """
    print("\033[33m DEBUG: \033[0m" + f'Получены данные: {user}')
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

@user_router.get("/{user_id}", response_model=UserInDB)
async def fetch_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Получение данных о пользователе.
    
    Аргументы:
        user_id: Идентификатор пользователя.
        db: Сессия
    
    Возвращает: 
        Данные пользователя.
    """
    print("\033[33m DEBUG: \033[0m" + f'Проверка на наличие пользователя с ID {user_id} в БД.')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@user_router.patch("/update/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int,
    user_data: UserUpdate = Depends(UserUpdate.as_form),
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
    
    for field, value in user_data.model_dump(exclude_unset=True).items():
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
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  
):
    """
    Загрузка нового аватара пользователя.
    
    Аргументы:
        user_id: Идентификатор изменяемого пользователя
        file: Файл полученный из формы
        db: Сессия
        current_user: Словарь с данными аутентифицированного пользователя
    
    Возвращает:
        {"message":"Avatar uploaded!", "path":"Путь к файлу в папке /static"}
    """
    print("\033[33m DEBUG: \033[0m" + f'Смена аватара пользователя с ID {user_id}.')
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print("\033[33m DEBUG: \033[0m" + f'Валидация файла.')
    allowed_extensions = {"jpg", "jpeg", "png"}
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File too large")

    print("\033[33m DEBUG: \033[0m" + f'Генерация нового имени файла.')
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(AVATARS_DIR, new_filename)

    print("\033[33m DEBUG: \033[0m" + f'Асинхронное сохранение файла.')
    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())
        
        if user.profile_picture:
            print("\033[33m DEBUG: \033[0m" + f'Удаление прошлого аватара.')
            old_path = os.path.join(AVATARS_DIR, os.path.basename(user.profile_picture))
            if os.path.exists(old_path):
                os.unlink(old_path)
        print("\033[33m DEBUG: \033[0m" + f'Запись пути к новому аватару в БД.')
        avatar_path = f"/static/avatars/{new_filename}"
        user.profile_picture = avatar_path
        db.commit()
        
        return {"message": "Avatar uploaded!", "path": avatar_path}
    
    except Exception as e:
        if os.path.exists(file_path):
            os.unlink(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@user_router.delete("/delete/{user_id}", response_model=None)
async def delete_user(
    user_id: int, 
    db: Session = Depends(get_db)
    ) -> dict:
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



@user_router.post("/token", status_code=status.HTTP_202_ACCEPTED)
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

@user_router.post("/{user_id}/favorites/{recipe_id}", response_model=FavoriteRecipeResponse, status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    user_id: int, 
    recipe_id: int,
    db: Session = Depends(get_db), 
):
    # Проверяем существование пользователя
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Проверяем существование рецепта
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found"
        )
    
    # Проверяем, не добавлен ли уже рецепт в избранное
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == user_id,
        FavoriteRecipe.recipe_id == recipe_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe already in favorites"
        )
    fav = db.query(FavoriteRecipe).filter(FavoriteRecipe.user_id == user_id, FavoriteRecipe.recipe_id == recipe_id).first()
    # Создаем новую запись
    fav = FavoriteRecipe(user_id=user_id, recipe_id=recipe_id)
    db.add(fav)
    
    # Обновляем счетчик лайков
    recipe.likes_count = (recipe.likes_count or 0) + 1
    
    db.commit()
    db.refresh(fav)
    
    return fav

@user_router.delete("/{user_id}/favorites/{recipe_id}", response_model=None, status_code=status.HTTP_200_OK)
async def delete_from_favorites(
    user_id: int, 
    recipe_id: int,
    db: Session = Depends(get_db), 
):
    # Проверяем существование пользователя
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Проверяем существование рецепта
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found"
        )
    
    # Проверяем наличие связи
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == user_id,
        FavoriteRecipe.recipe_id == recipe_id
    ).first()
    
    if not existing:
            print("\033[33m DEBUG: \033[0m" + f"Связь не найдена")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not in favorites"
            ) 
    db.delete(existing)
    db.commit()
    
    # Обновляем счетчик лайков
    recipe.likes_count = (recipe.likes_count or 0) - 1
    
    db.commit()
    return {"message": f"Связь пользователя {user_id} с рецептом {recipe_id} удалена"}


@user_router.get("/{user_id}/favorites", response_model=list[RecipeInDB])
async def get_favorites(
    user_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    favorites = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return [fav.recipe for fav in favorites]

@user_router.get("/{user_id}/recipes", response_model=list[RecipeInDB])
async def get_created(
    user_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    created = db.query(Recipe).filter(
        Recipe.author_id == user_id
    ).offset(skip).limit(limit).all()
    
    return [item for item in created]

@user_router.get("/{user_id}/favorited/{recipe_id}", response_model=bool)
async def get_is_in_user_favorites(
    user_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    ):
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == user_id,
        FavoriteRecipe.recipe_id == recipe_id
    ).first()
    
    if not existing:
        print("\033[33m DEBUG: \033[0m" + f"Связь не найдена")
        return False
    else:
        return True