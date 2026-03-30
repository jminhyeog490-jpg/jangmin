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

        // ✅ 1. 인증 제외 경로 (로그인, 로그아웃, 그리고 채팅/H2 등 필요한 경로 추가)
        if (uri.contains("/api/auth/login") || uri.contains("/api/auth/logout") || uri.contains("/api/users/signup") ||uri.contains("/ws-stomp")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ 2. 토큰 추출
        String token = jwtUtil.resolveToken(request);

        try {
            if (StringUtils.hasText(token)) {
                token = token.trim();

                // "Bearer " 제거 (이미 제거되어 있을 수도 있으니 확인 후 처리)
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }

                // ✅ 3. 토큰 유효성 검사
                if (!jwtUtil.validateToken(token)) {
                    log.error("❌ 유효하지 않은 토큰");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("유효하지 않은 토큰입니다.");
                    return;
                }
                // 🔥 블랙리스트 체크
                String isBlackList = redisService.getValues("blacklist:" + token);

                if (isBlackList != null) {
                    log.error("❌ 블랙리스트 토큰 접근 차단");

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("이미 로그아웃된 토큰입니다.");
                    return;
                }

                // ✅ 4. 사용자 정보 추출
                Claims claims = jwtUtil.getUserInfoFromToken(token);
                String username = claims.getSubject();

                // ✅ 5. Redis에서 현재 토큰 조회 및 비교 로직 개선
                String savedToken = redisService.getValues("AT:" + username);

                if (savedToken != null) {
                    // 중요: Redis에 저장된 토큰도 Bearer 가 붙어있다면 제거 후 비교해야 함
                    String pureSavedToken = savedToken.startsWith("Bearer ") ? savedToken.substring(7) : savedToken;

                    log.info("🟡 savedToken(Pure) = {}", pureSavedToken);
                    log.info("🟡 requestToken = {}", token);

                    if (!pureSavedToken.equals(token)) {
                        log.error("❌ 중복 로그인 차단: {}", username);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("다른 기기에서 로그인되었습니다.");
                        return;
                    }
                }

                // ✅ 6. 인증 설정
                setAuthentication(username);
            }
        } catch (Exception e) {
            log.error("❌ 인증 과정 중 오류 발생", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("인증 실패");
            return;
        }

        // ✅ 7. 다음 필터 진행
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