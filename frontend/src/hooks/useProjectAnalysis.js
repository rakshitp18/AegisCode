import { useState, useEffect, useRef } from "react";
import { analyzeProject } from "../services/projectAnalyzer";
import { analyzeProjectStaticRequest } from "../services/analysisService";

export default function useProjectAnalysis(files, projectName) {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'classes', 'methods', 'loc', 'complexity', 'todos', 'security'
  const [staticLoading, setStaticLoading] = useState(false);
  const [staticError, setStaticError] = useState(null);
  const cacheRef = useRef({});

  useEffect(() => {
    if (!files || files.length === 0) {
      setAnalysisResults(null);
      return;
    }

    const runAnalysis = async () => {
      try {
        setStaticLoading(true);
        setStaticError(null);

        // 1. Run local client-side analysis (for non-java files + todos/regex security)
        const localResults = analyzeProject(files, projectName, cacheRef.current);
        cacheRef.current = localResults.cache;

        // 2. Fetch AST-based analysis from backend
        const backendResults = await analyzeProjectStaticRequest(projectName, files);

        // 3. Merge backend AST-based results into local metrics
        const mergedResults = {
          ...localResults,
          projectOverview: {
            ...localResults.projectOverview,
            loc: backendResults.loc,
            commentLines: backendResults.commentLines,
            blankLines: backendResults.blankLines,
            totalFiles: backendResults.totalFiles,
            totalFolders: backendResults.totalFolders
          },
          javaMetrics: {
            classes: backendResults.classes,
            abstractClasses: backendResults.abstractClasses,
            interfaces: backendResults.interfaces,
            enums: backendResults.enums,
            records: backendResults.records,
            packages: backendResults.packages,
            imports: backendResults.imports,
            constructors: backendResults.constructors,
            methods: backendResults.methods,
            fields: backendResults.fields,
            staticMethods: backendResults.staticMethods
          },
          complexityMetrics: {
            ...localResults.complexityMetrics,
            score: backendResults.cyclomaticComplexityScore,
            rating: backendResults.complexityRating
          },
          // Insert backend code smells as quality issues
          qualityMetrics: {
            ...localResults.qualityMetrics,
            unusedImports: backendResults.unusedImports || [],
            duplicateMethods: backendResults.duplicateMethods || [],
            largeClasses: backendResults.largeClasses || [],
            longMethods: backendResults.longMethods || []
          },
          // Graph data
          dependencyNodes: backendResults.dependencyNodes || [],
          dependencyEdges: backendResults.dependencyEdges || []
        };

        setAnalysisResults(mergedResults);
      } catch (err) {
        console.error("Static AST Analysis failed, falling back to local regex: ", err);
        setStaticError(err.message || "Failed to reach backend static analyzer.");
        // Fall back to local regex calculations so the UI doesn't break if backend is offline
        const localResults = analyzeProject(files, projectName, cacheRef.current);
        setAnalysisResults(localResults);
      } finally {
        setStaticLoading(false);
      }
    };

    runAnalysis();
  }, [files, projectName]);

  return {
    analysisResults,
    filterType,
    setFilterType,
    staticLoading,
    staticError
  };
}
