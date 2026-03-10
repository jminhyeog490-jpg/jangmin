package com.example.jangmin.global;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class) // 에러가 발생하면 MethodArgumentNotValidException 실행
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>(); //맵을 준비해서
        e.getBindingResult().getAllErrors().forEach((error) -> { //getBindingResult 에서 getAllErrors 를 꺼내와서 forEach 에서 하나씩 반복
            String fieldName = ((FieldError) error).getField(); //error 를 FieldError 변환해서 항목 이름을 찾는다
            String errorMessage = error.getDefaultMessage();//그 에러 메세지 발생
            errors.put(fieldName, errorMessage); // 에러명과 필드네임 저장
        });
        return ResponseEntity.badRequest().body(errors); //저장

    }
    //  서비스 로직 예외 처리
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    //  그 외 예상치 못한 모든 예외
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception e) {
        return ResponseEntity.internalServerError().body("서버 내부 오류가 발생했습니다.");
    }


}
