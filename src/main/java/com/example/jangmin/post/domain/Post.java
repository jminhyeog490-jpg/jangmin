package com.example.jangmin.post.domain;

import com.example.jangmin.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED) // PROTECTED 이상만 접근가능 new User처럼 아무런 객체 없이 접근하는것을 차단
@Getter
@Table(name ="posts")
public class Post {

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

    @Builder
    public Post(String title,String content, User user){
        this.title = title;
        this.content = content;
        this.user = user;


    }
}
