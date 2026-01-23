package com.luna.Gringotts.records;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "saving", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Saving extends Transaction {

    @Column(name = "active", nullable = false)
    Boolean active=true;

    @Column(name = "withdrawn_amount")
    Double withdrawnAmount;
}
