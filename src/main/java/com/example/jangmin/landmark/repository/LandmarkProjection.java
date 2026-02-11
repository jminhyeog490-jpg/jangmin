package com.example.jangmin.landmark.repository;

/**
 * 인터페이스 프로젝션:
 * 네이티브 쿼리의 결과를 객체 형태로 안전하게 받기 위한 인터페이스입니다.
 */
public interface LandmarkProjection {
    String getName();        // name 컬럼 매핑
    String getDescription(); // description 컬럼 매핑
    Double getLatitude();    // latitude 컬럼 매핑
    Double getLongitude();   // longitude 컬럼 매핑
    Double getDistance();    // 계산된 distance 컬럼 매핑
}