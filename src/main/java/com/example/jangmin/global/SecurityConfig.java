package com.example.jangmin.global;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public org.springframework.security.authentication.AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (Postman 테스트 및 REST API를 위해 필수)
                .csrf(csrf -> csrf.disable())


                // 2. MySQL 사용 시 H2 프레임 옵션 설정은 삭제해도 무방합니다.

                // 3. 요청 권한 설정 (실제 컨트롤러 경로와 일치시켜야 합니다)
                .authorizeHttpRequests(auth -> auth
                        // 회원가입 API 경로와 로그인 경로는 인증 없이 허용
                        .requestMatchers("/api/users/register",
                                "/api/users/signup",
                                "/api/users/login",
                                "api/users/logout",
                                "/","/api/posts/create").permitAll()
                        // 그 외 나머지(회원 목록 조회 등)는 로그인이 필요함
                        .anyRequest().authenticated()
                )

                // 4. API 서버라면 폼 로그인을 사용하지 않는 경우가 많지만,
                // 일단 유지하신다면 아래 설정을 사용합니다.
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/")
                        .permitAll()
                )

                // 5. 로그아웃 설정
                .logout(logout -> logout
                        .logoutSuccessUrl("/login")
                        .invalidateHttpSession(true)
                );

        return http.build();
    }
}
