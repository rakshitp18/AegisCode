import { stripCommentsAndStrings } from "./regexScanner";

// Calculates line count breakdowns: Total, Code, Blank, Comment
export function calculateLineMetrics(code) {
  if (!code) {
    return {
      totalLines: 0,
      blankLines: 0,
      commentLines: 0,
      codeLines: 0
    };
  }

  const lines = code.split(/\r?\n/);
  const totalLines = lines.length;
  let blankLines = 0;
  let commentLines = 0;
  let inMultiLineComment = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      blankLines++;
      return;
    }

    if (inMultiLineComment) {
      commentLines++;
      if (trimmed.includes("*/")) {
        inMultiLineComment = false;
      }
      return;
    }

    if (trimmed.startsWith("/*")) {
      commentLines++;
      if (!trimmed.includes("*/")) {
        inMultiLineComment = true;
      }
      return;
    }

    if (trimmed.startsWith("//")) {
      commentLines++;
      return;
    }
    
    // Check if the line has comments mixed with code (we don't count it as a comment line since it contains code)
  });

  return {
    totalLines,
    blankLines,
    commentLines,
    codeLines: Math.max(0, totalLines - blankLines - commentLines)
  };
}

// Estimates cyclomatic complexity pathways
export function calculateComplexityMetrics(code) {
  if (!code) {
    return {
      ifs: 0,
      elseIfs: 0,
      switches: 0,
      fors: 0,
      whiles: 0,
      dos: 0,
      catches: 0,
      lambdas: 0,
      ternaries: 0,
      score: 0,
      rating: "Low"
    };
  }

  const stripped = stripCommentsAndStrings(code);

  const elseIfs = (stripped.match(/\belse\s+if\s*\(/g) || []).length;
  const allIfs = (stripped.match(/\bif\s*\(/g) || []).length;
  const ifs = Math.max(0, allIfs - elseIfs);

  const switches = (stripped.match(/\bswitch\s*\(/g) || []).length;
  const fors = (stripped.match(/\bfor\s*\(/g) || []).length;
  const whiles = (stripped.match(/\bwhile\s*\(/g) || []).length;
  const dos = (stripped.match(/\bdo\s*\{/g) || []).length;
  const catches = (stripped.match(/\bcatch\s*\(/g) || []).length;
  
  // Java -> or JS/TS => arrow operators
  const lambdas = (stripped.match(/(?:->|=>)/g) || []).length;
  
  // Ternary operators (? followed by : elsewhere on same statement, but simple ? check on stripped code works)
  const ternaries = (stripped.match(/\?/g) || []).length;

  const score = (ifs * 1) + (elseIfs * 1) + (switches * 2) + (fors * 1) + (whiles * 1) + (dos * 1) + (catches * 1) + (lambdas * 1) + (ternaries * 1);

  let rating = "Low";
  if (score > 25) {
    rating = "High";
  } else if (score > 10) {
    rating = "Medium";
  }

  return {
    ifs,
    elseIfs,
    switches,
    fors,
    whiles,
    dos,
    catches,
    lambdas,
    ternaries,
    score,
    rating
  };
}
