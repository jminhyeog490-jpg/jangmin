package com.example.jangmin.user.controller;

import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.dto.UserCreateDto;
import com.example.jangmin.user.dto.UserResponseDto;
import com.example.jangmin.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")

public class UserController {
    private final UserService userService;

    @PatchMapping("/signup")
    public ResponseEntity<String> register(@Valid @RequestBody UserResponseDto userResponseDto) {
        User user = userService.register(userResponseDto);
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
    }


}
