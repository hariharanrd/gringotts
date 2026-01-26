# Use a multi-stage build to keep the final image small
# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8787

# Set environment variables (can be overridden at runtime)
ENV SERVER_PORT=8787

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
