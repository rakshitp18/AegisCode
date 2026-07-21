import { useState, useEffect, useRef } from "react";
import { analyzeProject } from "../services/projectAnalyzer";

export default function useProjectAnalysis(files, projectName) {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'classes', 'methods', 'loc', 'complexity', 'todos', 'security'
  const cacheRef = useRef({});

  useEffect(() => {
    if (!files || files.length === 0) {
      setAnalysisResults(null);
      return;
    }

    // Perform analysis incrementally using the cached previous results
    const results = analyzeProject(files, projectName, cacheRef.current);
    
    // Save new cache state
    cacheRef.current = results.cache;
    
    setAnalysisResults(results);
  }, [files, projectName]);

  return {
    analysisResults,
    filterType,
    setFilterType
  };
}
