package com.example.jangmin.user.service;

import com.example.jangmin.global.jwt.JwtUtil;
import com.example.jangmin.redis.RedisService; // RedisService 임포트
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
    private final RedisService redisService; // 인증 상태 확인을 위한 Redis 주입

    // 회원가입
    public User register(UserCreateDto userCreateDto) {
        // 1. 아이디 중복 확인
        if (userRepository.existsByUsername(userCreateDto.username())) {
            throw new IllegalArgumentException("아이디가 이미 존재합니다.");
        }

        // 2.  이메일 인증 완료 여부 검증
        // EmailService.verifyCode 성공 시 저장한 "DONE:{email}" 키를 조회합니다.
        String isVerified = redisService.getValues("DONE:" + userCreateDto.email());
        if (!"true".equals(isVerified)) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        // 3. 사용자 객체 생성
        User user = User.builder()
                .username(userCreateDto.username())
                .password(passwordEncoder.encode(userCreateDto.password()))
                .nickname(userCreateDto.nickname())
                .email(userCreateDto.email())
                .role(UserRole.USER)
                .build();



        // 4. 가입 완료 후 Redis의 인증 성공 티켓 삭제 (재사용 방지)
        redisService.deleteValues("DONE:" + userCreateDto.email());
        redisService.deleteValues("AUTH:" + userCreateDto.email());

        return userRepository.save(user);



    }

    // 로그인 (AuthService가 있다면 이 메서드는 향후 제거해도 좋습니다)
    @Transactional(readOnly = true)
    public void login(LoginRequestDto loginRequestDto, HttpServletResponse response) {
        String username = loginRequestDto.username();
        String password = loginRequestDto.password();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("등록된 사용자가 없습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

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