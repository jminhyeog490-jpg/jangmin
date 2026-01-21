package com.example.jangmin.post.dto;

import com.example.jangmin.post.domain.Post; // Post 임포트 확인

public record PostResponseDto(
        Long id,
        String title,
        String content,
        String authorName
) {
    public static PostResponseDto from(Post post) {
        return new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                // post.getUser()가 null인 경우를 대비해 안전하게 작성
                post.getUser() != null ? post.getUser().getUsername() : "알 수 없음"
        );
    }
}