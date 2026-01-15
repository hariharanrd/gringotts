package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "item", schema = "public", uniqueConstraints = {@UniqueConstraint(columnNames = {"name", "subcategory"})})
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subcategory")
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonProperty("sub_category")
    SubCategory subCategory;

    public Long getId(){
        return id;
    }

    public String getName(){
        return name;
    }

    public String getDescription(){
        return description;
    }

}
