package com.example.jangmin.user.controller;

import com.example.jangmin.global.jwt.TokenResponseDto;
import com.example.jangmin.user.dto.LoginRequestDto;
import com.example.jangmin.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 1. 로그인: ID/PW를 받아 AccessToken, RefreshToken 반환
    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        TokenResponseDto tokenResponseDto = authService.login(loginRequestDto);

        // 성공 시 200 OK와 함께 토큰 정보가 담긴 DTO 반환
        return ResponseEntity.ok(tokenResponseDto);
    }

    // 2. 로그아웃: 헤더의 AccessToken을 받아 무효화 (블랙리스트)
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String accessToken) {
        // "Bearer " 접두사를 제거하고 서비스에 전달
        String token = accessToken.substring(7);
        authService.logout(token);

        return ResponseEntity.ok("로그아웃 성공");
    }

    // 3. 토큰 재발급: 헤더의 RefreshToken을 받아 AccessToken 재발급
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponseDto> reissue(@RequestHeader("Authorization") String refreshToken) {
        // "Bearer " 접두사를 제거하고 서비스에 전달
        String token = refreshToken.substring(7);
        TokenResponseDto tokenResponseDto = authService.reissue(token);

        return ResponseEntity.ok(tokenResponseDto);
    }
}