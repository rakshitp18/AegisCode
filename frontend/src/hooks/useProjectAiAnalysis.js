import { useState } from "react";
import { analyzeProjectRequest } from "../services/projectAiService";

function combineBatchReports(batchList, totalFiles) {
  if (!batchList || batchList.length === 0) return null;
  
  if (batchList.length === 1) {
    return {
      ...batchList[0],
      isCombinedReport: true,
      totalBatchesAnalyzed: 1,
      filesAnalyzed: totalFiles || batchList[0].filesAnalyzed || 0
    };
  }

  // 1. Calculate Average Health Score across all batch scans
  const totalScore = batchList.reduce((acc, curr) => acc + (curr.healthScore || 0), 0);
  const avgHealthScore = Math.round(totalScore / batchList.length);

  // 2. Deduplicate Array Items Helper
  const deduplicateList = (key) => {
    const items = [];
    const seen = new Set();
    batchList.forEach(b => {
      const arr = b[key] || [];
      arr.forEach(item => {
        if (item && typeof item === "string") {
          const clean = item.trim();
          const lower = clean.toLowerCase();
          if (!seen.has(lower) && clean.length > 3) {
            seen.add(lower);
            items.push(clean);
          }
        }
      });
    });
    return items;
  };

  // 3. Synthesize Text Paragraphs (Architecture & Quality Overviews)
  const combineSummaries = (key, defaultTitle) => {
    const uniqueSentences = new Set();
    const resultSentences = [];
    batchList.forEach(b => {
      const text = b[key];
      if (text && text.trim() && !text.includes("Unable to perform")) {
        const sentences = text.split(/(?<=[.!?])\s+/);
        sentences.forEach(s => {
          const clean = s.trim();
          const lower = clean.toLowerCase();
          if (clean.length > 12 && !uniqueSentences.has(lower)) {
            uniqueSentences.add(lower);
            resultSentences.push(clean);
          }
        });
      }
    });

    if (resultSentences.length === 0) {
      return defaultTitle;
    }
    return resultSentences.join(" ");
  };

  return {
    architectureSummary: combineSummaries("architectureSummary", "Comprehensive project architecture evaluated across all project files and directories."),
    codeQualityOverview: combineSummaries("codeQualityOverview", "Complete codebase quality overview synthesized across all modules."),
    designPatterns: deduplicateList("designPatterns"),
    duplicateLogic: deduplicateList("duplicateLogic"),
    securityObservations: deduplicateList("securityObservations"),
    performanceObservations: deduplicateList("performanceObservations"),
    refactoringSuggestions: deduplicateList("refactoringSuggestions"),
    healthScore: avgHealthScore,
    filesAnalyzed: totalFiles,
    totalFiles: totalFiles,
    contextOmitted: false,
    nextOffset: totalFiles,
    startOffset: 0,
    isCombinedReport: true,
    totalBatchesAnalyzed: batchList.length
  };
}

export default function useProjectAiAnalysis() {
  const [projectAiResult, setProjectAiResult] = useState(null);
  const [projectAiLoading, setProjectAiLoading] = useState(false);
  const [projectAiError, setProjectAiError] = useState(null);
  const [batchHistory, setBatchHistory] = useState([]);

  const analyzeProjectAi = async (projectName, files, startOffset = 0) => {
    if (!files || files.length === 0) {
      setProjectAiError("No files found in workspace to analyze.");
      return;
    }

    try {
      setProjectAiLoading(true);
      setProjectAiError(null);

      let currentOffset = startOffset;
      let isFinished = false;
      let newHistory = startOffset === 0 ? [] : [...batchHistory];
      let totalNumFiles = files.length;
      let currentResult = null;

      while (!isFinished) {
        currentResult = await analyzeProjectRequest(projectName, files, currentOffset);
        newHistory.push(currentResult);
        
        totalNumFiles = currentResult.totalFiles || files.length;
        const currentEndOffset = (currentResult.startOffset || currentOffset) + (currentResult.filesAnalyzed || 0);
        
        isFinished = !currentResult.contextOmitted || currentEndOffset >= totalNumFiles || (currentResult.nextOffset !== undefined && currentResult.nextOffset >= totalNumFiles);
        
        setBatchHistory([...newHistory]);
        
        if (isFinished) {
          const masterReport = combineBatchReports(newHistory, totalNumFiles);
          setProjectAiResult(masterReport);
        } else {
          setProjectAiResult(currentResult);
          currentOffset = currentResult.nextOffset || currentEndOffset;
        }
      }
    } catch (err) {
      console.error("Project AI Analysis error:", err);
      setProjectAiError(
        err.response?.data?.message || 
        err.message || 
        "Failed to complete project AI analysis. Please verify your backend server is running."
      );
    } finally {
      setProjectAiLoading(false);
    }
  };

  return {
    projectAiResult,
    projectAiLoading,
    projectAiError,
    analyzeProjectAi,
    setProjectAiResult,
    batchHistory
  };
}
