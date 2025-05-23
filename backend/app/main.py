from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .api.routes.users import user_router
from .api.routes.recipes import recipe_router
import os
app = FastAPI()

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