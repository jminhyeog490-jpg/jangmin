package com.example.jangmin.post.controller;

import com.example.jangmin.global.CustomUserDetails;
import com.example.jangmin.post.dto.PostCreateDto;
import com.example.jangmin.post.dto.PostResponseDto;
import com.example.jangmin.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class
PostController {

    private final PostService postService;

    //게시글 생성
    @PostMapping("/create")
    public ResponseEntity<String> createPost(
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        if (customUserDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요한 서비스입니다.");
        }

        postService.createPost(postCreateDto, customUserDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body("게시글이 성공적으로 등록되었습니다.");
    }

    // 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<String> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        if (customUserDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요한 서비스입니다.");
        }

        try {
            postService.updatePost(id, postCreateDto, customUserDetails.getUsername());
            return ResponseEntity.ok("게시글이 성공적으로 수정되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    //게시글 삭제
    @DeleteMapping("/{id}") // PostMapping -> DeleteMapping으로 변경 권장
    public ResponseEntity<String> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok("삭제성공");
    }

    //게시글 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDto> getPost(@PathVariable Long id) {
        PostResponseDto response = postService.getPost(id);
        return ResponseEntity.ok(response);
    }

    //게시글 전체 조회
    @GetMapping("/list")
    public ResponseEntity<List<PostResponseDto>> getAllPost() { // @PathVariable 제거
        List<PostResponseDto> responseDto = postService.getAllPosts();
        return ResponseEntity.ok(responseDto);
    }
}
