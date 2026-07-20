import { useState } from "react";
import { analyzeCodeRequest } from "../services/analysisService";

export default function useAnalysis() {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeCode = async () => {
    if (!code.trim()) {
      alert("Please enter some code first.");
      return;
    }

    try {
      setLoading(true);

      const data = await analyzeCodeRequest(language, code);

      setResult(data);

    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return {
    language,
    setLanguage,
    code,
    setCode,
    result,
    loading,
    analyzeCode,
  };
}