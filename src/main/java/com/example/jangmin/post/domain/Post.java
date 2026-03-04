package com.example.jangmin.post.domain;

import com.example.jangmin.comment.domain.Comment; // 🟢 Comment 엔티티 임포트
import com.example.jangmin.global.BaseEntity;
import com.example.jangmin.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name ="posts")
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false , length = 30)
    public String title;

    @Column(nullable = false , length = 200)
    public String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 1. 댓글 리스트 필드 추가
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Builder
    public Post(String title, String content, User user){
        this.title = title;
        this.content = content;
        this.user = user;
    }

    // 게시글 수정 메서드
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }
}