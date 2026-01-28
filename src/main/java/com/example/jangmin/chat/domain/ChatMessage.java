package com.example.jangmin.chat.domain;

import com.example.jangmin.global.BaseEntity;
import com.example.jangmin.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User sender; // 발신자

    @Column(nullable = false)
    private Long roomId; // 채팅방 ID (간단하게 구현 시)

    @Builder
    public ChatMessage(String content, User sender, Long roomId) {
        this.content = content;
        this.sender = sender;
        this.roomId = roomId;
    }
}