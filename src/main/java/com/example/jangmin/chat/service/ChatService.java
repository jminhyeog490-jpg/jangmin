package com.example.jangmin.chat.service;

import com.example.jangmin.chat.domain.ChatMessage;
import com.example.jangmin.chat.dto.ChatCreateDto;
import com.example.jangmin.chat.dto.ChatResponseDto;
import com.example.jangmin.chat.repository.ChatRepository;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    /**
     * 채팅 메시지 저장
     */
    @Transactional
    public ChatResponseDto saveMessage(Long userId, ChatCreateDto chatCreateDto) {
        // 1. 보낸 유저가 존재하는지 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 2. 메시지 엔티티 생성 및 빌드
        ChatMessage chatMessage = ChatMessage.builder()
                .content(chatCreateDto.content())
                .roomId(chatCreateDto.roomId())
                .sender(user)
                .build();

        // 3. DB 저장
        chatRepository.save(chatMessage);

        // 4. 결과를 DTO로 변환해서 반환
        return ChatResponseDto.from(chatMessage);
    }

    /**
     * 특정 방의 채팅 내역 조회
     */
    public List<ChatResponseDto> getChatMessages(Long roomId) {
        return chatRepository.findAllByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatResponseDto::from)
                .collect(Collectors.toList());
    }
}

