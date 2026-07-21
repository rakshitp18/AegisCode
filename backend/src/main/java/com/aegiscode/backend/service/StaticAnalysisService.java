package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.CodeMetrics;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class StaticAnalysisService {

    public CodeMetrics analyzeStatic(String language, String code) {
        if (code == null) {
            code = "";
        }

        int lines = code.isEmpty() ? 0 : code.split("\r\n|\r|\n", -1).length;

        int todos = countMatches("TODO|FIXME", code, Pattern.CASE_INSENSITIVE);
        int classes = countMatches("\\bclass\\b", code, 0);
        int methods = countMatches("(public|private|protected).*?\\(", code, 0);
        int printStatements = countMatches("System\\.out\\.println|print\\(", code, 0);

        return new CodeMetrics(lines, todos, classes, methods, printStatements);
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
