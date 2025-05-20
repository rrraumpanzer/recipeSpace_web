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
            
            session.commit()

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





@user_router.patch("/update/{user_id}", response_model=UserInDB)
async def update_user(user_id: int, user_data: UserUpdate, session = Depends(get_db)) -> dict:
    """
    Обновление данных пользователя
    """
    try:
        print("\033[33mDEBUG: \033[0m" + f'Начало обновления пользователя с ID: {user_id}')
        
        with session.cursor() as cursor:
            # Проверяем существование пользователя
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cursor.fetchone():
                logger.warning(f"Пользователь не найден: ID {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Собираем поля для обновления
            print("\033[33mDEBUG: \033[0m" + f'Сбор полей для обновления пользователя')
            update_fields = {}
            if user_data.username is not None:
                update_fields['username'] = user_data.username
            if user_data.email is not None:
                update_fields['email'] = user_data.email
            if user_data.bio is not None:
                update_fields['bio'] = user_data.bio
            if user_data.profile_picture is not None:
                update_fields['profile_picture'] = user_data.profile_picture
            
            # Если нет полей для обновления
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No data provided for update"
                )
            print("\033[33mDEBUG: \033[0m" + f'Поля для обновления: {update_fields}')
            # Проверяем уникальность email и username, если они обновляются
            if 'email' in update_fields or 'username' in update_fields:
                cursor.execute(
                    "SELECT id FROM users WHERE (email = %s OR username = %s) AND id != %s",
                    (update_fields.get('email', ''), update_fields.get('username', ''), user_id)
                )
                if cursor.fetchone():
                    logger.warning(f"Конфликт данных при обновлении пользователя: ID {user_id}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email or username already registered by another user"
                    )
            
            # Формируем SQL запрос для обновления
            set_clause = ", ".join([f"{field} = %s" for field in update_fields.keys()])
            values = list(update_fields.values())
            print("\033[33mDEBUG: \033[0m" + f'set_clause имеет вид: {set_clause}')
            updated_at = datetime.utcnow()
            cursor.execute(
                f"""
                UPDATE users
                SET {set_clause}, updated_at = %s
                WHERE id = %s
                RETURNING id, username, email, bio, profile_picture, is_active, created_at, updated_at
                """,
                tuple(values) + (updated_at, user_id)
            )
            
            updated_user = cursor.fetchone()
            session.commit()
            
            # Преобразуем результат в словарь
            columns = [desc[0] for desc in cursor.description]
            user_dict = dict(zip(columns, updated_user))
            
            return user_dict
            
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error occurred"
        )
    except Exception as e:
        session.rollback()
        logger.error(f"Ошибка при обновлении пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        session.close()


@user_router.delete("/delete/{user_id}", response_model=None)
async def delete_user(user_id: int, session = Depends(get_db)) -> dict:
    """
    Удаление аккаута пользователя из базы данных
    """
    try:
        print("\033[33mDEBUG: \033[0m" + f'Начало удаления пользователя с ID: {user_id}')
        
        with session.cursor() as cursor:
            # Проверяем существование пользователя
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if user is None:
                logger.warning(f"Пользователь не найден: ID {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Удаляем пользователя
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            session.commit()
            
            return {"message": f"Пользователь с ID {user_id} удалён"}
            
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error occurred"
        )
    except Exception as e:
        session.rollback()
        logger.error(f"Ошибка при удалении пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        session.close()