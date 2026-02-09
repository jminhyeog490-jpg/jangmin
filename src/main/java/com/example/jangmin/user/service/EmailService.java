package com.example.jangmin.user.service;

import com.example.jangmin.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class EmailService {
    // JavaMailSender 스프링에서 제공하는 메일 발송 인터페이스
    private final JavaMailSender mailSender;
    private final RedisService redisService;

    // 이메일 인증 코드의 유효 기간 (예: 5분) AUTH_CODE_DURATION 수명결정 설정값
    private final Duration AUTH_CODE_DURATION = Duration.ofMinutes(5);

    // 1. 인증 번호 생성 및 발송 최소값 100000 으로 지정후 6자리 난수 생성
    public void sendVerificationCode(String email) {
        String authCode = String.valueOf((int)(Math.random() * 899999) + 100000); // 6자리 난수

        // Redis에 저장 (Key: 이메일, Value: 인증코드)
        // 기존에 만드신 setValues 메서드 활용
        redisService.setValues("AUTH:" + email, authCode, AUTH_CODE_DURATION);

        // 실제 메일 발송 로직
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("jminhyeog@gmail.com"); // 발신자 이메일
        message.setTo(email); //  수신자 이메일
        message.setSubject("인증번호 확인");//메일 제목
        message.setText("인증번호는 [" + authCode + "] 입니다."); //  이건 누가봐도
        mailSender.send(message); //메일전송
    }

    public boolean verifyCode(String email, String inputCode) {
        String authKey = "AUTH:" + email;
        String savedCode = redisService.getValues(authKey);

        // 1. 여기서 5분 컷! (메일 발송 시 설정한 5분이 지나면 savedCode는 null임)
        if (savedCode != null && savedCode.equals(inputCode)) {

            // 2. 번호 확인 성공했으니 숫자로 된 인증번호는 즉시 삭제
            redisService.deleteValues(authKey);

            // 3. 회원가입용 티켓(DONE) 생성 - "시간 없음(무제한 혹은 아주 길게)"
            // 가입 완료 전까지 시간에 쫓기지 않도록 시간을 주지 않거나 아주 길게 설정합니다.
            redisService.setValues("DONE:" + email, "true", Duration.ofHours(10)); // 시간 파라미터 제외 혹은 아주 긴 시간

            return true;
        }
        return false;
    }
}