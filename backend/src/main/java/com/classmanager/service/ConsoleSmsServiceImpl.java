package com.classmanager.service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConsoleSmsServiceImpl implements SmsService {
    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("[MOCK SMS] Số nhận: {}, Nội dung: {}", phoneNumber, message);
    }

    @Override
    public boolean isMock() {
        return true;
    }
}
