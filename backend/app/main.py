from fastapi import FastAPI
from fastapi.responses import JSONResponse
from .api.routes.users import user_router
from .api.routes.recipes import recipe_router

app = FastAPI()

app.include_router(user_router, prefix="/user")
app.include_router(recipe_router, prefix="/recipe")

@app.get('/test')
async def reply():
    return JSONResponse(status_code=200, content={"message":"Test tested testessfully!"})
        
if __name__ == "app":
    import uvicorn
    uvicorn.run("app.main:app", log_level="debug", reload=True)