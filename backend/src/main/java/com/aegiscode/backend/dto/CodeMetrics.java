package com.aegiscode.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CodeMetrics {
    private int lines;
    private int todos;
    private int classes;
    private int methods;
    
    @JsonProperty("print_statements")
    private int printStatements;

    public CodeMetrics() {
    }

    public CodeMetrics(int lines, int todos, int classes, int methods, int printStatements) {
        this.lines = lines;
        this.todos = todos;
        this.classes = classes;
        this.methods = methods;
        this.printStatements = printStatements;
    }

    public int getLines() {
        return lines;
    }

    public void setLines(int lines) {
        this.lines = lines;
    }

    public int getTodos() {
        return todos;
    }

    public void setTodos(int todos) {
        this.todos = todos;
    }

    public int getClasses() {
        return classes;
    }

    public void setClasses(int classes) {
        this.classes = classes;
    }

    public int getMethods() {
        return methods;
    }

    public void setMethods(int methods) {
        this.methods = methods;
    }

    public int getPrintStatements() {
        return printStatements;
    }

    public void setPrintStatements(int printStatements) {
        this.printStatements = printStatements;
    }
}
