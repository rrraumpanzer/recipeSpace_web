from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from app.database.base_recipe import RecipeBase, RecipeCreate, RecipeInDB, RecipeUpdate
from app.database.connection import get_db
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.recipe import Recipe
from app.models.user import User
from app.api.auth import get_current_active_user
from datetime import datetime
from psycopg2 import IntegrityError
import logging
import aiofiles
import uuid
import os
IMAGES_DIR = "static/images"

logger = logging.getLogger(__name__)


recipe_router = APIRouter(
    tags=["Recipe"],
)

@recipe_router.post("/create", response_model=RecipeInDB, status_code=status.HTTP_201_CREATED)
async def create_new_recipe(
    recipe: RecipeCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Создаёт новый рецепт.

    Аргументы:
        recipe: Объект RecipeCreate
            {
            title Строка
            description: Строка [Опционально]
            ingredients: Список строк
            cooking_time_minutes: Число
            difficulty: Число от 1 до 5
            image: Строка - путь к изображнию [Опционально]
            steps: Текст
            author_id: Число - id пользователя
            }
        current_user: Объект User, полученный функцией get_current_active_user
        db: Сессия
    
    Возвращает:
        Данные созданного рецепта.
    """
    print("\033[33m DEBUG: \033[0m" + f'Начало создания нового рецепта: {recipe.title}')
    print("\033[33m DEBUG: \033[0m" + f'Проверка на авторизацию.')
    if current_user == None:
        raise HTTPException(status_code=401, detail="Log in is needed to create a recipe")
    
    print("\033[33m DEBUG: \033[0m" + f'Проверка на попытку создать рецепт от чужого лица или без автора.')
    if current_user.id != recipe.author_id:
        raise HTTPException(status_code=403, detail="Cannot create a recipe using other user as author")
    
    if recipe.author_id == 0:
        raise HTTPException(status_code=403, detail="Cannot create a recipe without an author")
    
    new_recipe = Recipe(
        title=recipe.title,
        description=recipe.description,
        tags=recipe.tags,
        ingredients=recipe.ingredients,
        cooking_time_minutes=recipe.cooking_time_minutes,
        difficulty=recipe.difficulty,
        image=recipe.image,
        steps=recipe.steps,
        author_id=recipe.author_id,
    )
    print("\033[33m DEBUG: \033[0m" + f'Внесение рецепта {recipe.title} в БД.')
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)  # Обновляем объект, чтобы получить ID
    print("\033[33m DEBUG: \033[0m" + f'Новый рецепт "{new_recipe.title}" с ID {new_recipe.id} создан.')
    
    return new_recipe


@recipe_router.get("/{recipe_id}", response_model=RecipeInDB)
async def fetch_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
):
    """
    Получение данных рецепта
    
    Аргументы:
        recipe_id: Идентификатор рецепта
        db: Сессия
    
    Возвращает:
        Данные рецепта
    """
    print("\033[33m DEBUG: \033[0m" + f'Проверка на наличие рецепта с ID {recipe_id} в БД.')
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@recipe_router.patch("/update/{recipe_id}", response_model=RecipeInDB)
async def update_user(
    recipe_id: int,
    recipe_data: RecipeUpdate = Depends(RecipeUpdate.as_form),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Обновление рецепта.
    
    Аргументы:
        recipe_id: Идентификатор рецепта
        user_data: Модель RecipeUpdate
        db: Сессия
        current_user: Словарь с данными аутентифицированного пользователя
    
    Возвращает:
        Обновлённый рецепт.
    """
    print("\033[33m DEBUG: \033[0m" + f'Обновление рецепта с ID {recipe_id}.')
    print("\033[33m DEBUG: \033[0m" + f'Проверка на наличие рецепта с ID {recipe_id} в БД.')
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    print("\033[33m DEBUG: \033[0m" + f'Проверка на попытку изменить чужой рецепт.')
    if current_user.id != recipe.author_id:
        raise HTTPException(status_code=403, detail="Cannot update somebody else's recipe")
    
    print("\033[33m DEBUG: \033[0m" + f'Обновление полей {recipe_data}')
    for field, value in recipe_data.model_dump(exclude_unset=True).items():
        setattr(recipe, field, value)
    db.commit()
    db.refresh(recipe)
    return recipe


@recipe_router.post("/upload-image/{recipe_id}")
async def upload_image(
    recipe_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),  
):
    """
    Загрузка новой обложки рецепта.
    
    Аргументы:
        recipe_id: Идентификатор изменяемого пользователя
        file: Файл полученный из формы
        db: Сессия
        current_user: Словарь с данными аутентифицированного пользователя
    
    Возвращает:
        {"message":"Avatar uploaded!", "path":"Путь к файлу в папке /static"}
    """
    print("\033[33m DEBUG: \033[0m" + f'Смена обложки рецепта с ID {recipe_id}.')
    print("\033[33m DEBUG: \033[0m" + f'Проверка на наличие рецепта с ID {recipe_id} в БД.')
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if current_user.id != recipe.author_id:
        raise HTTPException(status_code=403, detail="Cannot edit somebody else's recipe")
    
    print("\033[33m DEBUG: \033[0m" + f'Валидация файла.')
    allowed_extensions = {"jpg", "jpeg", "png"}
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File too large")

    print("\033[33m DEBUG: \033[0m" + f'Генерация нового имени файла.')
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(IMAGES_DIR, new_filename)

    print("\033[33m DEBUG: \033[0m" + f'Асинхронное сохранение файла.')
    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())
        
        if recipe.image:
            print("\033[33m DEBUG: \033[0m" + f'Удаление прошлой обложки.')
            old_path = os.path.join(IMAGES_DIR, os.path.basename(recipe.image))
            if os.path.exists(old_path):
                os.unlink(old_path)
        print("\033[33m DEBUG: \033[0m" + f'Запись пути к новой обложке в БД.')
        image_path = f"/static/images/{new_filename}"
        recipe.image = image_path
        db.commit()
        
        return {"message": "Image uploaded!", "path": image_path}
    
    except Exception as e:
        if os.path.exists(file_path):
            os.unlink(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@recipe_router.delete("/delete/{recipe_id}", response_model=None)
async def delete_recipe(
    recipe_id: int, 
    db: Session = Depends(get_db)) -> dict:
    """
    Удаление рецепта из базы данных.

    Аргументы: 
        recipe_id: Идентификатор рецепта.
        db: Сессия
    
    Возвращает:
        Сообщение об удалении рецепта с идентификатором.
    """
    try:
        print("\033[33m DEBUG: \033[0m" + f'Начало удаления рецепта ID {recipe_id}')
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            print("\033[33m DEBUG: \033[0m" + f"Рецепт с ID {recipe_id} не найден")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )
        
        db.delete(recipe)
        db.commit()
        
        return {"message": f"Рецепт с ID {recipe_id} удалён"}
            
    except IntegrityError as e:
        db.rollback()
        print("\033[33m DEBUG: \033[0m" + f'Ошибка целостности при удалении рецепта "{recipe.title}" с ID {recipe_id}')
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error occurred"
        )
    except Exception as e:
        db.rollback()
        print("\033[33m DEBUG: \033[0m" + f'Ошибка целостности при удалении рецепта "{recipe.title}" с ID {recipe_id}', exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@recipe_router.get("/", response_model=list[RecipeInDB])
async def fetch_recipes(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Получение списка рецептов с пагинацией
    
    Аргументы:
        skip: Сколько рецептов пропустить
        limit: Сколько рецептов вернуть (максимум 100)
        db: Сессия
    
    Возвращает:
        Список рецептов
    """
    recipes = db.query(Recipe).offset(skip).limit(limit).all()
    return recipes

