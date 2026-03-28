package com.luna.Gringotts.records;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "app_configuration", schema = "public")
public class AppConfiguration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String category;
    private String parameter;
    
    @Column(name = "\"value\"")
    private String value;

    public AppConfiguration() {
    }

    public AppConfiguration(Long id, String category, String parameter, String value) {
        this.id = id;
        this.category = category;
        this.parameter = parameter;
        this.value = value;
    }

    public Long id() {
        return id;
    }

    public String category() {
        return category;
    }

    public String parameter() {
        return parameter;
    }

    public String value() {
        return value;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getParameter() {
        return parameter;
    }

    public void setParameter(String parameter) {
        this.parameter = parameter;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
