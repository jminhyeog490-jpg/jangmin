package com.example.jangmin.chat.controller;

import com.example.jangmin.chat.dto.ChatCreateDto;
import com.example.jangmin.chat.dto.ChatResponseDto;
import com.example.jangmin.chat.dto.ChatRoomDto;
import com.example.jangmin.chat.service.ChatService;
import com.example.jangmin.global.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // 채팅방 생성
    @PostMapping("/api/chat/rooms")
    public ResponseEntity<ChatRoomDto> createRoom(
            @RequestBody String title,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUser().getId();
        ChatRoomDto room = chatService.createRoom(title, userId);
        return ResponseEntity.ok(room);
    }

    // 채팅방 목록 조회
    @GetMapping("/api/chat/rooms")
    public ResponseEntity<List<ChatRoomDto>> getAllRooms() {
        return ResponseEntity.ok(chatService.getAllRooms());
    }

    // 채팅방 입장
    @PostMapping("/api/chat/rooms/{roomId}/enter")
    public ResponseEntity<Void> enterRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUser().getId();
        chatService.enterRoom(roomId, userId);
        return ResponseEntity.ok().build();
    }

    // 메시지 전송
    @MessageMapping("/chat/message")
    public void message(ChatCreateDto message) {
        log.info("STOMP 메시지 수신: {}", message);

        ChatResponseDto responseDto = chatService.saveMessage(1L, message);

        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }
}