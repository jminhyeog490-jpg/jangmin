package com.example.jangmin.landmark.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LandmarkResponseDto {
    private String name;
    private String description;
    private Double latitude;
    private Double longitude;
    private Double distance; // 계산된 거리 (km)
}