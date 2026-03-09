package com.pos.system.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Converts Render's DATABASE_URL (postgresql://user:pass@host:port/db)
 * into the JDBC format required by Spring Boot (jdbc:postgresql://host:port/db).
 *
 * Render provides DATABASE_URL in standard PostgreSQL URI format, but the
 * PostgreSQL JDBC driver requires the jdbc: prefix.
 */
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "DATABASE_URL")
    public DataSource dataSource() throws URISyntaxException {
        // Parse the Render DATABASE_URL: postgresql://user:pass@host:port/db
        // or postgres://user:pass@host:port/db
        String cleanUrl = databaseUrl
                .replace("postgresql://", "")
                .replace("postgres://", "");

        URI uri = new URI("postgres://" + cleanUrl);

        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String dbName = uri.getPath().replaceFirst("/", "");
        String[] userInfo = uri.getUserInfo().split(":");
        String username = userInfo[0];
        String password = userInfo.length > 1 ? userInfo[1] : "";

        String jdbcUrl = String.format(
                "jdbc:postgresql://%s:%d/%s?sslmode=require",
                host, port, dbName
        );

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setMaximumPoolSize(5);
        ds.setConnectionTimeout(30000);
        ds.setIdleTimeout(600000);
        ds.setMaxLifetime(1800000);

        return ds;
    }
}
