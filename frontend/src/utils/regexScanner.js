// Utility for comment-and-string stripping to prevent false matches in comments/strings
export function stripCommentsAndStrings(code) {
  if (!code) return "";
  
  // Replace multi-line comments: /* ... */
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, "");
  
  // Replace single-line comments: // ...
  cleaned = cleaned.replace(/\/\/.*$/gm, "");
  
  // Replace double-quoted strings: "..."
  cleaned = cleaned.replace(/"(?:\\.|[^"\\])*"/g, '""');
  
  // Replace single-quoted characters/strings: '...'
  cleaned = cleaned.replace(/'(?:\\.|[^'\\])*'/g, "''");
  
  return cleaned;
}

// Scans for code quality issues
export function scanQualityMetrics(code) {
  const issues = [];
  const stripped = stripCommentsAndStrings(code);

  // 1. TODO, FIXME, HACK (scanned in raw code since they live in comments!)
  const todoMatches = code.match(/\bTODO\b/g) || [];
  const fixmeMatches = code.match(/\bFIXME\b/g) || [];
  const hackMatches = code.match(/\bHACK\b/g) || [];

  // 2. Empty catch blocks (stripped code)
  const emptyCatchRegex = /\bcatch\s*\([^)]*\)\s*\{\s*\}/g;
  const emptyCatches = (stripped.match(emptyCatchRegex) || []).length;
  if (emptyCatches > 0) {
    issues.push({
      type: "empty_catch",
      title: "Empty Catch Block",
      message: `Detected ${emptyCatches} empty catch block(s). Suppressing exceptions can hide bugs.`,
      severity: "warning",
      count: emptyCatches
    });
  }

  // 3. Empty methods (stripped code)
  // Match method declarations with empty body
  const emptyMethodRegex = /\b(?:public|protected|private|static|\s)+\s+[\w<>[\]]+\s+\w+\s*\([^)]*\)\s*\{\s*\}/g;
  const emptyMethods = (stripped.match(emptyMethodRegex) || []).length;
  if (emptyMethods > 0) {
    issues.push({
      type: "empty_method",
      title: "Empty Method",
      message: `Detected ${emptyMethods} empty method declaration(s). Remove unused code or implement them.`,
      severity: "info",
      count: emptyMethods
    });
  }

  // 4. System.out.println (stripped code)
  const stdoutRegex = /System\.out\.print(ln)?/g;
  const stdoutCount = (stripped.match(stdoutRegex) || []).length;
  if (stdoutCount > 0) {
    issues.push({
      type: "stdout_logging",
      title: "System.out.println Usage",
      message: `Detected ${stdoutCount} console print statement(s). Use a logging framework instead.`,
      severity: "info",
      count: stdoutCount
    });
  }

  // 5. Deprecated annotations (stripped code)
  const deprecatedRegex = /@Deprecated\b/g;
  const deprecatedCount = (stripped.match(deprecatedRegex) || []).length;
  if (deprecatedCount > 0) {
    issues.push({
      type: "deprecated_usage",
      title: "Deprecated Annotations",
      message: `Detected ${deprecatedCount} usage(s) of @Deprecated annotations. Avoid using legacy code.`,
      severity: "warning",
      count: deprecatedCount
    });
  }

  // 6. Magic numbers (stripped code)
  // Matches any digit sequence not representing common initializers (0, 1, 2, 100, 1000) that is part of a comparison, assignment or arithmetic operation
  const magicNumRegex = /[=+\-*/%&|^<>!]\s*\b(?!0|1|2|100|1000|-1|-2)\d+\b/g;
  const magicNumbers = (stripped.match(magicNumRegex) || []).length;
  if (magicNumbers > 0) {
    issues.push({
      type: "magic_number",
      title: "Magic Numbers",
      message: `Detected ${magicNumbers} magic number(s). Define constants or config keys instead of hardcoding numeric values.`,
      severity: "warning",
      count: magicNumbers
    });
  }

  // 7. Duplicate & Wildcard imports (stripped code)
  const importMatches = stripped.match(/\bimport\s+(?:static\s+)?([\w.]+)(?:\.\*)?;/g) || [];
  let wildcardCount = 0;
  const importCounts = {};
  
  importMatches.forEach(imp => {
    if (imp.includes("*")) wildcardCount++;
    importCounts[imp] = (importCounts[imp] || 0) + 1;
  });

  const duplicateCount = Object.values(importCounts).filter(c => c > 1).length;

  if (wildcardCount > 0) {
    issues.push({
      type: "wildcard_import",
      title: "Wildcard Imports",
      message: `Detected ${wildcardCount} wildcard import(s). Avoid importing full packages using '*'.`,
      severity: "info",
      count: wildcardCount
    });
  }

  if (duplicateCount > 0) {
    issues.push({
      type: "duplicate_import",
      title: "Duplicate Imports",
      message: `Detected ${duplicateCount} duplicate import statement(s). Clean up unnecessary imports.`,
      severity: "info",
      count: duplicateCount
    });
  }

  // 8. Method and Class length checks
  const longMethods = findLongMethods(code);
  if (longMethods.length > 0) {
    issues.push({
      type: "long_methods",
      title: "Long Methods",
      message: `Detected ${longMethods.length} method(s) exceeding 50 lines. Break them down.`,
      severity: "warning",
      count: longMethods.length,
      details: longMethods
    });
  }

  const largeClasses = findLargeClasses(code);
  if (largeClasses.length > 0) {
    issues.push({
      type: "large_classes",
      title: "Large Classes",
      message: `Detected ${largeClasses.length} class(es) exceeding 300 lines. Refactor classes into smaller, focused files.`,
      severity: "warning",
      count: largeClasses.length,
      details: largeClasses
    });
  }

  return {
    todoCount: todoMatches.length,
    fixmeCount: fixmeMatches.length,
    hackCount: hackMatches.length,
    issues,
    longMethods,
    largeClasses
  };
}

// Balance curly braces to find lines of classes
export function findLargeClasses(code, limit = 300) {
  const list = [];
  const stripped = stripCommentsAndStrings(code);
  
  const classRegex = /\bclass\s+(\w+)/g;
  let match;
  while ((match = classRegex.exec(stripped)) !== null) {
    const className = match[1];
    const openBraceIndex = stripped.indexOf("{", match.index);
    if (openBraceIndex !== -1) {
      let depth = 1;
      let scanIndex = openBraceIndex + 1;
      while (scanIndex < stripped.length && depth > 0) {
        if (stripped[scanIndex] === "{") depth++;
        else if (stripped[scanIndex] === "}") depth--;
        scanIndex++;
      }
      
      if (depth === 0) {
        const classBody = stripped.substring(openBraceIndex, scanIndex);
        const lineCount = classBody.split("\n").length;
        if (lineCount > limit) {
          list.push({ name: className, lines: lineCount });
        }
      }
    }
  }
  return list;
}

// Balance curly braces to find lines of methods
export function findLongMethods(code, limit = 50) {
  const list = [];
  const stripped = stripCommentsAndStrings(code);
  
  let index = 0;
  while ((index = stripped.indexOf("{", index)) !== -1) {
    const lookbackStart = Math.max(0, index - 100);
    const lookbackText = stripped.substring(lookbackStart, index);
    // Matches methods: word followed by parameters and throws block
    const sigMatch = lookbackText.match(/\b(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w.,\s]+)?$/);
    
    if (sigMatch) {
      const methodName = sigMatch[1];
      if (methodName !== "class" && methodName !== "if" && methodName !== "for" && methodName !== "while" && methodName !== "switch" && methodName !== "catch" && methodName !== "static") {
        let depth = 1;
        let scanIndex = index + 1;
        while (scanIndex < stripped.length && depth > 0) {
          if (stripped[scanIndex] === "{") depth++;
          else if (stripped[scanIndex] === "}") depth--;
          scanIndex++;
        }
        
        if (depth === 0) {
          const methodBody = stripped.substring(index, scanIndex);
          const lineCount = methodBody.split("\n").length;
          if (lineCount > limit) {
            list.push({ name: methodName, lines: lineCount });
          }
        }
      }
    }
    index++;
  }
  return list;
}

// Scans for security issues
export function scanSecurityMetrics(code, filename = "") {
  const warnings = [];
  const stripped = stripCommentsAndStrings(code);
  const lines = code.split("\n");

  const addWarning = (type, title, description, lineText, index) => {
    warnings.push({
      type,
      title,
      description,
      file: filename,
      snippet: lineText.trim().substring(0, 100),
      lineNumber: index + 1,
      severity: "high"
    });
  };

  // Scan line by line for context snippet and line numbers
  lines.forEach((line, index) => {
    // 1. Hardcoded password patterns
    const passMatch = line.match(/\b(pass(word|wd|pt)?|secret|cred|key|credential|private_?key)\s*=\s*['"]([^'"\s]{4,})['"]/i);
    if (passMatch) {
      const value = passMatch[3].toLowerCase();
      // Exclude obviously placeholder values
      if (!["password", "secret", "null", "admin", "test", "root", "1234", "123456", "pwd"].includes(value)) {
        addWarning("hardcoded_credential", "Hardcoded Password", "Potential hardcoded credential or secret detected.", line, index);
      }
    }

    // 2. Hardcoded API Keys / Tokens
    const keyMatch = line.match(/\b(api_?key|apikey|token|access_?token|auth_?token|jwt)\s*=\s*['"]([^'"\s]{10,})['"]/i);
    if (keyMatch) {
      const value = keyMatch[2].toLowerCase();
      if (!["token", "mykey", "dummy", "placeholder", "testkey", "apikey"].includes(value)) {
        addWarning("hardcoded_secret", "Hardcoded API Key / Token", "Potential hardcoded API token or service key detected.", line, index);
      }
    }
  });

  // Dangerous runtime calls (scanned on stripped code)
  const execRegex = /\b(?:Runtime\.getRuntime\(\)\.exec\([^)]*\)|new\s+ProcessBuilder\([^)]*\))/g;
  const execMatches = stripped.match(execRegex) || [];
  if (execMatches.length > 0) {
    // Find matching lines
    lines.forEach((line, index) => {
      if (line.includes("Runtime.getRuntime().exec") || line.includes("ProcessBuilder")) {
        addWarning("command_injection", "Dangerous Process Execution", "Execution of external OS commands detected (potential Command Injection vulnerability).", line, index);
      }
    });
  }

  // SQL Query String construction (potential SQL Injection)
  const sqlStringRegex = /"(?:SELECT|INSERT|UPDATE|DELETE)\s+[\s\S]*?\+\s*\w+/i;
  lines.forEach((line, index) => {
    if (sqlStringRegex.test(line)) {
      addWarning("sql_injection", "Dynamic SQL Query", "Dynamic SQL construction using string concatenation detected (potential SQL Injection risk).", line, index);
    }
  });

  // Dangerous File Deletion call
  lines.forEach((line, index) => {
    if (line.includes("File.delete()") || line.includes("Files.delete(") || line.includes(".delete()")) {
      // Exclude simple comments or test files
      if (!line.trim().startsWith("//") && !line.includes("/*")) {
        addWarning("file_delete", "File Deletion Operation", "File system deletion operation detected. Ensure proper security checks are in place.", line, index);
      }
    }
  });

  // Reflection usage (stripped code)
  const reflectionRegex = /\b(?:Class\.forName|getDeclaredMethods|getDeclaredFields|getMethod)\b/g;
  if (reflectionRegex.test(stripped)) {
    lines.forEach((line, index) => {
      if (line.includes("Class.forName") || line.includes("getDeclaredMethods") || line.includes("getDeclaredFields") || line.includes("getMethod")) {
        addWarning("reflection_vulnerability", "Java Reflection Usage", "Class Reflection operations detected. Reflection bypasses access checks and can compromise security.", line, index);
      }
    });
  }

  return warnings;
}
