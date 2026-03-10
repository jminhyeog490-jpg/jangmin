package com.example.jangmin.landmark.service;

import com.example.jangmin.landmark.domin.Landmark; // 💡 패키지명 domin 확인!
import com.example.jangmin.landmark.dto.LandmarkResponseDto;
import com.example.jangmin.landmark.repository.LandmarkRepository;
import com.example.jangmin.landmark.repository.LandmarkProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandmarkService {

    private final LandmarkRepository landmarkRepository;


     // 주변 랜드마크 조회 (거리 계산 포함)

    public List<LandmarkResponseDto> getNearbyLandmarks(Double lat, Double lon) {
        List<LandmarkProjection> results = landmarkRepository.findNearbyLandmarks(lat, lon);

        // DTO 생성자 순서: id, name, description, latitude, longitude, address, distance (7개)
        return results.stream().map(p -> new LandmarkResponseDto(
                null,               // id (프로젝션에 없다면 null)
                p.getName(),
                p.getDescription(),
                p.getLatitude(),
                p.getLongitude(),
                null,               // address (프로젝션에 없다면 null)
                p.getDistance()
        )).collect(Collectors.toList());
    }

    //랜드마크 조회
    public List<LandmarkResponseDto> getAllLandmarks() {
        List<Landmark> landmarks = landmarkRepository.findAll();

        return landmarks.stream().map(landmark -> new LandmarkResponseDto(
                landmark.getId(),          // id
                landmark.getName(),        // name
                landmark.getDescription(), // description
                landmark.getLatitude(),    // latitude
                landmark.getLongitude(),   // longitude
                landmark.getAddress(),     // address
                0.0                        // distance (전체 목록은 계산 전이므로 0.0)
        )).collect(Collectors.toList());
    }

    //랜드마크 등록
    @Transactional
    public void registerLandmark(LandmarkResponseDto dto) {
        Landmark landmark = Landmark.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .address(dto.getAddress())
                .build();

        landmarkRepository.save(landmark);
    }


    //  특정 랜드마크 상세 조회

    public LandmarkResponseDto getLandmarkDetail(Long id) {
        Landmark landmark = landmarkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 랜드마크가 존재하지 않습니다. id=" + id));

        return new LandmarkResponseDto(
                landmark.getId(),
                landmark.getName(),
                landmark.getDescription(),
                landmark.getLatitude(),
                landmark.getLongitude(),
                landmark.getAddress(),
                0.0
        );
    }
}