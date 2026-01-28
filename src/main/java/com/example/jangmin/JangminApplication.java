package com.example.jangmin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing // 이 설정을 추가해야 시간이 자동으로 기록됩니다!
@SpringBootApplication
public class JangminApplication {

	public static void main(String[] args) {
		SpringApplication.run(JangminApplication.class, args);
	}

}
