package com.example.jangmin.comment.service;

import com.example.jangmin.comment.dto.CommentCreateDto;
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


     // 댓글 작성 (대댓글 포함)

    @Transactional
    public CommentResponseDto createComment(Long postId, Long userId, CommentCreateDto createDto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + postId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 존재하지 않습니다. id=" + userId));

        Comment parent = null;
        if (createDto.parentId() != null) {
            parent = commentRepository.findById(createDto.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 존재하지 않습니다. id=" + createDto.parentId()));
        }

        Comment comment = Comment.builder()
                .content(createDto.content())
                .post(post)
                .user(user)
                .parent(parent)
                .build();

        commentRepository.save(comment);

        return CommentResponseDto.from(comment);
    }


     // 특정 게시글의 댓글 조회 (계층형 구조)

    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + postId));

        // 모든 댓글을 가져온 후, 부모가 없는 최상위 댓글만 필터링해서 DTO로 변환
        // (자식 댓글은 DTO 내부에서 재귀적으로 변환됨)
        return commentRepository.findAllByPost(post).stream()
                .filter(comment -> comment.getParent() == null)
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }


     // 댓글 수정

    @Transactional
    public CommentResponseDto updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 존재하지 않습니다. id=" + commentId));

        comment.update(content); // 도메인 메서드 활용 (더티 체킹)

        return CommentResponseDto.from(comment);
    }


     // 댓글 삭제

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 존재하지 않습니다. id=" + commentId));

        commentRepository.delete(comment);
    }

}