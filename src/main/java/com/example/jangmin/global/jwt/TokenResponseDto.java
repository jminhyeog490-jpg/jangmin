package com.example.jangmin.global.jwt;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenResponseDto {
    private String grantType;      // 보통 "Bearer"라고 보냅니다.
    private String accessToken;
    private String refreshToken;
    private Long accessTokenExpiresIn; // 액세스 토큰 만료 시간 (밀리초)
}