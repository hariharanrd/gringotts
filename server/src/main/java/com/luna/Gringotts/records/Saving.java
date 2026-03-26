package com.luna.Gringotts.records;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "saving", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Saving extends Transaction {

    public Saving(){

    }

    public Saving(String refNo, LocalDateTime date, String description, Double value){
        super(refNo,date,description,value);
    }

    @Column(name = "active", nullable = false)
    Boolean active=true;

    @Column(name = "withdrawn_amount")
    Double withdrawnAmount;
}
