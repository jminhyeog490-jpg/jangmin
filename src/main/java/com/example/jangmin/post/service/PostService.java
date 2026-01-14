package com.example.jangmin.post.service;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.post.dto.PostCreateDto;
import com.example.jangmin.post.repository.PostRepository;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Long createPost(PostCreateDto dto, String username) {
        // 1. 시큐리티에서 가져온 username으로 유저 조회
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 2. 게시글 생성 (유저 연관관계 설정)
        Post post = Post.builder()
                .title(dto.title())
                .content(dto.content())
                .user(user) // @ManyToOne 관계 연결
                .build();

        return postRepository.save(post).getId();
    }




}
