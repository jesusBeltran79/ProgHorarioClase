package co.edu.unbosque.horarios.seguridad;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/** Emite y valida los tokens JWT firmados con HMAC SHA-256 (RNF-06). */
@Service
public class ServicioJwt {

    private final SecretKey clave;
    private final long minutos;

    public ServicioJwt(@Value("${app.jwt.secreto}") String secreto, @Value("${app.jwt.minutos:480}") long minutos) {
        if (secreto.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.jwt.secreto debe tener al menos 32 caracteres");
        }
        this.clave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
        this.minutos = minutos;
    }

    public String emitir(String usuario, String rol) {
        return emitir(usuario, rol, null);
    }

    /** El token lleva el rol y, para un DOCENTE, el identificador de su registro docente. */
    public String emitir(String usuario, String rol, String idDocente) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(usuario)
                .claim("rol", rol)
                .claim("idDocente", idDocente)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(minutos, ChronoUnit.MINUTES)))
                .signWith(clave)
                .compact();
    }

    public long segundosDeVigencia() {
        return minutos * 60;
    }

    /** Devuelve las afirmaciones del token si la firma y la vigencia son válidas. */
    public Optional<Claims> validar(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
