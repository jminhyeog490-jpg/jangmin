package com.example.jangmin.global;

import com.example.jangmin.global.jwt.JwtAuthenticationFilter;
import com.example.jangmin.global.jwt.JwtUtil;
import com.example.jangmin.redis.RedisService;
import com.example.jangmin.user.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy; // 추가
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
// @RequiredArgsConstructor를 삭제하고 직접 생성자를 작성합니다.
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final RedisService redisService;

    // 생성자에서 CustomUserDetailsService 앞에 @Lazy를 붙여 순환 참조를 끊기
    public SecurityConfig(JwtUtil jwtUtil, @Lazy CustomUserDetailsService userDetailsService,RedisService redisService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.redisService = redisService;

    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/index.html", "/static/**", "/*.json",
                                "/*.png", "/*.ico", "/favicon.ico", "/manifest.json",
                                "/main", "/board", "/chat", "/login", "/signup"
                        ).permitAll()
                        .requestMatchers(
                                "/api/auth/**", "/api/v1/auth/**", "/api/v1/ai/**",
                                "/api/users/signup", "/api/auth/login", "/swagger-ui/**",
                                "/v3/api-docs/**", "/email-send/**", "/api/v1/landmarks/**",
                                "/ws-chat/**", "/api/posts/**","/api/chat/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .logout(logout -> logout.disable())
                // JWT 필터 설정 유지
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, userDetailsService,redisService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000",
                "http://52.79.237.156:3000","http://52.79.237.156:8090"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}