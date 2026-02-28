package com.example.jangmin.global.jwt;

import com.example.jangmin.user.service.CustomUserDetailsService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils; // 추가
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 1. 토큰 추출 (JwtUtil 내부의 resolveToken을 사용하되 여기서도 trim 처리를 한 번 더 수행)
        String token = jwtUtil.resolveToken(request);

        try {
            if (token != null) {
                // 혹시 모를 공백 제거 (방어적 코드)
                token = token.trim();

                if (!jwtUtil.validateToken(token)) {
                    log.error("유효하지 않은 토큰입니다.");
                } else {
                    // 2. 토큰이 유효하면 인증 객체 설정
                    Claims claims = jwtUtil.getUserInfoFromToken(token);
                    setAuthentication(claims.getSubject());
                }
            }
        } catch (Exception e) {
            // 토큰 해석 중 에러(공백 등)가 발생해도 서버가 터지지 않게 잡음
            log.error("Security Filter 인증 과정에서 에러 발생: {}", e.getMessage());
        }

        // 3. 🔴 매우 중요: 인증 성공 여부와 상관없이 다음 필터로 넘겨야 permitAll()이 작동함
        filterChain.doFilter(request, response);
    }

    public void setAuthentication(String username) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        Authentication authentication = createAuthentication(username);
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
    }

    public Authentication createAuthentication(String username) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }
}