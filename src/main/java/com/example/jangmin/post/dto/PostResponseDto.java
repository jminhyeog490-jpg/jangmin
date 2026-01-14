package com.example.jangmin.post.dto;

import com.example.jangmin.user.domain.User;

public record PostResponseDto(
        Long id,
        String title,
        String content,
        User user
) {
}
