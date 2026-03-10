package com.example.jangmin.comment.controller;

import com.example.jangmin.comment.dto.CommentCreateDto;
import com.example.jangmin.comment.dto.CommentResponseDto;
import com.example.jangmin.comment.service.CommentService;
import com.example.jangmin.global.CustomUserDetails;
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

    //댓글 작성 (대댓글 포함)
    @PostMapping
    public ResponseEntity<CommentResponseDto> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CommentCreateDto createDto) {

        Long userId = userDetails.getUser().getId();

        CommentResponseDto response = commentService.createComment(postId, userId, createDto);
        return ResponseEntity.ok(response);
    }


    //  특정 게시글의 모든 댓글 조회

    @GetMapping("/list")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long postId) {
        List<CommentResponseDto> responses = commentService.getCommentsByPost(postId);
        return ResponseEntity.ok(responses);
    }


    //  댓글 수정

    @PatchMapping("/{commentId}")
    public ResponseEntity<CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody String content) {

        CommentResponseDto response = commentService.updateComment(commentId, content);
        return ResponseEntity.ok(response);
    }


    //  댓글 삭제

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}