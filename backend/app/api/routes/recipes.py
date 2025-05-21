from fastapi import APIRouter, Depends, HTTPException, status
from app.database.base_recipe import RecipeBase, RecipeCreate, RecipeInDB, RecipeUpdate
from app.database.connection import get_db
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from psycopg2 import IntegrityError
from datetime import datetime
import logging
logger = logging.getLogger(__name__)


recipe_router = APIRouter(
    tags=["Recipe"],
)

#@recipe_router.post("/create", response_model=RecipeInDB, status_code=status.HTTP_201_CREATED)
#async def create_recipe(recipe: RecipeCreate, session = Depends(get_db)) -> dict:
#    """
#    Создание рецепта
#    """
#    try:
#
#            
#    #except IntegrityError:
#        session.rollback()
#        raise HTTPException(
#            status_code=status.HTTP_400_BAD_REQUEST,
#            detail="Recipe already exists"
#        )
#    except Exception as e:
#        session.rollback()
#        raise HTTPException(
#            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#            detail=str(e)
#        )
#    finally:
#        session.close()