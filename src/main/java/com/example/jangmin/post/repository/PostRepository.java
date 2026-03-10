package com.example.jangmin.post.repository;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    // 유저가 작성한 게시글 조회
    List<Post> findAllByUser(User user);

    // 제목으로 게시글 검색
    List<Post> findByTitleContaining(String keyword);
}