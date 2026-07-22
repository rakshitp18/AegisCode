package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.*;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.EnumDeclaration;
import com.github.javaparser.ast.body.RecordDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StaticAnalysisService {

    private final JavaAstAnalysisService javaAstAnalysisService;

    @Autowired
    public StaticAnalysisService(JavaAstAnalysisService javaAstAnalysisService) {
        this.javaAstAnalysisService = javaAstAnalysisService;
    }

    public CodeMetrics analyzeStatic(String language, String code) {
        if (code == null) {
            code = "";
        }

        if (language != null && language.equalsIgnoreCase("java")) {
            try {
                CompilationUnit cu = StaticJavaParser.parse(code);
                int lines = code.isEmpty() ? 0 : code.split("\r\n|\r|\n", -1).length;
                int todos = countMatches("TODO|FIXME", code, Pattern.CASE_INSENSITIVE);
                int classes = cu.findAll(ClassOrInterfaceDeclaration.class).size();
                int methods = cu.findAll(MethodDeclaration.class).size() + cu.findAll(ConstructorDeclaration.class).size();
                int printStatements = cu.findAll(MethodCallExpr.class).stream()
                        .filter(mce -> mce.toString().contains("System.out.print") || mce.toString().contains("System.out.println"))
                        .mapToInt(e -> 1).sum();
                return new CodeMetrics(lines, todos, classes, methods, printStatements);
            } catch (Exception e) {
                // Fall back to regex if AST parsing fails (e.g. incomplete snippet)
            }
        }

        int lines = code.isEmpty() ? 0 : code.split("\r\n|\r|\n", -1).length;
        int todos = countMatches("TODO|FIXME", code, Pattern.CASE_INSENSITIVE);
        int classes = countMatches("\\bclass\\b", code, 0);
        int methods = countMatches("(public|private|protected).*?\\(", code, 0);
        int printStatements = countMatches("System\\.out\\.println|print\\(", code, 0);

        return new CodeMetrics(lines, todos, classes, methods, printStatements);
    }

    public ProjectStaticAnalysisResponse analyzeProjectStatic(ProjectAnalysisRequest request) {
        ProjectStaticAnalysisResponse response = new ProjectStaticAnalysisResponse();
        
        List<ProjectFile> files = request.getFiles();
        if (files == null) {
            files = new ArrayList<>();
        }

        response.setTotalFiles(files.size());
        
        // Calculate folders dynamically
        Set<String> folders = new HashSet<>();
        int loc = 0;
        int blankLines = 0;
        int commentLines = 0;

        List<JavaAstAnalysisService.FileAstResult> javaAstResults = new ArrayList<>();

        for (ProjectFile file : files) {
            String path = file.getPath();
            if (path != null) {
                path = path.replace("\\", "/");
                String[] parts = path.split("/");
                StringBuilder currentPath = new StringBuilder();
                for (int i = 0; i < parts.length - 1; i++) {
                    if (currentPath.length() > 0) {
                        currentPath.append("/");
                    }
                    currentPath.append(parts[i]);
                    folders.add(currentPath.toString());
                }
            }

            if (file.getLanguage() != null && file.getLanguage().equalsIgnoreCase("java")) {
                JavaAstAnalysisService.FileAstResult far = javaAstAnalysisService.parseFile(file);
                javaAstResults.add(far);
                loc += far.loc;
                blankLines += far.blankLines;
                commentLines += far.commentLines;
            } else {
                // Non-java files - simple line metrics
                String content = file.getContent();
                if (content == null) content = "";
                String[] lines = content.split("\r\n|\r|\n", -1);
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty()) {
                        blankLines++;
                    } else if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("#")) {
                        commentLines++;
                    } else {
                        loc++;
                    }
                }
            }
        }

        response.setTotalFolders(folders.size());
        response.setLoc(loc);
        response.setBlankLines(blankLines);
        response.setCommentLines(commentLines);

        // Aggregate Java AST Specifics
        int classesCount = 0;
        int abstractClassesCount = 0;
        int interfacesCount = 0;
        int enumsCount = 0;
        int recordsCount = 0;
        int packagesCount = 0;
        int importsCount = 0;
        int constructorsCount = 0;
        int methodsCount = 0;
        int fieldsCount = 0;
        int staticMethodsCount = 0;

        int totalComplexity = 0;
        int complexMethodCount = 0;

        for (JavaAstAnalysisService.FileAstResult far : javaAstResults) {
            if (!far.isParsed) continue;

            CompilationUnit cu = far.cu;
            
            classesCount += cu.findAll(ClassOrInterfaceDeclaration.class).stream().filter(cid -> !cid.isInterface()).count();
            abstractClassesCount += cu.findAll(ClassOrInterfaceDeclaration.class).stream().filter(cid -> !cid.isInterface() && cid.isAbstract()).count();
            interfacesCount += cu.findAll(ClassOrInterfaceDeclaration.class).stream().filter(cid -> cid.isInterface()).count();
            enumsCount += cu.findAll(EnumDeclaration.class).size();
            recordsCount += cu.findAll(RecordDeclaration.class).size();
            
            if (cu.getPackageDeclaration().isPresent()) {
                packagesCount++;
            }
            importsCount += cu.getImports().size();
            constructorsCount += cu.findAll(ConstructorDeclaration.class).size();
            methodsCount += cu.findAll(MethodDeclaration.class).size();
            fieldsCount += cu.findAll(FieldDeclaration.class).size();
            staticMethodsCount += cu.findAll(MethodDeclaration.class).stream().filter(md -> md.isStatic()).count();

            // Calculate Complexity per Method
            for (MethodDeclaration md : cu.findAll(MethodDeclaration.class)) {
                totalComplexity += javaAstAnalysisService.calculateCyclomaticComplexity(md);
                complexMethodCount++;
            }
            for (ConstructorDeclaration cd : cu.findAll(ConstructorDeclaration.class)) {
                totalComplexity += javaAstAnalysisService.calculateConstructorComplexity(cd);
                complexMethodCount++;
            }
        }

        response.setClasses(classesCount);
        response.setAbstractClasses(abstractClassesCount);
        response.setInterfaces(interfacesCount);
        response.setEnums(enumsCount);
        response.setRecords(recordsCount);
        response.setPackages(packagesCount);
        response.setImports(importsCount);
        response.setConstructors(constructorsCount);
        response.setMethods(methodsCount);
        response.setFields(fieldsCount);
        response.setStaticMethods(staticMethodsCount);

        // Average Complexity
        int avgComplexity = complexMethodCount > 0 ? (totalComplexity / complexMethodCount) : 0;
        response.setCyclomaticComplexityScore(totalComplexity);
        
        String complexityRating = "Low";
        if (totalComplexity > 80) {
            complexityRating = "High";
        } else if (totalComplexity > 30) {
            complexityRating = "Medium";
        }
        response.setComplexityRating(complexityRating);

        // Code smells
        response.setLargeClasses(javaAstAnalysisService.findLargeClasses(javaAstResults));
        response.setLongMethods(javaAstAnalysisService.findLongMethods(javaAstResults));
        response.setUnusedImports(javaAstAnalysisService.findUnusedImports(javaAstResults));
        response.setDuplicateMethods(javaAstAnalysisService.findDuplicateMethods(javaAstResults));

        // Dependency Graph
        List<String> depNodes = new ArrayList<>();
        List<Map<String, String>> depEdges = new ArrayList<>();
        javaAstAnalysisService.buildDependencyGraph(javaAstResults, depNodes, depEdges);
        response.setDependencyNodes(depNodes);
        response.setDependencyEdges(depEdges);

        return response;
    }

    private int countMatches(String regex, String text, int flags) {
        Pattern pattern = Pattern.compile(regex, flags);
        Matcher matcher = pattern.matcher(text);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }
}
