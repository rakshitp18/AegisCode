import { detectLanguage } from "../utils/languageDetector";
import { parseJavaMetrics } from "../utils/javaParser";
import { scanQualityMetrics, scanSecurityMetrics } from "../utils/regexScanner";
import { calculateLineMetrics, calculateComplexityMetrics } from "../utils/metricsCalculator";

// Analyzes a single file and outputs its structural, quality, security, and complexity metrics
export function analyzeFile(file) {
  const language = file.language || detectLanguage(file.name);
  const code = file.content || "";
  
  const lineMetrics = calculateLineMetrics(code);
  const complexityMetrics = calculateComplexityMetrics(code);
  const qualityMetrics = scanQualityMetrics(code);
  const securityWarnings = scanSecurityMetrics(code, file.path || file.name);
  
  let javaMetrics = null;
  if (language === "java") {
    javaMetrics = parseJavaMetrics(code);
  }

  return {
    id: file.id,
    name: file.name,
    path: file.path || file.name,
    language,
    lines: lineMetrics.totalLines,
    codeLines: lineMetrics.codeLines,
    blankLines: lineMetrics.blankLines,
    commentLines: lineMetrics.commentLines,
    complexity: complexityMetrics,
    quality: qualityMetrics,
    security: securityWarnings,
    javaMetrics,
    lastModified: Date.now()
  };
}

// Runs project-wide analysis by scanning changed files and loading unchanged files from the cache
export function analyzeProject(files, projectName = "My Project", previousCache = {}) {
  const newCache = {};
  const fileAnalyses = [];
  const folders = new Set();
  const languages = new Set();

  files.forEach((file) => {
    // 1. Calculate folder list dynamically
    const path = (file.path || file.name).replace(/\\/g, "/");
    const parts = path.split("/");
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      folders.add(currentPath);
    }

    // 2. Resolve cached analysis or run a fresh scan if file has been modified
    const cached = previousCache[file.id];
    if (cached && cached.content === file.content) {
      fileAnalyses.push(cached.result);
      newCache[file.id] = cached;
      if (cached.result.language) {
        languages.add(cached.result.language);
      }
    } else {
      const result = analyzeFile(file);
      fileAnalyses.push(result);
      newCache[file.id] = {
        content: file.content,
        result
      };
      if (result.language) {
        languages.add(result.language);
      }
    }
  });

  // Aggregated totals
  let totalLOC = 0;
  let totalBlank = 0;
  let totalComment = 0;

  // Java metrics totals
  let totalClasses = 0;
  let totalInterfaces = 0;
  let totalEnums = 0;
  let totalRecords = 0;
  let totalPackages = 0;
  let totalImports = 0;
  let totalConstructors = 0;
  let totalMethods = 0;
  let totalFields = 0;
  let totalStaticMethods = 0;
  let totalAbstractClasses = 0;

  // Quality metrics aggregates
  let totalTodos = 0;
  let totalFixmes = 0;
  let totalHacks = 0;
  let allQualityIssues = [];

  // Complexity aggregates
  let projectComplexityScore = 0;
  const complexityTotals = {
    ifs: 0,
    elseIfs: 0,
    switches: 0,
    fors: 0,
    whiles: 0,
    dos: 0,
    catches: 0,
    lambdas: 0,
    ternaries: 0
  };

  // Security warnings flat list
  let allSecurityWarnings = [];

  // File insights map
  const fileInsights = {};

  fileAnalyses.forEach((analysis) => {
    totalLOC += analysis.codeLines;
    totalBlank += analysis.blankLines;
    totalComment += analysis.commentLines;

    // Accumulate Java specific metrics
    if (analysis.javaMetrics) {
      const jm = analysis.javaMetrics;
      totalClasses += jm.classes;
      totalAbstractClasses += jm.abstractClasses;
      totalInterfaces += jm.interfaces;
      totalEnums += jm.enums;
      totalRecords += jm.records;
      totalPackages += jm.packages;
      totalImports += jm.imports;
      totalConstructors += jm.constructors;
      totalMethods += jm.methods;
      totalFields += jm.fields;
      totalStaticMethods += jm.staticMethods;
    }

    // Accumulate Quality issues
    const qm = analysis.quality;
    totalTodos += qm.todoCount;
    totalFixmes += qm.fixmeCount;
    totalHacks += qm.hackCount;
    
    // Prefix issues with filename to make them unique/identifiable
    qm.issues.forEach(issue => {
      allQualityIssues.push({
        ...issue,
        file: analysis.path
      });
    });

    // Accumulate Complexity values
    const cm = analysis.complexity;
    projectComplexityScore += cm.score;
    complexityTotals.ifs += cm.ifs;
    complexityTotals.elseIfs += cm.elseIfs;
    complexityTotals.switches += cm.switches;
    complexityTotals.fors += cm.fors;
    complexityTotals.whiles += cm.whiles;
    complexityTotals.dos += cm.dos;
    complexityTotals.catches += cm.catches;
    complexityTotals.lambdas += cm.lambdas;
    complexityTotals.ternaries += cm.ternaries;

    // Accumulate Security alerts
    allSecurityWarnings = allSecurityWarnings.concat(analysis.security);

    // Save File Insights
    fileInsights[analysis.id] = {
      lines: analysis.lines,
      methods: analysis.javaMetrics ? analysis.javaMetrics.methods : analysis.quality.longMethods.length,
      classes: analysis.javaMetrics ? analysis.javaMetrics.classes : (analysis.quality.largeClasses.length > 0 ? 1 : 0),
      todoCount: qm.todoCount,
      complexity: cm.score,
      lastModified: analysis.lastModified
    };
  });

  // Calculate project complexity rating
  let projectComplexityRating = "Low";
  if (projectComplexityScore > 80) {
    projectComplexityRating = "High";
  } else if (projectComplexityScore > 30) {
    projectComplexityRating = "Medium";
  }

  // Deduplicate and count duplicate import statements across files
  const uniqueFoldersCount = folders.size;

  const projectOverview = {
    projectName,
    totalFiles: files.length,
    totalFolders: uniqueFoldersCount,
    languages: Array.from(languages),
    loc: totalLOC,
    blankLines: totalBlank,
    commentLines: totalComment
  };

  const javaMetrics = {
    classes: totalClasses,
    abstractClasses: totalAbstractClasses,
    interfaces: totalInterfaces,
    enums: totalEnums,
    records: totalRecords,
    packages: totalPackages,
    imports: totalImports,
    constructors: totalConstructors,
    methods: totalMethods,
    fields: totalFields,
    staticMethods: totalStaticMethods
  };

  const qualityMetrics = {
    todos: totalTodos,
    fixmes: totalFixmes,
    hacks: totalHacks,
    issues: allQualityIssues
  };

  const complexityMetrics = {
    ...complexityTotals,
    score: projectComplexityScore,
    rating: projectComplexityRating
  };

  return {
    projectOverview,
    javaMetrics,
    qualityMetrics,
    complexityMetrics,
    securityWarnings: allSecurityWarnings,
    fileInsights,
    cache: newCache
  };
}
