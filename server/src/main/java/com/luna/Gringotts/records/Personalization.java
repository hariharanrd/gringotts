package com.luna.Gringotts.records;

import jakarta.persistence.*;

@Entity
@Table(name = "personalization")
public class Personalization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category;

    @Column(name = "\"key\"", nullable = false)
    private String configKey;

    @Column(name = "\"value\"", columnDefinition = "TEXT")
    private String configValue;

    public Personalization() {
    }

    public Personalization(User user, String category, String configKey, String configValue) {
        this.user = user;
        this.category = category;
        this.configKey = configKey;
        this.configValue = configValue;
    }

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }
}
