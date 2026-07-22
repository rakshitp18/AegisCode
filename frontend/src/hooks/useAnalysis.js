import { useState } from "react";
import { analyzeCodeRequest } from "../services/analysisService";

export default function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { message, title } or null

  const analyzeCode = async (language, code) => {
    if (!code || !code.trim()) {
      setAlertInfo({
        message: "Please enter some code first.",
        title: "Code Required"
      });
      return;
    }

    try {
      setLoading(true);

      const data = await analyzeCodeRequest(language, code);

      setResult(data);

    } catch (error) {
      console.error(error);
      setAlertInfo({
        message: "Failed to connect to the backend server. Please verify the server is running and try again.",
        title: "Connection Error"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    setResult,
    loading,
    analyzeCode,
    alertInfo,
    setAlertInfo,
  };
}