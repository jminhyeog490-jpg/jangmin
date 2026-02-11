package com.example.jangmin.landmark.repository;

import com.example.jangmin.landmark.domin.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LandmarkRepository extends JpaRepository<Landmark, Long> {

    // Native Query를 사용하지만 결과는 LandmarkProjection 인터페이스로 받습니다.
    @Query(value = "SELECT name, description, latitude, longitude, " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * " +
            "cos(radians(longitude) - radians(:lon)) + sin(radians(:lat)) * " +
            "sin(radians(latitude)))) AS distance " +
            "FROM landmarks " +
            "HAVING distance <= 3 " +
            "ORDER BY distance", nativeQuery = true)
    List<LandmarkProjection> findNearbyLandmarks(@Param("lat") Double lat, @Param("lon") Double lon);
}