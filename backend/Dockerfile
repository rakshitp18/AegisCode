# Stage 1: Build Java Spring Boot app
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy project files
COPY . .

# Grant execute permission to Maven wrapper and build jar
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests --no-transfer-progress

# Stage 2: Production runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8000

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
