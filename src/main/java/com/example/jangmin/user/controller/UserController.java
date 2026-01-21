package com.example.jangmin.user.controller;

import com.example.jangmin.global.CustomUserDetails;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.dto.UserCreateDto;
import com.example.jangmin.user.dto.UserResponseDto;
import com.example.jangmin.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<String> register(@Valid @RequestBody UserCreateDto userCreateDto) {
        userService.register(userCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
    }

    // 로그인(/api/users/login)과 로그아웃(/api/users/logout)은 SecurityConfig에서 처리합니다.

    // 사용자 조회 (로그인된 사용자만 가능)
    @GetMapping("/find")
    public ResponseEntity<UserResponseDto> getMyInfo(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        if (customUserDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = customUserDetails.getUser();

        // User 엔티티를 UserResponseDto로 변환
        UserResponseDto responseDto = new UserResponseDto(
                user.getId(),
                null, // 비밀번호는 보안상 null 처리하거나 제외
                user.getUsername(),
                user.getNickname(),
                user.getEmail()
        );

        return ResponseEntity.ok(responseDto);
    }

    //닉네임 변경
    @PutMapping ("/updateNickname")
    public ResponseEntity<String> updateNickname(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody String newNickname // 실제로는 DTO를 쓰는 것이 좋습니다
    ) {
        userService.updateNickname(userDetails.getUsername(), newNickname);
        return ResponseEntity.ok("닉네임이 변경되었습니다.");
    }
}
