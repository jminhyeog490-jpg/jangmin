package com.example.jangmin.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;


import java.time.Duration;

@RestController
@RequestMapping("/redis")
@RequiredArgsConstructor
public class RedisController {

    private final RedisService redisService;

    @PostMapping("/save")
    public String save(@RequestParam String key, @RequestParam String value, @RequestParam Duration duration) {
        redisService.setValues(key, value, Duration.ofMinutes(5));
        return "저장 완료!";
    }

    @GetMapping("/get")
    public String get(@RequestParam String key) {
        return redisService.getValues(key);
    }
}