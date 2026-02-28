package com.example.jangmin.landmark.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor // 👈 기본 생성자 추가 (JSON 변환용)
public class LandmarkResponseDto {
    private Long id;          // ✨ 추가: 식별자
    private String name;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;    // ✨ 추가: 주소
    private Double distance;   // 계산된 거리
}