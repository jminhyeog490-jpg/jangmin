package com.example.jangmin.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentCreateDto(

        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size(message = "내용은 30글자 제한입니다.")
        String content,
        
        Long parentId // 대댓글일 경우 부모 댓글 ID, 원댓글이면 null

) {
}