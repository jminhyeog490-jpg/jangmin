package com.example.jangmin.landmark.contoroller;

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
    // LandmarkController.java

    @PostMapping("/register")
    public ResponseEntity<String> registerLandmark(@RequestBody LandmarkResponseDto landmarkDto) {
        // 리액트에서 보낸 데이터를 DB에 저장하는 로직
        landmarkService.registerLandmark(landmarkDto);
        return ResponseEntity.ok("랜드마크 등록 성공!");
    }
    @GetMapping("/{id}")
    public ResponseEntity<LandmarkResponseDto> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(landmarkService.getLandmarkDetail(id));
    }
}

