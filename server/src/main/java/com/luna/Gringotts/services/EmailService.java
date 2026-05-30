package com.luna.Gringotts.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${mailgun.api-key}")
    private String apiKey;

    @Value("${mailgun.domain}")
    private String domain;

    @Value("${mailgun.from-email}")
    private String fromEmail;

    @Value("${client.base-url}")
    private String clientBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendPasswordResetEmail(String toEmail, String token) {
        // Construct the reset link using the configured client base URL.
        String resetLink = clientBaseUrl + "/reset-password?token=" + token;

        String subject = "Gringotts Account Recovery - Password Reset Request";
        String htmlMessage = "<h3>Gringotts Password Reset</h3>"
                + "<p>You requested a password reset for your Gringotts account.</p>"
                + "<p>Please click the link below to reset your password. This link is valid for 15 minutes:</p>"
                + "<p><a href=\"" + resetLink
                + "\" style=\"display: inline-block; padding: 10px 20px; color: white; background-color: #3b82f6; text-decoration: none; border-radius: 5px;\">Reset Password</a></p>"
                + "<p>If the button doesn't work, copy and paste the following URL into your browser:</p>"
                + "<p style=\"word-break: break-all; color: #3b82f6;\">" + resetLink + "</p>"
                + "<p>If you did not request a password reset, please ignore this email.</p>";

        return sendEmailViaMailgun(toEmail, subject, htmlMessage);
    }

    public boolean sendVerificationOtpEmail(String toEmail, String otp) {
        String subject = "Gringotts - Verify Your Recovery Email";
        String htmlMessage = "<h3>Gringotts Recovery Email Verification</h3>"
                + "<p>You are configuring this email address as your Gringotts recovery email.</p>"
                + "<p>Please use the following 6-digit verification code to complete the process. This code is valid for 15 minutes:</p>"
                + "<p style=\"font-size: 24px; font-weight: bold; tracking-spacing: 2px; color: #3b82f6;\">" + otp
                + "</p>"
                + "<p>If you did not request this, please ignore this email.</p>";

        return sendEmailViaMailgun(toEmail, subject, htmlMessage);
    }

    private boolean sendEmailViaMailgun(String toEmail, String subject, String htmlContent) {
        try {
            String url = "https://api.mailgun.net/v3/" + domain + "/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Basic Authentication: user is "api", password is the apiKey
            String auth = "api:" + apiKey;
            byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
            String authHeader = "Basic " + new String(encodedAuth);
            headers.set("Authorization", authHeader);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("from", fromEmail);
            map.add("to", toEmail);
            map.add("subject", subject);
            map.add("html", htmlContent);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully sent recovery email to {}", toEmail);
                return true;
            } else {
                logger.error("Failed to send email via Mailgun. Status code: {}, Body: {}", response.getStatusCode(),
                        response.getBody());
                return false;
            }
        } catch (Exception e) {
            logger.error("Exception occurred while sending email via Mailgun", e);
            return false;
        }
    }
}
