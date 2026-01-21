package com.example.jangmin.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED) // PROTECTED 이상만 접근가능 new User처럼 아무런 객체 없이 접근하는것을 차단
@Getter
@Table(name ="users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id ;

    @Column(nullable = false , length = 20 , unique = true)
    private String username;

    @Column(nullable = false , length = 20 , unique = true)
    private String nickname;

    @Column(nullable = false , length = 30 , unique = true)
    private String email;

    @Column(nullable = false , unique = true)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;



    @Builder
    public User(String username , String nickname , String email , String password , UserRole role){

        this.username = username;
        this.nickname = nickname;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    //닉네임 변경

    public void updateNickname(String newNickname){
        this.nickname = newNickname;
    }









}
