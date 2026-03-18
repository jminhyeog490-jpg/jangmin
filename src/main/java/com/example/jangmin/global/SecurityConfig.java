package com.example.jangmin.global;

import com.example.jangmin.global.jwt.JwtAuthenticationFilter;
import com.example.jangmin.global.jwt.JwtUtil;
import com.example.jangmin.user.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // CORS 설정 적용
                .csrf(csrf -> csrf.disable()) // CSRF 비활성화 (API 방식 필수)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // JWT 사용을 위한 세션 미사용
                )
                .authorizeHttpRequests(auth -> auth
                        //  모든 사용자에게 허용할 경로들 (게시글 API 포함)
                        .requestMatchers(
                                "/", "/index.html", "/static/**", "/*.json",
                                "/*.png", "/*.ico", "/favicon.ico", "/manifest.json"
                        ).permitAll()
                        .requestMatchers(
                                "/api/auth/**", "/api/v1/auth/**", "/api/v1/ai/**",
                                "/api/users/signup", "/api/auth/login", "/swagger-ui/**",
                                "/v3/api-docs/**", "/email-send/**", "/api/v1/landmarks/**",
                                "/ws-chat/**", "/api/posts/**"
                        ).permitAll()
                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )
                //  JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, userDetailsService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 설정: 리액트 앱이 서버 응답 헤더를 읽을 수 있게 함
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 리액트 서버 주소 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000",
                "http://52.79.237.156:3000"));
        // 모든 HTTP 메서드 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));

        //  리액트(브라우저)가 Authorization 헤더를 읽을 수 있도록 노출
        configuration.setExposedHeaders(List.of("Authorization"));

        // 쿠키/인증 정보 포함 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}