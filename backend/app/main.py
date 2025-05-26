from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .api.routes.users import user_router
from .api.routes.recipes import recipe_router
import os
import logging
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Или конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.DEBUG,  # Уровень логирования (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # Формат сообщения
    handlers=[
        logging.FileHandler("app.log"),  # Запись в файл
        logging.StreamHandler()  # Вывод в консоль
    ]
)

logger = logging.getLogger(__name__)  # Создание логгера

async def log_request_response(request: Request, call_next):
    # Логирование входящего запроса
    request_body = await request.body()
    
    logger.info(
        f"Request: method={request.method} url={request.url} "
        f"headers={dict(request.headers)} "
        f"body={request_body.decode() if request_body else None}"
    )
    
    
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise
    
    
    # Логирование исходящего ответа
    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk
    
    logger.info(
        f"Response: status_code={response.status_code} "
        f"headers={dict(response.headers)} "
        f"body={response_body.decode()} "
    )
    
    return Response(
        content=response_body,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type
    )

#app.middleware("http")(log_request_response)

AVATARS_DIR = "static/avatars"
IMAGES_DIR = "static/images"
os.makedirs(AVATARS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(user_router, prefix="/user")
app.include_router(recipe_router, prefix="/recipe")

@app.get('/test')
async def reply():
    return JSONResponse(status_code=200, content={"message":"Test tested testessfully!"})
        
if __name__ == "app":
    import uvicorn
    uvicorn.run("app.main:app", log_level="debug", reload=True)