package com.example.jangmin.post.dto;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.comment.dto.CommentResponseDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record PostResponseDto(
        Long id,
        String title,
        String content,
        String authorName,
        LocalDateTime createdAt,
        List<CommentResponseDto> comments
) {
    public static PostResponseDto from(Post post) {
        return new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getUser() != null ? post.getUser().getUsername() : "알 수 없음",
                post.getCreatedAt(),
                post.getComments() != null ?
                        post.getComments().stream()
                                // 부모가 없는 댓글만 리스트 포함
                                .filter(comment -> comment.getParent() == null)
                                .map(CommentResponseDto::from)
                                .collect(Collectors.toList()) : List.of()
        );
    }
}