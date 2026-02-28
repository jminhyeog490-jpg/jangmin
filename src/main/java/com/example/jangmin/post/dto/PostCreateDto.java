package com.example.jangmin.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostCreateDto(

        @NotBlank(message = "제목은 필수 입력 값입니다.")
        @Size(max = 30, message = "제목은 30글자 제한 입니다.")
        String title,

        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size(max = 200, message = "내용은 200글자 제한입니다.")
        String content

) {
}