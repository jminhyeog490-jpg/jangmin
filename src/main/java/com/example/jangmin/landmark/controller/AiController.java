package com.example.jangmin.landmark.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {


    @Value("${GROQ_API_KEY}")
    String groqApiKey = System.getenv("GROQ_API_KEY");


    private final String groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    @PostMapping("/recommend")
    public ResponseEntity<?> getAiRecommend(@RequestBody Map<String, Object> request) {
        String userPrompt = (String) request.get("userQuery"); // 리액트에서 보낸 사용자의 질문
        String places = (String) request.get("places");   // 카카오맵에서 긁어온 주변 장소들

        // AI에게 역할 부여 및 데이터 전달
        String systemRole = "너는 친절한 로컬 여행 가이드야. 아래 제공된 장소 리스트를 바탕으로 사용자의 질문에 답해줘. "
                + "주변 장소들: [" + places + "]";

        RestTemplate restTemplate = new RestTemplate();

        // 헤더 설정 (API 키 인증)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);
        // Groq/OpenAI 형식의 JSON 바디 구성
        Map<String, Object> body = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", systemRole),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.7 //창의성
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(groqUrl, entity, Map.class);

            // 답변 추출 (Groq 응답 구조: choices[0].message.content)
            List choices = (List) response.getBody().get("choices");
            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");
            String aiAnswer = (String) message.get("content");

            return ResponseEntity.ok(Map.of("answer", aiAnswer));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("answer", "Groq AI 오류: " + e.getMessage()));
        }
    }
}