package com.example.jangmin.global;

import com.example.jangmin.user.domain.User; // 1. 우리 엔티티 유저를 임포트!
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final User user; // 이제 우리 프로젝트의 User 엔티티입니다.

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // [참고] 나중에 컨트롤러에서 유저 PK나 닉네임이 필요하면 꺼내 쓸 수 있도록 추가
    public User getUser() {
        return user;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // user.getRole()이 Enum인 경우 .name()을 사용합니다.
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    // 아래 메서드들은 일단 다 true로 설정해야 로그인이 됩니다.
    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}