package com.example.jangmin.global.jwt;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;

@Getter
@AllArgsConstructor
@RedisHash(value = "refreshToken", timeToLive = 60 * 60 * 24 * 14) // 14일 (초 단위)
public class RefreshToken {

    @Id // 레디스의 Key가 됨 (예: refreshToken:유저ID)
    private String userId;

    @Indexed // 토큰 값으로도 데이터를 찾고 싶을 때 붙임
    private String token;
}