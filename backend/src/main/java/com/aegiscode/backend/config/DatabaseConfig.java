package com.aegiscode.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = dbUrl;
        }

        if (rawUrl != null && !rawUrl.trim().isEmpty()) {
            rawUrl = rawUrl.trim();
            String cleanUrl = rawUrl;

            if (cleanUrl.startsWith("jdbc:")) {
                cleanUrl = cleanUrl.substring(5);
            }

            if (cleanUrl.startsWith("postgres://")) {
                cleanUrl = "http://" + cleanUrl.substring(11);
            } else if (cleanUrl.startsWith("postgresql://")) {
                cleanUrl = "http://" + cleanUrl.substring(13);
            } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                cleanUrl = "http://" + cleanUrl;
            }

            try {
                URI uri = new URI(cleanUrl);
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String query = uri.getQuery();

                String username = dbUsername;
                String password = dbPassword;

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    if (userInfo.length > 0 && !userInfo[0].isEmpty()) {
                        username = userInfo[0];
                    }
                    if (userInfo.length > 1 && !userInfo[1].isEmpty()) {
                        password = userInfo[1];
                    }
                }

                if (host != null && !host.isEmpty()) {
                    StringBuilder jdbcUrlBuilder = new StringBuilder("jdbc:postgresql://");
                    jdbcUrlBuilder.append(host);
                    if (port != -1) {
                        jdbcUrlBuilder.append(":").append(port);
                    }
                    if (path != null) {
                        jdbcUrlBuilder.append(path);
                    }
                    if (query != null && !query.isEmpty()) {
                        jdbcUrlBuilder.append("?").append(query);
                    }

                    config.setJdbcUrl(jdbcUrlBuilder.toString());
                    if (username != null && !username.isEmpty()) {
                        config.setUsername(username);
                    }
                    if (password != null && !password.isEmpty()) {
                        config.setPassword(password);
                    }
                    config.setDriverClassName("org.postgresql.Driver");

                    return new HikariDataSource(config);
                }
            } catch (Exception e) {
                // Fallback below if URI parsing fails
            }
        }

        config.setJdbcUrl(dbUrl);
        config.setUsername(dbUsername);
        config.setPassword(dbPassword);
        config.setDriverClassName("org.postgresql.Driver");

        return new HikariDataSource(config);
    }
}
