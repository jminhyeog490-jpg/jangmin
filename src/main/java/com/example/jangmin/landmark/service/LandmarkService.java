package com.example.jangmin.landmark.service;

import com.example.jangmin.landmark.dto.LandmarkResponseDto;
import com.example.jangmin.landmark.repository.LandmarkRepository;
import com.example.jangmin.landmark.repository.LandmarkProjection; // 프로젝션 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandmarkService {

    private final LandmarkRepository landmarkRepository;

    public List<LandmarkResponseDto> getNearbyLandmarks(Double lat, Double lon) {
        // 1. 리포지토리에서 프로젝션 리스트를 바로 가져옵니다.
        List<LandmarkProjection> results = landmarkRepository.findNearbyLandmarks(lat, lon);

        // 2. 인덱스 번호 대신 'get 메서드'를 사용하여 안전하게 DTO로 변환합니다.
        return results.stream().map(p -> new LandmarkResponseDto(
                p.getName(),        // (String) result[0] 대신 사용
                p.getDescription(), // (String) result[1] 대신 사용
                p.getLatitude(),    // (Double) result[2] 대신 사용
                p.getLongitude(),   // (Double) result[3] 대신 사용
                p.getDistance()     // (Double) result[5] 대신 사용 (매우 안전!)
        )).collect(Collectors.toList());
    }
    @org.springframework.transaction.annotation.Transactional // 저장할 땐 꼭 붙여주세요!
    public void registerLandmark(LandmarkResponseDto dto) {
        // 💡 주의: Landmark 엔티티 클래스가 정의되어 있어야 합니다.
        com.example.jangmin.landmark.domin.Landmark landmark = com.example.jangmin.landmark.domin.Landmark.builder()

                .name(dto.getName())
                .description(dto.getDescription())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();

        landmarkRepository.save(landmark);
}
// LandmarkService.java

    // 4. 특정 랜드마크 상세 조회
    public LandmarkResponseDto getLandmarkDetail(Long id) {
        // DB에서 ID로 찾고, 없으면 예외 발생
        com.example.jangmin.landmark.domin.Landmark landmark = landmarkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 랜드마크가 존재하지 않습니다. id=" + id));

        // 엔티티를 DTO로 변환해서 반환
        return new LandmarkResponseDto(
                landmark.getName(),
                landmark.getDescription(),
                landmark.getLatitude(),
                landmark.getLongitude(),
                0.0 // 상세 페이지에서는 거리가 굳이 필요 없다면 0.0 혹은 적절한 값 전달
        );
    }}