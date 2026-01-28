package com.example.jangmin.comment.repository;

import com.example.jangmin.comment.domain.Comment;
import com.example.jangmin.post.domain.Post;
import com.example.jangmin.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 1. 특정 유저가 작성한 모든 댓글 조회
    List<Comment> findAllByUser(User user);

    // 2. 특정 게시글에 달린 모든 댓글 조회 (가장 많이 사용됨)
    List<Comment> findAllByPost(Post post);

    // 3. 내용(content)에 특정 단어가 포함된 댓글 검색
    // Comment 엔티티에는 title이 없으므로 content로 검색해야 합니다.
    List<Comment> findByContentContaining(String keyword);
}