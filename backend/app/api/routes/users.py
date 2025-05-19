from fastapi import APIRouter, Depends, HTTPException, status
from app.database.base_user import UserBase, UserCreate, UserUpdate, UserInDB
from app.database.connection import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from psycopg2 import IntegrityError
from datetime import datetime
import logging
logger = logging.getLogger(__name__)


user_router = APIRouter(
    tags=["User"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@user_router.post("/signup", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def sign_user_up(user: UserCreate, session = Depends(get_db)) -> dict:
    """
    Регистрация пользователя
    """
    try:
        print("\033[32mINFO: \033[0m" + f'Начало регистрации пользователя: {user.username}')
        # Проверяем, что пользователь с таким email или username не существует
        with session.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM users WHERE email = %s OR username = %s",
                (user.email, user.username)
            )
            if cursor.fetchone():
                logger.warning(f"Пользователь уже существует: {user.email} или {user.username}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email or username already registered"
                )
            
            hashed_password = pwd_context.hash(user.password)
            
            print("\033[32mINFO: \033[0m" + f'Создание пользователя: {user.username}')
            created_at = updated_at = datetime.utcnow()
            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, email, bio, profile_picture, is_active, created_at, updated_at
                """,
                (user.username, user.email, hashed_password, created_at, updated_at)
            )
            new_user = cursor.fetchone()
            
            session.commit()   #<------- ВАЖНО ВАЖНО ВАЖНО КАК Я МОГ ЗАБЫТЬ КОММИТ?!!

            # Преобразуем результат в словарь
            columns = [desc[0] for desc in cursor.description]
            user_dict = dict(zip(columns, new_user))
            
            return user_dict
            
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        session.close()