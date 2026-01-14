package com.example.jangmin.user.service;

import com.example.jangmin.user.domain.UserRole;
import com.example.jangmin.user.domain.User;      // Entity 패키지 경로에 맞게 수정
import com.example.jangmin.user.dto.UserResponseDto;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional // 조회의 성능을 높이기 위해 기본값은 읽기 전용
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;


    public User register(UserResponseDto userResponseDto) {


        if (userRepository.existsByUsername(userResponseDto.username())) throw new IllegalArgumentException("아이디가 이미 존재합니다.");

        User user = User.builder()
                .username(userResponseDto.username())
                .password(passwordEncoder.encode(userResponseDto.password()))
                .nickname(userResponseDto.nickname())
                .email(userResponseDto.email()) // 이메일 누락 주의!
                .role(UserRole.USER)
                .build();

       ;
        return userRepository.save(user); // 저장된 객체를 Dto로 변환해서 반환
    }

    // 사용자 로그인을 위한 아이디 있는지 확인 메서드
    public Optional<User> getUser(String username) {
        return userRepository.findByUsername(username);
    }


    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}