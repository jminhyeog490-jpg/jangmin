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

    // --- HTTP API (방 관리) ---

    /**
     * 채팅방 생성
     */
    @PostMapping("/api/chat/rooms")
    public ResponseEntity<ChatRoomDto> createRoom(
            @RequestBody String title,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUser().getId();
        ChatRoomDto room = chatService.createRoom(title, userId);
        return ResponseEntity.ok(room);
    }

    /**
     * 채팅방 목록 조회
     */
    @GetMapping("/api/chat/rooms")
    public ResponseEntity<List<ChatRoomDto>> getAllRooms() {
        return ResponseEntity.ok(chatService.getAllRooms());
    }

    /**
     * 채팅방 입장 (멤버 등록)
     */
    @PostMapping("/api/chat/rooms/{roomId}/enter")
    public ResponseEntity<Void> enterRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUser().getId();
        chatService.enterRoom(roomId, userId);
        return ResponseEntity.ok().build();
    }


    // --- WebSocket (메시지 전송) ---

    /**
     * 클라이언트가 /pub/chat/message 로 메시지를 보내면 호출됩니다.
     */
    @MessageMapping("/chat/message")
    public void message(ChatCreateDto message) {
        log.info("STOMP 메시지 수신: {}", message);

        // 1. 서비스 호출해서 DB에 저장
        // 실제로는 SecurityContextHolder나 헤더에서 유저 정보를 가져와야 하지만,
        // WebSocket에서는 @AuthenticationPrincipal이 바로 동작하지 않을 수 있어
        // 별도 설정이 필요합니다. 여기서는 임시로 1L로 고정하거나,
        // 메시지 DTO에 senderId를 포함시키는 방식을 쓸 수 있습니다.
        // 일단 기존처럼 1L로 유지합니다. (추후 개선 필요)
        ChatResponseDto responseDto = chatService.saveMessage(1L, message);

        // 2. /sub/chat/room/{roomId} 를 구독 중인 사람들에게 메시지 전달
        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }
}