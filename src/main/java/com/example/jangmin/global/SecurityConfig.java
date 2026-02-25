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
                .csrf(csrf -> csrf.disable()) // CSRF 비활성화
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 세션 미사용
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**","/api/v1/ai/**", "/api/users/signup","/api/auth/login" , "/*.html", "/swagger-ui/**", "/v3/api-docs/**","/email-send/**","/api/v1/landmarks/**","/ws-chat/**","/api/posts/**").permitAll()
                        //인증(로그인)이 반드시 필요한 '보호' 경로

                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, userDetailsService), UsernamePasswordAuthenticationFilter.class);
                                    //JwtAuthenticationFilter 토큰 사용을 위한 것
                                    // UsernamePasswordAuthenticationFilter 시큐리티에서는 아이디 비번 가져오라함 그렇기에 필요 하지만 이놈이 앞에 토큰으로 검증 끝났네 하고 넘김
        return http.build();
    }
}