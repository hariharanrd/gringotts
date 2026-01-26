package com.luna.Gringotts.records;

import jakarta.persistence.*;

@Entity
@Table(name = "app_configuration", schema = "public")
public record AppConfiguration(@GeneratedValue(strategy = GenerationType.IDENTITY) @Id Long id, String category, String parameter, String value) {
}

