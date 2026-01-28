package com.example.jangmin.comment.service;

import com.example.jangmin.comment.dto.CommentResponseDto;
import com.example.jangmin.comment.repository.CommentRepository;
import com.example.jangmin.comment.domain.Comment;
import com.example.jangmin.post.domain.Post;
import com.example.jangmin.post.repository.PostRepository;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * 댓글 작성
     */
    @Transactional
    public CommentResponseDto createComment(Long postId, Long userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + postId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 존재하지 않습니다. id=" + userId));

        Comment comment = Comment.builder()
                .content(content)
                .post(post)
                .user(user)
                .build();

        commentRepository.save(comment);

        return CommentResponseDto.from(comment);
    }

    /**
     * 특정 게시글의 모든 댓글 조회
     */
    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + postId));

        return commentRepository.findAllByPost(post).stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public CommentResponseDto updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 존재하지 않습니다. id=" + commentId));

        comment.update(content); // 도메인 메서드 활용 (더티 체킹)

        return CommentResponseDto.from(comment);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 존재하지 않습니다. id=" + commentId));

        commentRepository.delete(comment);
    }

}