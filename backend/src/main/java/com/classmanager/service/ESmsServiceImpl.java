package com.classmanager.service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ESmsServiceImpl implements SmsService {
    private final String apiKey;
    private final String sender;

    public ESmsServiceImpl(String apiKey, String sender) {
        this.apiKey = apiKey;
        this.sender = sender;
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("[ESMS] Đang gửi tin nhắn qua eSMS API đến số {} [Sender: {}, Key: {}]", phoneNumber, sender, apiKey.substring(0, Math.min(apiKey.length(), 4)) + "...");
        // Triển khai cuộc gọi HTTP Client đến eSMS thực tế ở đây
    }

    @Override
    public boolean isMock() {
        return false;
    }
}
