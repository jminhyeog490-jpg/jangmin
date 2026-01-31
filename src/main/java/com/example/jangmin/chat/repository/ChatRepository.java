package com.example.jangmin.chat.repository;

import com.example.jangmin.chat.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 특정 채팅방(chatRoomId)의 모든 메시지를
     * 생성 시간(CreatedAt) 기준으로 오름차순(과거 -> 최신) 정렬하여 조회
     */
    List<ChatMessage> findAllByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId);
}