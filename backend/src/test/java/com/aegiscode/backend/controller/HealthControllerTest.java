package com.aegiscode.backend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class HealthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DataSource dataSource;

    @BeforeEach
    void setUp() {
        HealthController healthController = new HealthController(dataSource);
        this.mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();
    }

    @Test
    void testHealthEndpointReturnsUpWhenDatabaseValid() throws Exception {
        Connection mockConnection = mock(Connection.class);
        given(dataSource.getConnection()).willReturn(mockConnection);
        given(mockConnection.isValid(anyInt())).willReturn(true);

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("AegisCode Backend"))
                .andExpect(jsonPath("$.components.database").value("UP"));
    }

    @Test
    void testApiHealthEndpointReturnsUpWhenDatabaseValid() throws Exception {
        Connection mockConnection = mock(Connection.class);
        given(dataSource.getConnection()).willReturn(mockConnection);
        given(mockConnection.isValid(anyInt())).willReturn(true);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("AegisCode Backend"))
                .andExpect(jsonPath("$.components.database").value("UP"));
    }

    @Test
    void testHealthEndpointReturnsDegradedWhenDatabaseDown() throws Exception {
        given(dataSource.getConnection()).willThrow(new RuntimeException("DB Connection error"));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DEGRADED"))
                .andExpect(jsonPath("$.components.database").value("DOWN"));
    }
}
