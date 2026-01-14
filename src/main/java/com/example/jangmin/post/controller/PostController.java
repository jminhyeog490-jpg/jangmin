package com.example.jangmin.post.controller;

import com.example.jangmin.post.dto.PostCreateDto;
import com.example.jangmin.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

     //AuthenticationPrincipal 어노테이션을 통해 SecurityContext에서 로그인된 유저 정보를 가져옵니다
    @PostMapping("/create")

    public ResponseEntity<String> createPost(
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // 1. 유저 정보가 없으면(로그인 안 됨) 401 에러 반환
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요한 서비스입니다.");
        }

        // 2. 서비스 계층으로 데이터(DTO)와 작성자(username)를 전달
        postService.createPost(postCreateDto, userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED).body("게시글이 성공적으로 등록되었습니다.");
    }




}
