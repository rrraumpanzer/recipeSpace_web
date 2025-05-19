from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse, Response
from .database.connection import get_db_connection, close_db_connection 
from sqlalchemy.orm import Session
from typing import List
from .database.base import *
from .api.routes.users import user_router
app = FastAPI()

app.include_router(user_router, prefix="/user")

@app.get('/test')
async def reply():
    return JSONResponse(status_code=200, content={"message":"Test tested testessfully!"})

@app.post("/add_string") 
async def add_string(item: TextItem):
    """
    Тестовый эндпоинт.
    Добавляет переданную строку в базу данных.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Ошибка подключения к базе данных")
    
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO text_table (text) VALUES (%s)", (item.text,)) 
            conn.commit() 
        return JSONResponse(status_code=201, content={"message": "Строка успешно добавлена!"})
    except Exception as e:
        conn.rollback() 
        raise HTTPException(status_code=500, detail=f"Ошибка при добавлении строки: {e}")
    finally:
        await close_db_connection(conn)
        
if __name__ == "app":
    import uvicorn
    uvicorn.run("app.main:app", log_level="debug", reload=True)