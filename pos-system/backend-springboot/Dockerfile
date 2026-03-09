# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy only the built JAR from the build stage
COPY --from=build /app/target/pos-system-1.0.0.jar app.jar

# Render injects $PORT at runtime — Spring Boot reads server.port=${PORT:8081}
EXPOSE 8081

ENTRYPOINT ["java", "-Xmx400m", "-Xms200m", "-jar", "app.jar"]
