package com.example.jangmin.comment.controller;

import com.example.jangmin.comment.dto.CommentResponseDto;
import com.example.jangmin.comment.service.CommentService;
import com.example.jangmin.global.CustomUserDetails; // 작성하신 클래스 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    /**
     * 댓글 생성
     * @AuthenticationPrincipal을 통해 로그인된 유저 정보를 바로 가져옵니다.
     */
    @PostMapping
    public ResponseEntity<CommentResponseDto> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody String content) {

        // CustomUserDetails에 만든 getUser() 메서드를 사용하여 엔티티의 ID를 꺼냅니다.
        Long userId = userDetails.getUser().getId();

        CommentResponseDto response = commentService.createComment(postId, userId, content);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 게시글의 모든 댓글 조회
     */
    @GetMapping("/list")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long postId) {
        List<CommentResponseDto> responses = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 댓글 수정
     */
    @PatchMapping("/{commentId}")
    public ResponseEntity<CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody String content) {

        CommentResponseDto response = commentService.updateComment(commentId, content);
        return ResponseEntity.ok(response);
    }

    /**
     * 댓글 삭제
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}