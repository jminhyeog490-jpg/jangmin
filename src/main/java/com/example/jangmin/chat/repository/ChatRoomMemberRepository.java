package com.example.jangmin.chat.repository;

import com.example.jangmin.chat.domain.ChatRoom;
import com.example.jangmin.chat.domain.ChatRoomMember;
import com.example.jangmin.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    Optional<ChatRoomMember> findByChatRoomAndUser(ChatRoom chatRoom, User user);
    List<ChatRoomMember> findAllByChatRoom(ChatRoom chatRoom);
}