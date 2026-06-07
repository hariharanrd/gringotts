package com.luna.Gringotts.utils;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Converter
@Component
public class CryptoConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    // Fallback static key for development (32 bytes)
    private static final byte[] DEFAULT_KEY = "GringottsZohoDefaultKeyForDev123".getBytes();

    private static SecretKeySpec secretKey;

    @Value("${gringotts.zoho.encryption-key:}")
    public void setEncryptionKey(String key) {
        if (key != null && !key.trim().isEmpty()) {
            try {
                byte[] decodedKey = Base64.getDecoder().decode(key.trim());
                if (decodedKey.length == 32) {
                    secretKey = new SecretKeySpec(decodedKey, "AES");
                } else {
                    System.err.println("Zoho encryption key is not 32 bytes. Using fallback.");
                    secretKey = new SecretKeySpec(DEFAULT_KEY, "AES");
                }
            } catch (Exception e) {
                System.err.println("Failed to decode Zoho encryption key. Using fallback. Error: " + e.getMessage());
                secretKey = new SecretKeySpec(DEFAULT_KEY, "AES");
            }
        } else {
            secretKey = new SecretKeySpec(DEFAULT_KEY, "AES");
        }
    }

    private SecretKeySpec getSecretKey() {
        if (secretKey == null) {
            // Check System environment variable directly as absolute fallback
            String envKey = System.getenv("ZOHO_ENCRYPTION_KEY");
            if (envKey != null && !envKey.trim().isEmpty()) {
                try {
                    byte[] decodedKey = Base64.getDecoder().decode(envKey.trim());
                    if (decodedKey.length == 32) {
                        secretKey = new SecretKeySpec(decodedKey, "AES");
                        return secretKey;
                    }
                } catch (Exception ignored) {}
            }
            secretKey = new SecretKeySpec(DEFAULT_KEY, "AES");
        }
        return secretKey;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes());
            byte[] cipherTextWithIv = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, cipherTextWithIv, 0, iv.length);
            System.arraycopy(cipherText, 0, cipherTextWithIv, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(cipherTextWithIv);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            byte[] cipherTextWithIv = Base64.getDecoder().decode(dbData);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            System.arraycopy(cipherTextWithIv, 0, iv, 0, iv.length);

            byte[] cipherText = new byte[cipherTextWithIv.length - iv.length];
            System.arraycopy(cipherTextWithIv, iv.length, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] decryptedText = cipher.doFinal(cipherText);
            return new String(decryptedText);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting attribute", e);
        }
    }
}
