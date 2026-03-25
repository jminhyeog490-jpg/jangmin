package com.example.jangmin.global.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.time.Duration;

@Slf4j
@Component
public class JwtUtil {

    private static final String SECRET_KEY = "jangminProjectSecretKeyForJwtTokenGenerationMustBeLongEnough";
    private static final long TOKEN_TIME = 60 * 60 * 1000L; // 1시간
    private static final long REFRESH_TOKEN_TIME = 7 * 24 * 60 * 60 * 1000L; // 7일

    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    private Key key;
    private final SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

    @PostConstruct
    public void init() {
        byte[] bytes = Base64.getDecoder()
                .decode(Base64.getEncoder().encodeToString(SECRET_KEY.getBytes()));
        key = Keys.hmacShaKeyFor(bytes);
    }

    // ✅ Access Token 생성 (Bearer 제거!!)
    public String createToken(String username, String role) {
        Date date = new Date();

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setExpiration(new Date(date.getTime() + TOKEN_TIME))
                .setIssuedAt(date)
                .signWith(key, signatureAlgorithm)
                .compact();
    }

    // ✅ Refresh Token 생성 (그대로 유지)
    public String createRefreshToken(String username) {
        Date date = new Date();

        return Jwts.builder()
                .setSubject(username)
                .setExpiration(new Date(date.getTime() + REFRESH_TOKEN_TIME))
                .setIssuedAt(date)
                .signWith(key, signatureAlgorithm)
                .compact();
    }

    // ✅ 헤더에서 토큰 추출 (Bearer 제거)
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }

    // ✅ 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature");
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException e) {
            log.error("JWT claims is empty");
        }
        return false;
    }

    // ✅ 토큰에서 사용자 정보 추출
    public Claims getUserInfoFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Duration getRefreshTokenTimeToLive() {
        return Duration.ofMillis(REFRESH_TOKEN_TIME);
    }
}