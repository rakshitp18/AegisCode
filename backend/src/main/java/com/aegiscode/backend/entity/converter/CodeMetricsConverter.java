package com.aegiscode.backend.entity.converter;

import com.aegiscode.backend.dto.CodeMetrics;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.io.IOException;

@Converter
public class CodeMetricsConverter implements AttributeConverter<CodeMetrics, String> {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(CodeMetrics attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return mapper.writeValueAsString(attribute);
        } catch (IOException e) {
            throw new IllegalArgumentException("Error converting CodeMetrics to JSON string", e);
        }
    }

    @Override
    public CodeMetrics convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            return mapper.readValue(dbData, CodeMetrics.class);
        } catch (IOException e) {
            throw new IllegalArgumentException("Error converting JSON string to CodeMetrics", e);
        }
    }
}
