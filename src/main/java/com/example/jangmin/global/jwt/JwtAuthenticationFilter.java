package com.example.jangmin.global.jwt;

import com.example.jangmin.redis.RedisService;
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
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final RedisService redisService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // ✅ 1. 로그인 / 로그아웃은 무조건 통과
        if (uri.contains("/api/auth/login") || uri.contains("/api/auth/logout")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ 2. 토큰 추출
        String token = jwtUtil.resolveToken(request);

        try {
            // 토큰이 있을 때만 검사
            if (StringUtils.hasText(token)) {

                token = token.trim();

                // "Bearer " 제거
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }

                // ✅ 3. 토큰 유효성 검사
                if (!jwtUtil.validateToken(token)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("유효하지 않은 토큰");
                    return;
                }

                // ✅ 4. 사용자 정보 추출
                Claims claims = jwtUtil.getUserInfoFromToken(token);
                String username = claims.getSubject();

                // ✅ 5. Redis에서 현재 토큰 조회
                String savedToken = redisService.getValues("AT:" + username);

                log.info("🟡 savedToken = {}", savedToken);
                log.info("🟡 requestToken = {}", token);

                // ✅ 6. 동시 로그인 체크
                if (savedToken != null && !savedToken.equals(token)) {
                    log.error("❌ 다른 곳에서 로그인됨: {}", username);

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("다른 기기에서 로그인되었습니다.");
                    return;
                }

                // ✅ 7. 인증 설정
                setAuthentication(username);
            }

        } catch (Exception e) {
            log.error("❌ 인증 실패", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("인증 실패");
            return;
        }

        // ✅ 8. 다음 필터 진행 (필수)
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
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
    }
}