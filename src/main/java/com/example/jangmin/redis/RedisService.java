package com.example.jangmin.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate; // 문자열 처리에 최적화된 템플릿

    // duration 파라미터를 사용하여 만료 시간 설정
    public void setValues(String key, String value, Duration duration) {
        redisTemplate.opsForValue().set(key, value, duration);
    }

    public String getValues(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    // 키 삭제 (로그아웃 시 사용)
    public void deleteValues(String key) {
        redisTemplate.delete(key);
    }

    // 블랙리스트 등록
    public void setBlackList(String key, String value, Duration duration) {
        redisTemplate.opsForValue().set(key, value, duration);
    }
}