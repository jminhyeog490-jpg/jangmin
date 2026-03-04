package com.example.jangmin.user.dto;

import com.example.jangmin.global.PasswordEncoderConfig;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record UserCreateDto(
        @NotBlank(message = "아이디는 필수 입력 값입니다.")
        @Size(min = 4, max = 20, message = "아이디는 4~20자 사이여야 합니다.")
        String username,

        @NotBlank(message = "닉네임은 필수 입력 값입니다.")
        @Size(min = 4, max = 20, message = "닉네임은 4~20자 사이여야 합니다.")
        String nickname,

        @NotBlank(message = "비밀번호는 필수 입력 값입니다.")

        String password,

        @Email
        @NotBlank(message = "이메일은 필수 입력 값입니다.")
        String email,

        @NotBlank(message = "권한은 필수 입력 값입니다.")
        String authCode
)
{



}
