package com.example.jangmin.chat.dto;

import com.example.jangmin.chat.domain.ChatMessage;

import java.time.LocalDateTime;

public record ChatResponseDto(

        Long id,
        String content,
        String senderName,
        Long roomId,
        LocalDateTime createdAt
) {
    public static ChatResponseDto from(ChatMessage message) {
        return new ChatResponseDto(
                message.getId(),
                message.getContent(),
                message.getSender() != null ? message.getSender().getUsername() : "알 수 없음",
                message.getChatRoom().getId(), // 변경된 부분
                message.getCreatedAt()
        );
    }
}