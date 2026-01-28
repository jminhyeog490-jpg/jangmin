package com.example.jangmin.global;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
//실시간 채팅 도로를 깐 느낌
@Configuration //스프링 설정 클래스임을 선언
@EnableWebSocketMessageBroker // 메세지를 주고받는 브로커 역할
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 채팅 연결 엔드포인트: /ws-chat
        registry.addEndpoint("/ws-chat").setAllowedOriginPatterns("*").withSockJS();
        //.addEndpoint("/ws-chat") 웹소켓에 접속을 위한 통로 .setAllowedOriginPatterns("*") 서버상 보안을 위해 막는 통로를 허가해줌
        // .withSockJS() 웹소켓은 모든 브라우저가 지원하지 않음으로 이때.withSockJS() 를 이용하여 다른 방식으로 연결해주는 보조장치
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 구독 요청 경로
        registry.enableSimpleBroker("/sub");
        //enableSimpleBroker를 사용하여 스프링 내부 메모리를 사용 메세지 받기
        // 메시지 발행 요청 경로
        registry.setApplicationDestinationPrefixes("/pub");
        //브로커한테 바로 안가고 자바 코드를 거치게 하는 용도 즉 컨트롤러를 거치게 하는 역할
        //Application:서버코드 Destination: 도착 목적지 Prefixes: 주소 맨앞에 붙는 접두사

    }
}