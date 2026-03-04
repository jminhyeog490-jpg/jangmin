package com.example.jangmin.post.dto;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.comment.dto.CommentResponseDto; // 🟢 추가: 댓글 DTO 임포트
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record PostResponseDto(
        Long id,
        String title,
        String content,
        String authorName,
        LocalDateTime createdAt,
        //  1. 리액트에서 보여줄 댓글 리스트 필드 추가
        List<CommentResponseDto> comments
) {
    public static PostResponseDto from(Post post) {
        return new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getUser() != null ? post.getUser().getUsername() : "알 수 없음",
                post.getCreatedAt(),
                // 2. Post 엔티티에 저장된 댓글들을 CommentResponseDto로 변환해서 담아주기
                post.getComments() != null ?
                        post.getComments().stream()
                                .map(CommentResponseDto::from)
                                .collect(Collectors.toList()) : List.of()
        );
    }
}