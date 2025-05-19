from psycopg2 import connect, OperationalError
from dotenv import load_dotenv
import os
 
load_dotenv()

async def get_db_connection():
    """
    Асинхронная функция для получения соединения с базой данных.
    """
    try:
        conn = connect(
            database="recipespace_database",
            user="web_rsp_service",
            password=os.environ.get('DB_PASSWORD'),
            host="localhost",
            port="5432"
        )
        return conn
    except OperationalError as e:
        print(f"Ошибка подключения к базе данных: {e}")
        return None

async def close_db_connection(conn):
    """
    Асинхронная функция для закрытия соединения с базой данных.
    """
    if conn:
        conn.close()

async def get_db():
    """
    Асинхронная функция, для открытия и автоматического закрытия соединения с базой данных.
    """
    conn = await get_db_connection()
    try:
        yield conn
    finally:
        await close_db_connection(conn)