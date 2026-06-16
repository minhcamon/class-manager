package com.classmanager.config;

import com.classmanager.service.ConsoleSmsServiceImpl;
import com.classmanager.service.ESmsServiceImpl;
import com.classmanager.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class SmsConfig {

    @Value("${app.sms.api-key:}")
    private String apiKey;

    @Value("${app.sms.sender:ClassManager}")
    private String sender;

    @Bean
    public SmsService smsService() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.info("[SMS Config] Không tìm thấy SMS_API_KEY. Kích hoạt ConsoleSmsServiceImpl (Dev/MVP mode).");
            return new ConsoleSmsServiceImpl();
        } else {
            log.info("[SMS Config] Tìm thấy SMS_API_KEY. Kích hoạt ESmsServiceImpl (Production mode).");
            return new ESmsServiceImpl(apiKey, sender);
        }
    }
}
