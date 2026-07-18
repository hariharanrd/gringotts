package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_member", schema = "public")
public class GroupMember {

    public GroupMember() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "group_member_seq_gen")
    @SequenceGenerator(name = "group_member_seq_gen", sequenceName = "group_member_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private TransactionGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @Column(nullable = false)
    private String role = "MEMBER"; // ADMIN, MEMBER

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, DECLINED, REMOVED, LEFT

    @Column(name = "invited_at", nullable = false, updatable = false)
    @JsonProperty("invited_at")
    private LocalDateTime invitedAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    @JsonProperty("expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "accepted_at")
    @JsonProperty("accepted_at")
    private LocalDateTime acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User invitedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TransactionGroup getGroup() {
        return group;
    }

    public void setGroup(TransactionGroup group) {
        this.group = group;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getInvitedAt() {
        return invitedAt;
    }

    public void setInvitedAt(LocalDateTime invitedAt) {
        this.invitedAt = invitedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }

    @JsonProperty("group_id")
    public Long getGroupId() {
        return group != null ? group.getId() : null;
    }

    @JsonProperty("group_name")
    public String getGroupName() {
        return group != null ? group.getName() : null;
    }

    @JsonProperty("username")
    public String getUsername() {
        return user != null ? user.getUsername() : null;
    }

    @JsonProperty("display_name")
    public String getDisplayName() {
        return user != null ? (user.getDisplayName() != null && !user.getDisplayName().isEmpty() ? user.getDisplayName() : user.getUsername()) : null;
    }

    @JsonProperty("user_id")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @JsonProperty("invited_by_username")
    public String getInvitedByUsername() {
        return invitedBy != null ? invitedBy.getUsername() : null;
    }
}
