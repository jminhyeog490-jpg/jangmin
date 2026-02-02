package com.example.jangmin.global.jwt;

import org.springframework.data.repository.CrudRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends CrudRepository<RefreshToken, String> {

    // 토큰 값 자체로 사용자 정보를 찾고 싶을 때 사용
    Optional<RefreshToken> findByRefreshToken(String refreshToken);
}