from app.services.ai_service import analyze_with_ai
from app.services.static_analysis import analyze_static


def analyze_code(language, code):

    ai_result = analyze_with_ai(language, code)

    static_result = analyze_static(language, code)

    ai_result["metrics"] = static_result

    return ai_result