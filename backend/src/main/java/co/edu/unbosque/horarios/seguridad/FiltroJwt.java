package co.edu.unbosque.horarios.seguridad;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee el encabezado Authorization: Bearer y, si el token es válido, deja autenticado al usuario
 * con su rol. No es un bean para que Spring no lo registre dos veces como filtro del servidor.
 */
public class FiltroJwt extends OncePerRequestFilter {

    private final ServicioJwt jwt;

    public FiltroJwt(ServicioJwt jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest solicitud, HttpServletResponse respuesta, FilterChain cadena)
            throws ServletException, IOException {
        String encabezado = solicitud.getHeader(HttpHeaders.AUTHORIZATION);
        if (encabezado != null && encabezado.startsWith("Bearer ")) {
            jwt.validar(encabezado.substring(7)).ifPresent((Claims c) -> {
                String rol = String.valueOf(c.get("rol"));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        c.getSubject(), null, List.of(new SimpleGrantedAuthority("ROLE_" + rol)));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        cadena.doFilter(solicitud, respuesta);
    }
}
