package com.example.jangmin.user.service;

import com.example.jangmin.global.jwt.JwtUtil;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.domain.UserRole;
import com.example.jangmin.user.dto.LoginRequestDto;
import com.example.jangmin.user.dto.UserCreateDto;

import com.example.jangmin.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // 회원가입
    public User register(UserCreateDto userCreateDto) {
        if (userRepository.existsByUsername(userCreateDto.username())) {
            throw new IllegalArgumentException("아이디가 이미 존재합니다.");
        }

        User user = User.builder()
                .username(userCreateDto.username())
                .password(passwordEncoder.encode(userCreateDto.password()))
                .nickname(userCreateDto.nickname())
                .email(userCreateDto.email())
                .role(UserRole.USER)
                .build();

        return userRepository.save(user);
    }

    // 로그인
    @Transactional(readOnly = true)
    public void login(LoginRequestDto loginRequestDto, HttpServletResponse response) {
        String username = loginRequestDto.username();
        String password = loginRequestDto.password();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("등록된 사용자가 없습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 토큰 생성 및 헤더에 추가
        String token = jwtUtil.createToken(user.getUsername(), user.getRole().toString());
        response.addHeader(JwtUtil.AUTHORIZATION_HEADER, token);
    }

    // 닉네임 변경
    public User updateNickname(UserCreateDto userCreateDto) {
        User user = userRepository.findByUsername(userCreateDto.username())
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        user.updateNickname(userCreateDto.nickname());
        return user;
    }
}