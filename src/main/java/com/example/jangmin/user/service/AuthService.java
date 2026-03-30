package com.example.jangmin.user.service;

import com.example.jangmin.global.jwt.*;
import com.example.jangmin.redis.RedisService;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.dto.LoginRequestDto;
import com.example.jangmin.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * ✅ 로그인 (중복 로그인 차단 버전)
     */
    @Transactional
    public TokenResponseDto login(LoginRequestDto loginRequestDto) {

        // 1. 사용자 존재 확인
        User user = userRepository.findByUsername(loginRequestDto.username())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 아이디입니다."));

        // 2. 비밀번호 일치 확인
        if (!passwordEncoder.matches(loginRequestDto.password(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String username = user.getUsername();
        String role = user.getRole().name();

        // 🔥 3. [중복 로그인 차단 핵심] Redis에 이미 로그인 정보(AT:username)가 있는지 확인
        String existingToken = redisService.getValues("AT:" + username);

        if (existingToken != null) {
            throw new IllegalStateException("이미 다른 기기 또는 브라우저에서 로그인 중입니다. 기존 세션을 로그아웃한 후 다시 시도해주세요.");
        }

        // 4. 새 토큰 생성
        String accessToken = jwtUtil.createToken(username, role);
        String refreshToken = jwtUtil.createRefreshToken(username);

        // 5. Redis 저장
        redisService.setValues(
                username,
                refreshToken,
                Duration.ofMillis(jwtUtil.getRefreshTokenTimeToLive())
        );

        redisService.setValues(
                "AT:" + username,
                accessToken,
                Duration.ofMinutes(30)
        );

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(1000L * 60 * 30)
                .userId(user.getId())
                .build();
    }

    /**
     * ✅ 로그아웃
     */
    @Transactional
    public void logout(String accessToken) {
        if (accessToken.startsWith("Bearer ")) {
            accessToken = accessToken.substring(7).trim();
        }

        if (!jwtUtil.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        Claims claims = jwtUtil.getUserInfoFromToken(accessToken);
        String username = claims.getSubject();

        redisService.deleteValues("AT:" + username);
        redisService.deleteValues(username);

        long expiration = claims.getExpiration().getTime() - System.currentTimeMillis();
        expiration = Math.max(expiration, 1000 * 60 * 5);

        redisService.setBlackList(
                "blacklist:" + accessToken,
                "logout",
                Duration.ofMillis(expiration)
        );
    }

    /**
     * ✅ 토큰 재발급
     */
    @Transactional
    public TokenResponseDto reissue(String refreshToken) {
        if (refreshToken.startsWith("Bearer ")) {
            refreshToken = refreshToken.substring(7).trim();
        }

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 유효하지 않습니다.");
        }

        Claims claims = jwtUtil.getUserInfoFromToken(refreshToken);
        String username = claims.getSubject();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        String storedRefreshToken = redisService.getValues(username);
        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new IllegalArgumentException("세션이 만료되었습니다. 다시 로그인해주세요.");
        }

        String newAccessToken = jwtUtil.createToken(username, user.getRole().name());
        redisService.setValues(
                "AT:" + username,
                newAccessToken,
                Duration.ofMinutes(30)
        );

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(1000L * 60 * 30)
                .userId(user.getId())
                .build();
    }
}