from fastapi import APIRouter

from app.api.routes import analyze, explain, history, predict, upload

api_router = APIRouter()
api_router.include_router(analyze.router)
api_router.include_router(upload.router)
api_router.include_router(predict.router)
api_router.include_router(explain.router)
api_router.include_router(history.router)
