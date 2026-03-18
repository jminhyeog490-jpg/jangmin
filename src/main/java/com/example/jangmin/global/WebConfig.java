package com.example.jangmin.global; // 본인의 패키지 경로에 맞게 수정하세요!

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");

        // 3. 중첩 경로 (예: /board/1) 대응을 위한 설정
        registry.addViewController("/{path1:^(?!api).*}/{path2:[^\\.]*}")
                .setViewName("forward:/index.html");
    }
}