package com.example.jangmin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class JangminApplication {

	public static void main(String[] args) {
		SpringApplication.run(JangminApplication.class, args);
	}

}