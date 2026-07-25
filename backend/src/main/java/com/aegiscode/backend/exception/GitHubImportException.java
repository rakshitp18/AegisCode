package com.aegiscode.backend.exception;

public class GitHubImportException extends RuntimeException {
    private final String errorCode;

    public GitHubImportException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public GitHubImportException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
