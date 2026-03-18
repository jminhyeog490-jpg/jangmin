package com.example.jangmin.user.service;

import com.example.jangmin.global.jwt.*;
import com.example.jangmin.redis.RedisService;
import com.example.jangmin.user.domain.User; // 유저 엔티티 임포트
import com.example.jangmin.user.dto.LoginRequestDto;
import com.example.jangmin.user.repository.UserRepository; // 유저 레포지토리 임포트
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder; // 패스워드 인코더 임포트
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;
    private final UserRepository userRepository; // ✨ 추가: DB 조회를 위해 필요
    private final PasswordEncoder passwordEncoder; // ✨ 추가: 비밀번호 비교를 위해 필요

    @Transactional
    public TokenResponseDto login(LoginRequestDto loginRequestDto) {
        // 1. DB에서 사용자 조회 (회원가입 여부 확인)
        User user = userRepository.findByUsername(loginRequestDto.username())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 아이디입니다."));

        // 2. 비밀번호 일치 여부 확인
        if (!passwordEncoder.matches(loginRequestDto.password(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 사용자 정보 추출
        String username = user.getUsername();
        String role = user.getRole().name(); // DB에 저장된 실제 Role 사용

        // 4. 토큰 생성
        String accessToken = jwtUtil.createToken(username, role);
        String refreshToken = jwtUtil.createRefreshToken(username);

        // 5. Redis에 Refresh Token 저장
        redisService.setValues(username, refreshToken, jwtUtil.getRefreshTokenTimeToLive());

        // 6. 응답 데이터 구성 (userId 포함)
        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .userId(user.getId()) // ✨ 추가: 리액트가 저장할 수 있도록 유저 PK 전달
                .build();
    }

    @Transactional
    public void logout(String accessToken) {
        if (!jwtUtil.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        Claims claims = jwtUtil.getUserInfoFromToken(accessToken);
        String username = claims.getSubject();
        long expiration = claims.getExpiration().getTime() - System.currentTimeMillis();

        if (redisService.getValues(username) != null) {
            redisService.deleteValues(username);
        }

        if (expiration > 0) {
            expiration = 1000 * 60 * 5;

            redisService.setBlackList("blacklist:" + accessToken, "logout", Duration.ofMillis(expiration));
        }
    }

    @Transactional
    public TokenResponseDto reissue(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 유효하지 않습니다.");
        }

        Claims claims = jwtUtil.getUserInfoFromToken(refreshToken);
        String username = claims.getSubject();

        // DB에서 최신 유저 정보 확인 (Role 등)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        String storedRefreshToken = redisService.getValues(username);

        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 일치하지 않거나 만료되었습니다.");
        }

        String newAccessToken = jwtUtil.createToken(username, user.getRole().name());

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .userId(user.getId()) // 재발급 시에도 ID 유지
                .build();
    }
}