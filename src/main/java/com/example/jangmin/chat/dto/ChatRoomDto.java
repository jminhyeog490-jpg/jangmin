package com.example.jangmin.chat.dto;

import com.example.jangmin.chat.domain.ChatRoom;

public record ChatRoomDto(
        Long id,
        String title,
        String creatorName
) {
    public static ChatRoomDto from(ChatRoom chatRoom) {
        return new ChatRoomDto(
                chatRoom.getId(),
                chatRoom.getTitle(),
                chatRoom.getCreator().getUsername()
        );
    }
}