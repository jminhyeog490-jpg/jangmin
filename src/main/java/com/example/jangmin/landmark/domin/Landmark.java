package com.example.jangmin.landmark.domin;

import jakarta.persistence.*;
import lombok.*; // Builder, AllArgsConstructor 등을 위해 추가

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA용 기본 생성자
@AllArgsConstructor // 💡 빌더를 사용하기 위해 모든 필드 생성자가 반드시 필요합니다!
@Builder // 이제 에러가 사라질 거예요!
@Table(name = "landmark") // 💡 아까 SQL에서 테이블명을 'landmark'로 만드셨다면 's'를 빼주세요.
public class Landmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double latitude;
    private Double longitude;

    private String address;
}