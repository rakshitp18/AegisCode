from pydantic import BaseModel

class AnalysisResponse(BaseModel):
    summary: str
    bugs: list[str]
    suggestions: list[str]
    complexity: str
    tests: list[str]
    confidence: int