package com.luna.Gringotts.records;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "sub_category", schema = "public", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name", "category"})
})
public class SubCategory {

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category")
    @OnDelete(action = OnDeleteAction.RESTRICT)
    Category category;

    public Long getId(){
        return id;
    }

    public String getName(){
        return name;
    }

    public String getDescription(){
        return description;
    }

    public Category getCategory(){
        return category;
    }
}
