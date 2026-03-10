package com.example.jangmin.chat.service;

import com.example.jangmin.chat.domain.ChatMessage;
import com.example.jangmin.chat.domain.ChatRoom;
import com.example.jangmin.chat.domain.ChatRoomMember;
import com.example.jangmin.chat.dto.ChatCreateDto;
import com.example.jangmin.chat.dto.ChatResponseDto;
import com.example.jangmin.chat.dto.ChatRoomDto;
import com.example.jangmin.chat.repository.ChatRepository;
import com.example.jangmin.chat.repository.ChatRoomMemberRepository;
import com.example.jangmin.chat.repository.ChatRoomRepository;
import com.example.jangmin.user.domain.User;
import com.example.jangmin.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    // 채팅방 생성
    @Transactional
    public ChatRoomDto createRoom(String title, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ChatRoom chatRoom = ChatRoom.builder()
                .title(title)
                .creator(user)
                .build();

        chatRoomRepository.save(chatRoom);
        
        enterRoom(chatRoom.getId(), userId);

        return ChatRoomDto.from(chatRoom);
    }

    // 채팅방 입장
    @Transactional
    public void enterRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user).isPresent()) {
            return;
        }

        ChatRoomMember member = ChatRoomMember.builder()
                .chatRoom(chatRoom)
                .user(user)
                .build();

        chatRoomMemberRepository.save(member);
    }

    // 채팅 메시지 저장
    @Transactional
    public ChatResponseDto saveMessage(Long userId, ChatCreateDto chatCreateDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ChatRoom chatRoom = chatRoomRepository.findById(chatCreateDto.roomId())
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        ChatMessage chatMessage = ChatMessage.builder()
                .content(chatCreateDto.content())
                .chatRoom(chatRoom)
                .sender(user)
                .build();

        chatRepository.save(chatMessage);

        return ChatResponseDto.from(chatMessage);
    }

    // 채팅 내역 조회
    public List<ChatResponseDto> getChatMessages(Long roomId) {
        return chatRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatResponseDto::from)
                .collect(Collectors.toList());
    }
    
    // 채팅방 목록 조회
    public List<ChatRoomDto> getAllRooms() {
        return chatRoomRepository.findAll().stream()
                .map(ChatRoomDto::from)
                .collect(Collectors.toList());
    }
}