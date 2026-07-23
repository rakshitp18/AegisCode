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
    let active = true;

    if (!files || files.length === 0) {
      setAnalysisResults(null);
      return;
    }

    const runAnalysis = async () => {
      try {
        setStaticLoading(true);
        setStaticError(null);

        // 1. Run local client-side analysis
        const localResults = analyzeProject(files, projectName, cacheRef.current);
        if (!active) return;
        cacheRef.current = localResults.cache;

        // 2. Fetch AST-based analysis from backend
        const backendResults = await analyzeProjectStaticRequest(projectName, files);
        if (!active) return;

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
          qualityMetrics: {
            ...localResults.qualityMetrics,
            unusedImports: backendResults.unusedImports || [],
            duplicateMethods: backendResults.duplicateMethods || [],
            largeClasses: backendResults.largeClasses || [],
            longMethods: backendResults.longMethods || []
          },
          dependencyNodes: backendResults.dependencyNodes || [],
          dependencyEdges: backendResults.dependencyEdges || []
        };

        setAnalysisResults(mergedResults);
      } catch (err) {
        if (!active) return;
        console.error("Static AST Analysis failed, falling back to local regex: ", err);
        setStaticError(err.message || "Failed to reach backend static analyzer.");
        const localResults = analyzeProject(files, projectName, cacheRef.current);
        setAnalysisResults(localResults);
      } finally {
        if (active) {
          setStaticLoading(false);
        }
      }
    };

    runAnalysis();

    return () => {
      active = false;
    };
  }, [files, projectName]);

  return {
    analysisResults,
    filterType,
    setFilterType,
    staticLoading,
    staticError
  };
}
