package com.example.jangmin.chat.controller;

import com.example.jangmin.chat.dto.ChatCreateDto;
import com.example.jangmin.chat.dto.ChatResponseDto;
import com.example.jangmin.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    // SimpMessagingTemplate 서버에서 사용자한테 메세지를 쏴준다
    /**
     * 클라이언트가 /pub/chat/message 로 메시지를 보내면 호출됩니다.
     */
    @MessageMapping("/chat/message")
    public void message(ChatCreateDto message) {

        // 1. 서비스 호출해서 DB에 저장 (작성하신 Service 로직)
        // userId는 세션이나 인증 정보에서 가져와야 하지만,
        // 여기서는 이해를 돕기 위해 임시로 1L을 넣었습니다.
        ChatResponseDto responseDto = chatService.saveMessage(1L, message);

        // 2. /sub/chat/room/{roomId} 를 구독 중인 사람들에게 메시지 전달
        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
        //pub 으로 저장한 데이터들을 sub 으로 뿌린다
    }


}
