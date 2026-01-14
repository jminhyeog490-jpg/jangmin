package com.example.jangmin.user.dto;

import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.domain.UserRole;

public record UserResponseDto(
        Long id,
        String password,
        String username,
        String nickname,
        String email

) {


    }
