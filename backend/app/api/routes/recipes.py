from fastapi import APIRouter, Depends, HTTPException, status
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

@recipe_router.patch("/update/{recipe_id}", response_model=RecipeInDB)
async def update_user(
    recipe_id: int,
    recipe_data: RecipeUpdate,
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

