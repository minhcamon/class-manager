package com.classmanager.service;

public interface SmsService {
    void sendSms(String phoneNumber, String message);
    boolean isMock();
}
