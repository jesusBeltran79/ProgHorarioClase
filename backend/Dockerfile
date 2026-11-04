# Etapa 1. Compila el backend con Maven
FROM maven:3.9.9-eclipse-temurin-21 AS construccion
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -q -ntp -DskipTests package

# Etapa 2. Imagen liviana solo con el entorno de ejecución de Java
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=construccion /app/target/motor-horarios.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xss64m", "-jar", "app.jar"]
