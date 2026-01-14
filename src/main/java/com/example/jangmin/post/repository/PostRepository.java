package com.example.jangmin.post.repository;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    // 1. 특정 유저가 작성한 모든 게시글 조회 (마이페이지 등에서 사용)
    List<Post> findAllByUser(User user);

    // 2. 제목에 특정 단어가 포함된 게시글 검색
    List<Post> findByTitleContaining(String keyword);
}
