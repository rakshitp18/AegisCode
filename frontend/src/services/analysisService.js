import api from "./api";

export async function analyzeCodeRequest(language, code) {

    const response = await api.post("/analyze", {
        language,
        code,
    });

    return response.data;
}