package com.example.jangmin.global.jwt;

import lombok.Builder;

@Builder
public record TokenResponseDto(
        String grantType,
        String accessToken,
        String refreshToken,
        Long accessTokenExpiresIn,
        Long userId // ✨ 이 필드를 추가해야 builder().userId()가 작동합니다.
) {}