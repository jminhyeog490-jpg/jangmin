package com.example.jangmin.post.service;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.post.dto.PostCreateDto;
import com.example.jangmin.post.dto.PostResponseDto;
import com.example.jangmin.post.repository.PostRepository;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice; // Page 대신 Slice 사용
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // 게시글 생성
    public Long createPost(PostCreateDto dto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Post post = Post.builder()
                .title(dto.title())
                .content(dto.content())
                .user(user)
                .build();

        return postRepository.save(post).getId();
    }

    // 게시글 수정
    public Long updatePost(Long id, PostCreateDto dto, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + id));

        if (!post.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        post.update(dto.title(), dto.content());
        return id;
    }

    // 게시글 삭제
    public PostResponseDto deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + id));

        PostResponseDto response = PostResponseDto.from(post);
        postRepository.delete(post);
        return response;
    }

    // 게시글 단건 조회
    @Transactional(readOnly = true)
    public PostResponseDto getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + id));
        return PostResponseDto.from(post);
    }

    // 💡 무한 스크롤용 전체 조회 (Slice 사용)
    @Transactional(readOnly = true)
    public Slice<PostResponseDto> getPostList(Pageable pageable) {
        // 엔티티를 DTO로 바로 변환해서 반환합니다.
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(PostResponseDto::from);
    }


}