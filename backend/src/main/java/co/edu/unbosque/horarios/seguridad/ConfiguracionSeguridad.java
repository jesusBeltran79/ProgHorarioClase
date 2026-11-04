package co.edu.unbosque.horarios.seguridad;

import com.fasterxml.jackson.databind.ObjectMapper;
import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Seguridad sin sesión de servidor. Solo el inicio de sesión y la verificación de salud son públicos.
 * Todo /api/** exige un token JWT de un usuario con rol ADMIN (RNF-06).
 */
@Configuration
public class ConfiguracionSeguridad {

    @Bean
    public PasswordEncoder codificador() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain cadena(HttpSecurity http, ServicioJwt jwt, ObjectMapper json) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(c -> { })
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/health/**", "/error").permitAll()
                    .requestMatchers("/api/**").hasRole("ADMIN")
                    .anyRequest().permitAll())
            .exceptionHandling(e -> e
                    .authenticationEntryPoint((req, res, ex) -> escribir(res, 401, json,
                            new Dto.Error("NO_AUTENTICADO", "Debe iniciar sesión para usar esta función", List.of())))
                    .accessDeniedHandler((req, res, ex) -> escribir(res, 403, json,
                            new Dto.Error("SIN_PERMISO", "Su perfil no tiene permiso para esta función", List.of()))))
            .addFilterBefore(new FiltroJwt(jwt), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origenes}") String origenes) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(Arrays.stream(origenes.split(",")).map(String::trim).toList());
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        c.setExposedHeaders(List.of("Content-Disposition"));
        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/api/**", c);
        return fuente;
    }

    private static void escribir(jakarta.servlet.http.HttpServletResponse res, int estado, ObjectMapper json, Dto.Error error)
            throws java.io.IOException {
        res.setStatus(estado);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        json.writeValue(res.getOutputStream(), error);
    }
}
