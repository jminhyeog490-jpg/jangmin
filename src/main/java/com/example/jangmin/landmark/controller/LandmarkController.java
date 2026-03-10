package com.example.jangmin.landmark.controller;

import com.example.jangmin.landmark.dto.LandmarkResponseDto;
import com.example.jangmin.landmark.service.LandmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/landmarks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class LandmarkController {
    private final LandmarkService landmarkService;

    @GetMapping("/nearby")
    public ResponseEntity<List<LandmarkResponseDto>> getNearby(
            @RequestParam Double lat,
            @RequestParam Double lon) {
        return ResponseEntity.ok(landmarkService.getNearbyLandmarks(lat, lon));
    }
    // 리액트의 '저장 목록' 버튼을 위해 모든 데이터를 가져오는 API 추가
    @GetMapping
    public ResponseEntity<List<LandmarkResponseDto>> getAllLandmarks() {
        // 서비스에 모든 랜드마크를 가져오는 메서드가 있음
        return ResponseEntity.ok(landmarkService.getAllLandmarks());
    }


    @PostMapping("/register")
    public ResponseEntity<String> registerLandmark(@RequestBody LandmarkResponseDto landmarkDto) {
        // 리액트에서 보낸 데이터를 DB에 저장
        landmarkService.registerLandmark(landmarkDto);
        return ResponseEntity.ok("랜드마크 등록 성공!");
    }
    @GetMapping("/{id}")
    public ResponseEntity<LandmarkResponseDto> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(landmarkService.getLandmarkDetail(id));
    }
}