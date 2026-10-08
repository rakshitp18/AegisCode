package com.aegiscode.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = dbUrl;
        }

        String envUsername = System.getenv("SPRING_DATASOURCE_USERNAME");
        String username = (envUsername != null && !envUsername.trim().isEmpty()) ? envUsername : dbUsername;

        String envPassword = System.getenv("SPRING_DATASOURCE_PASSWORD");
        String password = (envPassword != null) ? envPassword : dbPassword;

        if (rawUrl != null && rawUrl.toLowerCase().contains("jdbc:h2:")) {
            return createH2DataSource(rawUrl, username, password);
        }

        try {
            HikariConfig config = new HikariConfig();
            String finalJdbcUrl = rawUrl;
            String finalUsername = username;
            String finalPassword = password;

            if (rawUrl != null && !rawUrl.trim().isEmpty()) {
                String cleanUrl = rawUrl.trim();
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

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":", 2);
                        if (userInfo.length > 0 && !userInfo[0].isEmpty()) {
                            finalUsername = userInfo[0];
                        }
                        if (userInfo.length > 1 && !userInfo[1].isEmpty()) {
                            finalPassword = userInfo[1];
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
                        finalJdbcUrl = jdbcUrlBuilder.toString();
                    }
                } catch (Exception ignored) {
                }
            }

            config.setJdbcUrl(finalJdbcUrl);
            if (finalUsername != null) {
                config.setUsername(finalUsername);
            }
            if (finalPassword != null) {
                config.setPassword(finalPassword);
            }
            config.setDriverClassName("org.postgresql.Driver");
            config.setInitializationFailTimeout(3000);

            HikariDataSource pgDs = new HikariDataSource(config);
            logger.info("Successfully connected to PostgreSQL database at {}", finalJdbcUrl);
            return pgDs;
        } catch (Exception e) {
            logger.warn("Could not connect to PostgreSQL database: {}. Falling back to embedded H2 database.", e.getMessage());
            return createH2DataSource("jdbc:h2:file:./data/aegiscodedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;AUTO_SERVER=TRUE", "sa", "");
        }
    }

    private DataSource createH2DataSource(String jdbcUrl, String user, String pass) {
        HikariConfig h2Config = new HikariConfig();
        h2Config.setJdbcUrl(jdbcUrl);
        h2Config.setUsername(user != null && !user.isEmpty() ? user : "sa");
        h2Config.setPassword(pass != null ? pass : "");
        h2Config.setDriverClassName("org.h2.Driver");
        logger.info("Initializing embedded H2 database at {}", jdbcUrl);
        return new HikariDataSource(h2Config);
    }
}
