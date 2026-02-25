package com.example.jangmin.landmark.contoroller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {

    // 🔴 발급받은 API 키를 여기에 넣으세요
    private final String GEMINI_API_KEY = "AIzaSyBDDb-CuRo--JAR-PbLW0wzFLru_OtonxA";
    private final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

    @PostMapping("/recommend")
    public ResponseEntity<?> getAiRecommend(@RequestBody Map<String, Object> request) {
        String places = (String) request.get("places");

        // AI에게 던질 질문(프롬프트) 꾸미기
        String prompt = "너는 여행 가이드야. 주변 장소 리스트를 줄게: [" + places + "]. "
                + "이 중에서 가장 방문하기 좋은 곳 1곳을 추천하고 이유를 친절하게 설명해줘. "
                + "답변은 한국어로 깔끔하게 해줘.";

        // 구글 서버로 쏠 데이터 양식 만들기 (Gemini 전용 JSON 구조)
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        try {
            // 구글 AI 서버에 요청 보내기
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(GEMINI_URL, body, Map.class);

            // 응답 데이터에서 답변만 쏙 뽑아내기
            Map responseBody = responseEntity.getBody();
            List candidates = (List) responseBody.get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            String aiAnswer = (String) ((Map) parts.get(0)).get("text");

            return ResponseEntity.ok(Map.of("answer", aiAnswer));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("answer", "AI 통신 중 오류가 발생했습니다."));
        }
    }
}