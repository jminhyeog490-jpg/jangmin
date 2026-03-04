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
    @PatchMapping("/nickname")
    public ResponseEntity<User> updateNickname(@RequestBody UserCreateDto userCreateDto) {

        // 서비스 호출하여 닉네임 변경 실행
        User updatedUser = userService.updateNickname(userCreateDto);

        // 변경된 사용자 정보와 함께 200 OK 응답 반환
        return ResponseEntity.ok(updatedUser);
    }
}

