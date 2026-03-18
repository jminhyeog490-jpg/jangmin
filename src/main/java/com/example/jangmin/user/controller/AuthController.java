package com.example.jangmin.user.controller;

import com.example.jangmin.global.jwt.TokenResponseDto;
import com.example.jangmin.user.dto.LoginRequestDto;
import com.example.jangmin.user.service.AuthService;
import com.example.jangmin.user.service.EmailService; // EmailService 주입 필요
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService; // 이메일 서비스 추가

    // 1. 로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        TokenResponseDto tokenResponseDto = authService.login(loginRequestDto);
        return ResponseEntity.ok(tokenResponseDto);
    }

    // 2. 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String accessToken) {
        String token = accessToken.substring(7);
        authService.logout(token);
        return ResponseEntity.ok("로그아웃 성공");
    }


    // 3. 토큰 재발급
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponseDto> reissue(@RequestHeader("Authorization") String refreshToken) {
        String token = refreshToken.substring(7);
        TokenResponseDto tokenResponseDto = authService.reissue(token);
        return ResponseEntity.ok(tokenResponseDto);
    }

    // 4. 이메일 인증번호 발송
    // 사용자가 이메일을 입력하고 '인증번호 받기'를 눌렀을 때 호출
    @PostMapping("/email-send")
    public ResponseEntity<String> sendEmail(@RequestParam String email) {
        emailService.sendVerificationCode(email);
        return ResponseEntity.ok("인증번호가 해당 이메일로 발송되었습니다.");
    }

    // 5. 이메일 인증번호 확인
    // 사용자가 번호를 입력하고 '확인'을 눌렀을 때 호출
    @PostMapping("/email-verify")
    public ResponseEntity<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
        boolean isVerified = emailService.verifyCode(email, code);

        if (isVerified) {
            return ResponseEntity.ok("이메일 인증에 성공하였습니다.");
        } else {
            // 400 Bad Request와 함께 실패 메시지 반환
            return ResponseEntity.badRequest().body("인증번호가 일치하지 않거나 만료되었습니다.");
        }
    }
}