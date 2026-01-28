package com.example.jangmin.post.dto;

import com.example.jangmin.post.domain.Post;
import java.time.LocalDateTime;

public record PostResponseDto(
        Long id,
        String title,
        String content,
        String authorName,
        LocalDateTime createdAt
) {
    public static PostResponseDto from(Post post) {
        return new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                // authorName 위치에 유저 이름을, createdAt 위치에 생성 시간을 넣어야 합니다.
                post.getUser() != null ? post.getUser().getUsername() : "알 수 없음",
                post.getCreatedAt()
        );
    }
}