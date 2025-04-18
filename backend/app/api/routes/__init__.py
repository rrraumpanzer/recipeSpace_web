from fastapi import APIRouter

api_router = APIRouter()

# Здесь импортируйте и подключите другие маршруты 
# from app.api.routes.some_route import router as some_router
# api_router.include_router(some_router, prefix="/some", tags=["some"])