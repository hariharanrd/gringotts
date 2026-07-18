package com.luna.Gringotts.records;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_recovery_info")
public class UserRecoveryInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_recovery_info_seq_gen")
    @SequenceGenerator(name = "user_recovery_info_seq_gen", sequenceName = "user_recovery_info_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "recovery_email", unique = true)
    private String recoveryEmail;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "PENDING"; // PENDING or VERIFIED

    @Column(name = "otp")
    private String otp;

    @Column(name = "expiry")
    private LocalDateTime expiry;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRecoveryEmail() {
        return recoveryEmail;
    }

    public void setRecoveryEmail(String recoveryEmail) {
        this.recoveryEmail = recoveryEmail;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public LocalDateTime getExpiry() {
        return expiry;
    }

    public void setExpiry(LocalDateTime expiry) {
        this.expiry = expiry;
    }
}
