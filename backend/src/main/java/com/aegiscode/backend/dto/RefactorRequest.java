package com.aegiscode.backend.dto;

public class RefactorRequest {
    private String language;
    private String fileContent;
    private String selectedText;
    private String scope; // "selection", "method", "file"
    private Integer cursorLine;
    private String intent;

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getFileContent() {
        return fileContent;
    }

    public void setFileContent(String fileContent) {
        this.fileContent = fileContent;
    }

    public String getSelectedText() {
        return selectedText;
    }

    public void setSelectedText(String selectedText) {
        this.selectedText = selectedText;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Integer getCursorLine() {
        return cursorLine;
    }

    public void setCursorLine(Integer cursorLine) {
        this.cursorLine = cursorLine;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }
}
