package com.example.jangmin.global;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass // 공통 매핑 정보가 필요할 때 사용하는 어노테이션 MappedSuperclass 필드를 상속시켜주기 위해 사용
@EntityListeners(AuditingEntityListener.class) // 자동으로 시간을 기록하기 위한 리스너
//@EntityListeners(AuditingEntityListener.class): JPA 엔티티의 상태 변화를 감지하여 자동으로 값을 넣어주는 기능을 활성화합니다.
public abstract class BaseEntity {

    @CreatedDate
    @Column(updatable = false) // 생성 시간은 수정되지 않도록 설정
    private LocalDateTime createdAt; // 생성

    @LastModifiedDate
    private LocalDateTime modifiedAt; // 수정
}