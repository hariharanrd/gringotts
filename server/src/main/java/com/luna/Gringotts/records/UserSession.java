package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_sessions", schema = "public")
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "token_id", nullable = false, unique = true)
    @JsonIgnore
    private String tokenId;

    @Column(name = "ip_address", length = 45)
    @JsonProperty("ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    @JsonProperty("user_agent")
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_active_at", nullable = false)
    @UpdateTimestamp
    @JsonProperty("last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "is_revoked", nullable = false)
    @JsonProperty("is_revoked")
    private boolean isRevoked = false;

    public UserSession() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public boolean isRevoked() { return isRevoked; }
    public void setRevoked(boolean revoked) { isRevoked = revoked; }
}
