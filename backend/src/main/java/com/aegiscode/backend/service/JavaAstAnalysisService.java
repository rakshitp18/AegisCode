package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.ProjectFile;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.BinaryExpr;
import com.github.javaparser.ast.expr.ConditionalExpr;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.FieldAccessExpr;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.ImportDeclaration;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class JavaAstAnalysisService {

    public static class FileAstResult {
        public String path;
        public CompilationUnit cu;
        public int loc;
        public int commentLines;
        public int blankLines;
        public boolean isParsed;
        public List<String> declaredClasses = new ArrayList<>();
    }

    public FileAstResult parseFile(ProjectFile file) {
        FileAstResult result = new FileAstResult();
        result.path = file.getPath();
        
        String content = file.getContent();
        if (content == null) content = "";
        
        // Compute basic line metrics
        String[] lines = content.split("\r\n|\r|\n", -1);
        result.loc = 0;
        result.commentLines = 0;
        result.blankLines = 0;
        
        boolean inBlockComment = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                result.blankLines++;
            } else if (inBlockComment) {
                result.commentLines++;
                if (trimmed.contains("*/")) {
                    inBlockComment = false;
                }
            } else if (trimmed.startsWith("/*")) {
                result.commentLines++;
                if (!trimmed.contains("*/") || trimmed.indexOf("/*") > trimmed.indexOf("*/")) {
                    inBlockComment = true;
                }
            } else if (trimmed.startsWith("//")) {
                result.commentLines++;
            } else {
                result.loc++;
            }
        }

        try {
            CompilationUnit cu = StaticJavaParser.parse(content);
            result.cu = cu;
            result.isParsed = true;

            // Find all classes declared in this file
            cu.findAll(ClassOrInterfaceDeclaration.class).forEach(cid -> {
                result.declaredClasses.add(cid.getNameAsString());
            });
            cu.findAll(EnumDeclaration.class).forEach(ed -> {
                result.declaredClasses.add(ed.getNameAsString());
            });
            cu.findAll(RecordDeclaration.class).forEach(rd -> {
                result.declaredClasses.add(rd.getNameAsString());
            });

        } catch (Exception e) {
            System.err.println("Failed to parse AST for " + file.getPath() + ": " + e.getMessage());
            result.isParsed = false;
        }

        return result;
    }

    public int calculateCyclomaticComplexity(MethodDeclaration method) {
        if (!method.getBody().isPresent()) {
            return 0;
        }
        
        int complexity = 1;
        BlockStmt body = method.getBody().get();

        complexity += body.findAll(IfStmt.class).size();
        complexity += body.findAll(ForStmt.class).size();
        complexity += body.findAll(ForEachStmt.class).size();
        complexity += body.findAll(WhileStmt.class).size();
        complexity += body.findAll(DoStmt.class).size();
        complexity += body.findAll(CatchClause.class).size();
        complexity += body.findAll(ConditionalExpr.class).size(); // Ternary
        
        // Count binary expression OR (||) and AND (&&) conditions
        complexity += body.findAll(BinaryExpr.class).stream()
                .filter(be -> be.getOperator() == BinaryExpr.Operator.AND || be.getOperator() == BinaryExpr.Operator.OR)
                .count();

        // Switch entries (cases)
        complexity += body.findAll(SwitchEntry.class).stream()
                .filter(se -> !se.getStatements().isEmpty())
                .count();

        return complexity;
    }

    public int calculateConstructorComplexity(ConstructorDeclaration constructor) {
        int complexity = 1;
        complexity += constructor.findAll(IfStmt.class).size();
        complexity += constructor.findAll(ForStmt.class).size();
        complexity += constructor.findAll(ForEachStmt.class).size();
        complexity += constructor.findAll(WhileStmt.class).size();
        complexity += constructor.findAll(DoStmt.class).size();
        complexity += constructor.findAll(CatchClause.class).size();
        complexity += constructor.findAll(ConditionalExpr.class).size();
        complexity += constructor.findAll(BinaryExpr.class).stream()
                .filter(be -> be.getOperator() == BinaryExpr.Operator.AND || be.getOperator() == BinaryExpr.Operator.OR)
                .count();
        complexity += constructor.findAll(SwitchEntry.class).stream()
                .filter(se -> !se.getStatements().isEmpty())
                .count();
        return complexity;
    }

    // Identifies large classes (>300 lines)
    public List<Map<String, Object>> findLargeClasses(List<FileAstResult> files) {
        List<Map<String, Object>> largeClasses = new ArrayList<>();
        for (FileAstResult far : files) {
            if (!far.isParsed) continue;

            far.cu.findAll(ClassOrInterfaceDeclaration.class).forEach(cid -> {
                if (cid.getBegin().isPresent() && cid.getEnd().isPresent()) {
                    int lineCount = cid.getEnd().get().line - cid.getBegin().get().line + 1;
                    if (lineCount > 300) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("name", cid.getNameAsString());
                        map.put("path", far.path);
                        map.put("loc", lineCount);
                        largeClasses.add(map);
                    }
                }
            });
        }
        return largeClasses;
    }

    // Identifies long methods (>50 lines)
    public List<Map<String, Object>> findLongMethods(List<FileAstResult> files) {
        List<Map<String, Object>> longMethods = new ArrayList<>();
        for (FileAstResult far : files) {
            if (!far.isParsed) continue;

            far.cu.findAll(MethodDeclaration.class).forEach(md -> {
                if (md.getBegin().isPresent() && md.getEnd().isPresent()) {
                    int lineCount = md.getEnd().get().line - md.getBegin().get().line + 1;
                    if (lineCount > 50) {
                        String className = "UnknownClass";
                        if (md.getParentNode().isPresent() && md.getParentNode().get() instanceof ClassOrInterfaceDeclaration) {
                            className = ((ClassOrInterfaceDeclaration) md.getParentNode().get()).getNameAsString();
                        }
                        Map<String, Object> map = new HashMap<>();
                        map.put("name", md.getNameAsString());
                        map.put("className", className);
                        map.put("path", far.path);
                        map.put("loc", lineCount);
                        longMethods.add(map);
                    }
                }
            });
        }
        return longMethods;
    }

    // Identifies unused imports
    public List<String> findUnusedImports(List<FileAstResult> files) {
        List<String> unusedImports = new ArrayList<>();
        for (FileAstResult far : files) {
            if (!far.isParsed) continue;

            CompilationUnit cu = far.cu;
            List<ImportDeclaration> imports = cu.getImports();
            if (imports.isEmpty() || cu.getTypes().isEmpty()) continue;

            for (ImportDeclaration imp : imports) {
                if (imp.isAsterisk()) continue;
                String fullName = imp.getNameAsString();
                String simpleName = fullName.substring(fullName.lastIndexOf('.') + 1);

                boolean isUsed = false;
                for (TypeDeclaration<?> type : cu.getTypes()) {
                    long count = type.findAll(NameExpr.class).stream()
                            .filter(ne -> ne.getNameAsString().equals(simpleName)).count() +
                            type.findAll(ClassOrInterfaceType.class).stream()
                            .filter(cit -> cit.getNameAsString().equals(simpleName)).count() +
                            type.findAll(MethodCallExpr.class).stream()
                            .filter(mce -> mce.getNameAsString().equals(simpleName) || (mce.getScope().isPresent() && mce.getScope().get().toString().equals(simpleName))).count() +
                            type.findAll(FieldAccessExpr.class).stream()
                            .filter(fae -> fae.getNameAsString().equals(simpleName) || fae.getScope().toString().equals(simpleName)).count() +
                            type.findAll(AnnotationExpr.class).stream()
                            .filter(ae -> ae.getNameAsString().equals(simpleName)).count();

                    if (count > 0) {
                        isUsed = true;
                        break;
                    }
                }

                if (!isUsed) {
                    unusedImports.add(imp.getNameAsString() + " in " + far.path);
                }
            }
        }
        return unusedImports;
    }

    // Identifies duplicate methods structurally (methods with same body content)
    public List<String> findDuplicateMethods(List<FileAstResult> files) {
        List<String> duplicates = new ArrayList<>();
        
        // Map: normalizedBody -> list of method declarations descriptors
        Map<String, List<String>> bodyMap = new HashMap<>();

        for (FileAstResult far : files) {
            if (!far.isParsed) continue;

            far.cu.findAll(MethodDeclaration.class).forEach(md -> {
                if (md.getBody().isPresent()) {
                    String body = md.getBody().get().toString();
                    
                    // Normalize body (strip spaces, braces, tabs, newlines)
                    String normalized = body.replaceAll("\\s+", "").replace("{", "").replace("}", "");
                    
                    // Only compare methods of reasonable size (>30 characters normalized) to filter out trivial getters/setters/empty blocks
                    if (normalized.length() > 30) {
                        String className = "Class";
                        if (md.getParentNode().isPresent() && md.getParentNode().get() instanceof TypeDeclaration) {
                            className = ((TypeDeclaration<?>) md.getParentNode().get()).getNameAsString();
                        }
                        
                        String descriptor = className + "." + md.getNameAsString() + "() in " + far.path;
                        bodyMap.computeIfAbsent(normalized, k -> new ArrayList<>()).add(descriptor);
                    }
                }
            });
        }

        for (Map.Entry<String, List<String>> entry : bodyMap.entrySet()) {
            List<String> locations = entry.getValue();
            if (locations.size() > 1) {
                duplicates.add("Identical method body found at: " + String.join(" AND ", locations));
            }
        }

        return duplicates;
    }

    // Builds a class dependency graph
    public void buildDependencyGraph(List<FileAstResult> files, List<String> nodes, List<Map<String, String>> edges) {
        // Collect all class names defined in the project
        Map<String, String> classToPath = new HashMap<>();
        for (FileAstResult far : files) {
            for (String className : far.declaredClasses) {
                classToPath.put(className, far.path);
                if (!nodes.contains(className)) {
                    nodes.add(className);
                }
            }
        }

        // Trace dependencies
        for (FileAstResult far : files) {
            if (!far.isParsed) continue;

            for (String currentClass : far.declaredClasses) {
                // Scan the AST of this compilation unit for references to other local classes
                for (String otherClass : classToPath.keySet()) {
                    if (currentClass.equals(otherClass)) continue;

                    boolean depends = false;
                    
                    // 1. Check imports
                    for (ImportDeclaration imp : far.cu.getImports()) {
                        if (imp.getNameAsString().endsWith("." + otherClass)) {
                            depends = true;
                            break;
                        }
                    }

                    // 2. Check type references inside the parsed source
                    if (!depends) {
                        long count = far.cu.findAll(ClassOrInterfaceType.class).stream()
                                .filter(cit -> cit.getNameAsString().equals(otherClass)).count() +
                                far.cu.findAll(NameExpr.class).stream()
                                .filter(ne -> ne.getNameAsString().equals(otherClass)).count();
                        if (count > 0) {
                            depends = true;
                        }
                    }

                    if (depends) {
                        Map<String, String> edge = new HashMap<>();
                        edge.put("source", currentClass);
                        edge.put("target", otherClass);
                        
                        // Prevent duplicates
                        boolean edgeExists = edges.stream().anyMatch(e -> 
                            e.get("source").equals(currentClass) && e.get("target").equals(otherClass)
                        );
                        if (!edgeExists) {
                            edges.add(edge);
                        }
                    }
                }
            }
        }
    }
}
