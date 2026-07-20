from fastapi import APIRouter

from app.schemas.request import CodeRequest
from app.services.analyzer import analyze_code

router = APIRouter()


@router.post("/analyze")
def analyze(request: CodeRequest):
    return analyze_code(
        request.language,
        request.code,
    )