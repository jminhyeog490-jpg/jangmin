package com.example.jangmin.user.controller;

import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.dto.UserCreateDto;
import com.example.jangmin.user.dto.UserResponseDto;
import com.example.jangmin.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.management.remote.JMXAuthenticator;
import java.util.Locale;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")

public class UserController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;





    @PostMapping ("/signup")
    public ResponseEntity<String> register(@Valid @RequestBody UserResponseDto userResponseDto) {
        User user = userService.register(userResponseDto);
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserResponseDto userResponseDto) {
        // 1. 사용자가 보낸 ID/PW로 인증되지 않은 토큰 생성
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(userResponseDto.username(), userResponseDto.password());

        // 2. ★ 핵심: AuthenticationManager를 통해 실제 검증 실행 ★
        // 이 과정에서 DB의 비번과 대조하며, 틀리면 예외(Exception)를 던집니다.

        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        // 3. 검증된 인증 정보를 시큐리티 컨텍스트에 저장 (세션 생성)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return ResponseEntity.ok("로그인 성공");
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        return ResponseEntity.ok("로그아웃 성공");
    }



}
