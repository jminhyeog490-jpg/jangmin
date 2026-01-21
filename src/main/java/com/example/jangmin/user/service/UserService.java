package com.example.jangmin.user.service;

import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.domain.UserRole;
import com.example.jangmin.user.dto.UserCreateDto;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    // 회원가입: UserCreateDto 사용
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

    //닉네임 변경
    public User updateNickname(String username, String newNickname) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));
       return user.updateNickname(newNickname);


    }



}
