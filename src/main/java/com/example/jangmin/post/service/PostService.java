package com.example.jangmin.post.service;

import com.example.jangmin.post.domain.Post;
import com.example.jangmin.post.dto.PostCreateDto;
import com.example.jangmin.post.dto.PostResponseDto;
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
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    //게시글 생성
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
        // 1. 게시글 조회
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + id));

        // 2. 작성자 검증 (현재 로그인한 유저와 게시글 작성자가 같은지)
        if (!post.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        // 3. 수정 실행 (Dirty Checking으로 인해 save 호출 불필요)
        post.update(dto.title(), dto.content());

        return id;
    }

    //게시글 삭제
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

    // 게시글 전체 조회
    @Transactional(readOnly = true)
    public List<PostResponseDto> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        return posts.stream()
                .map(PostResponseDto::from)
                .collect(Collectors.toList());
    }
}
