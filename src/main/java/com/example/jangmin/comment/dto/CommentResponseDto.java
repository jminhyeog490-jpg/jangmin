package com.example.jangmin.comment.dto;

import com.example.jangmin.comment.domain.Comment;

import java.time.LocalDateTime;

public record CommentResponseDto(
        Long id,
        String content,    // 댓글은 보통 title이 없으므로 content만 유지
        String authorName,
        LocalDateTime createdAt
) {
    public static CommentResponseDto from(Comment comment) {
        return new CommentResponseDto(
                comment.getId(),
                comment.getContent(),
                comment.getUser().getUsername()// User 객체가 아닌 '이름(String)'을 추출
                ,comment.getCreatedAt()
        );
    }
}