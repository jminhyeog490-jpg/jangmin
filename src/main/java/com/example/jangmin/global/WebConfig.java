package com.example.jangmin.global; // 본인의 패키지 경로에 맞게 수정하세요!

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 1. /main, /board 등 리액트 라우트 경로가 들어오면 index.html로 연결해줍니다.
        // 2. 이렇게 해야 리액트가 주소를 받아서 자기 화면을 띄울 수 있어요.
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");

        // 3. 중첩 경로 (예: /board/1) 대응을 위한 설정
        registry.addViewController("/{path:^(?!api).*}/{path:[^\\.]*}")
                .setViewName("forward:/index.html");
    }
}