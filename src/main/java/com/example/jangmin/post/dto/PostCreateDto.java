package com.example.jangmin.post.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.NotBlank;

public record PostCreateDto(

        @NotBlank(message = "제목은 필수 입력 값입니다.")
        @Size(  message = "제목은 30글자 제한 입니다.")
        String title,

        @NotBlank(message = "내용은 필수 입력 값입니다.")
        @Size( message = "내용은 200글자 제한입니다.")
        String content





) {
}
