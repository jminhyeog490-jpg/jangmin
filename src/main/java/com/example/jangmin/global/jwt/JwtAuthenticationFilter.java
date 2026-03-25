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
import org.springframework.util.StringUtils; // 추가
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final RedisService redisService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // 1. 토큰 추출 (JwtUtil 내부의 resolveToken을 사용하되 여기서도 trim 처리를 한 번 더 수행)
        String token = jwtUtil.resolveToken(request);

        try {
            if (token != null) {
                token = token.trim();

                if (!jwtUtil.validateToken(token)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("유효하지 않은 토큰");
                    return;
                }
                token = token.replace("Bearer ", "").trim();
                Claims claims = jwtUtil.getUserInfoFromToken(token);
                String username = claims.getSubject();

                // ✅ Redis 검증 먼저
                String savedToken = redisService.getValues("AT:" + username);



                if (savedToken != null && !savedToken.equals(token)) {
                    log.error("다른 곳에서 로그인됨: {}", username);

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("다른 기기에서 로그인되었습니다.");
                    return; // 💥 여기서 반드시 끊기
                }

                // ✅ 통과한 경우만 인증
                setAuthentication(username);

            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("인증 실패: " + e.getMessage());
            return; // 💥 필수
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