package com.example.jangmin.user.service;

import com.example.jangmin.global.jwt.*;
import com.example.jangmin.redis.RedisService;
import com.example.jangmin.user.dto.LoginRequestDto;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;

    @Transactional
    public TokenResponseDto login(LoginRequestDto loginRequestDto) {
        String username = loginRequestDto.username();
        String role = "USER"; // 실제로는 DB에서 조회한 Role을 사용해야 함

        String accessToken = jwtUtil.createToken(username, role);
        String refreshToken = jwtUtil.createRefreshToken(username);

        // Redis에 Refresh Token 저장 (Key: username, Value: refreshToken, Duration: 7일)
        redisService.setValues(username, refreshToken, jwtUtil.getRefreshTokenTimeToLive());

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .build();
    }

    @Transactional
    public void logout(String accessToken) {
        // 1. 토큰 검증
        if (!jwtUtil.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        // 2. 토큰에서 사용자 정보 및 만료 시간 추출
        Claims claims = jwtUtil.getUserInfoFromToken(accessToken);
        String username = claims.getSubject();
        long expiration = claims.getExpiration().getTime() - System.currentTimeMillis();

        // 3. Redis에서 해당 유저의 RefreshToken 삭제
        if (redisService.getValues(username) != null) {
            redisService.deleteValues(username);
        }

        // 4. AccessToken 블랙리스트 등록 (남은 시간만큼만 유지)
        if (expiration > 0) {
            redisService.setBlackList("blacklist:" + accessToken, "logout", Duration.ofMillis(expiration));
        }
    }

    // 토큰 재발급
    @Transactional
    public TokenResponseDto reissue(String refreshToken) {
        // 1. Refresh Token 검증
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 유효하지 않습니다.");
        }

        // 2. 토큰에서 사용자 정보 추출
        Claims claims = jwtUtil.getUserInfoFromToken(refreshToken);
        String username = claims.getSubject();

        // 3. Redis에 저장된 Refresh Token 가져오기
        String storedRefreshToken = redisService.getValues(username);

        // 4. Redis에 저장된 토큰과 일치하는지 확인
        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 일치하지 않거나 만료되었습니다.");
        }

        // 5. 새로운 Access Token 생성
        String role = "USER"; // 실제로는 DB에서 조회하거나 Claims에서 가져와야 함
        String newAccessToken = jwtUtil.createToken(username, role);

        // Refresh Token Rotation (선택 사항): 보안을 위해 Refresh Token도 새로 발급할 수 있음
        // 여기서는 Access Token만 재발급하는 것으로 구현

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // 기존 Refresh Token 반환
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .build();
    }
}