package com.aegiscode.backend.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ProjectStaticAnalysisResponse {
    private int totalFiles;
    private int totalFolders;
    private int loc;
    private int commentLines;
    private int blankLines;

    // Java AST metrics
    private int classes;
    private int abstractClasses;
    private int interfaces;
    private int enums;
    private int records;
    private int packages;
    private int imports;
    private int constructors;
    private int methods;
    private int fields;
    private int staticMethods;

    // Code smells
    private List<Map<String, Object>> largeClasses = new ArrayList<>();
    private List<Map<String, Object>> longMethods = new ArrayList<>();
    private List<String> unusedImports = new ArrayList<>();
    private List<String> duplicateMethods = new ArrayList<>();

    // Complexity
    private int cyclomaticComplexityScore;
    private String complexityRating = "Low";

    // Dependency Graph
    private List<String> dependencyNodes = new ArrayList<>();
    private List<Map<String, String>> dependencyEdges = new ArrayList<>();

    public ProjectStaticAnalysisResponse() {}

    public int getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(int totalFiles) {
        this.totalFiles = totalFiles;
    }

    public int getTotalFolders() {
        return totalFolders;
    }

    public void setTotalFolders(int totalFolders) {
        this.totalFolders = totalFolders;
    }

    public int getLoc() {
        return loc;
    }

    public void setLoc(int loc) {
        this.loc = loc;
    }

    public int getCommentLines() {
        return commentLines;
    }

    public void setCommentLines(int commentLines) {
        this.commentLines = commentLines;
    }

    public int getBlankLines() {
        return blankLines;
    }

    public void setBlankLines(int blankLines) {
        this.blankLines = blankLines;
    }

    public int getClasses() {
        return classes;
    }

    public void setClasses(int classes) {
        this.classes = classes;
    }

    public int getAbstractClasses() {
        return abstractClasses;
    }

    public void setAbstractClasses(int abstractClasses) {
        this.abstractClasses = abstractClasses;
    }

    public int getInterfaces() {
        return interfaces;
    }

    public void setInterfaces(int interfaces) {
        this.interfaces = interfaces;
    }

    public int getEnums() {
        return enums;
    }

    public void setEnums(int enums) {
        this.enums = enums;
    }

    public int getRecords() {
        return records;
    }

    public void setRecords(int records) {
        this.records = records;
    }

    public int getPackages() {
        return packages;
    }

    public void setPackages(int packages) {
        this.packages = packages;
    }

    public int getImports() {
        return imports;
    }

    public void setImports(int imports) {
        this.imports = imports;
    }

    public int getConstructors() {
        return constructors;
    }

    public void setConstructors(int constructors) {
        this.constructors = constructors;
    }

    public int getMethods() {
        return methods;
    }

    public void setMethods(int methods) {
        this.methods = methods;
    }

    public int getFields() {
        return fields;
    }

    public void setFields(int fields) {
        this.fields = fields;
    }

    public int getStaticMethods() {
        return staticMethods;
    }

    public void setStaticMethods(int staticMethods) {
        this.staticMethods = staticMethods;
    }

    public List<Map<String, Object>> getLargeClasses() {
        return largeClasses;
    }

    public void setLargeClasses(List<Map<String, Object>> largeClasses) {
        this.largeClasses = largeClasses;
    }

    public List<Map<String, Object>> getLongMethods() {
        return longMethods;
    }

    public void setLongMethods(List<Map<String, Object>> longMethods) {
        this.longMethods = longMethods;
    }

    public List<String> getUnusedImports() {
        return unusedImports;
    }

    public void setUnusedImports(List<String> unusedImports) {
        this.unusedImports = unusedImports;
    }

    public List<String> getDuplicateMethods() {
        return duplicateMethods;
    }

    public void setDuplicateMethods(List<String> duplicateMethods) {
        this.duplicateMethods = duplicateMethods;
    }

    public int getCyclomaticComplexityScore() {
        return cyclomaticComplexityScore;
    }

    public void setCyclomaticComplexityScore(int cyclomaticComplexityScore) {
        this.cyclomaticComplexityScore = cyclomaticComplexityScore;
    }

    public String getComplexityRating() {
        return complexityRating;
    }

    public void setComplexityRating(String complexityRating) {
        this.complexityRating = complexityRating;
    }

    public List<String> getDependencyNodes() {
        return dependencyNodes;
    }

    public void setDependencyNodes(List<String> dependencyNodes) {
        this.dependencyNodes = dependencyNodes;
    }

    public List<Map<String, String>> getDependencyEdges() {
        return dependencyEdges;
    }

    public void setDependencyEdges(List<Map<String, String>> dependencyEdges) {
        this.dependencyEdges = dependencyEdges;
    }
}
