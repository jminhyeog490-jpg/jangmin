package com.example.jangmin.post.repository;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.user.domain.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice; // Page 대신 Slice로 통일
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 1. 메인 피드용: 최신순으로 게시글 슬라이싱 (무한 스크롤 최적화)
    Slice<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 2. 마이페이지용: 특정 유저의 게시글 슬라이싱
    Slice<Post> findAllByUser(User user, Pageable pageable);

    // 3. 검색용: 제목 키워드 포함 게시글 슬라이싱
    Slice<Post> findByTitleContaining(String keyword, Pageable pageable);
}