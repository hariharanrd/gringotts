package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "revolving", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Revolving extends Transaction {

    public Revolving() {

    }

    public Revolving(String refNo, LocalDateTime date, String description, Double value, Boolean isGive) {
        super(refNo, date, description, value);
        this.isGive = isGive;
        this.closed = false;
    }

    @Column(name = "is_give", nullable = false)
    @JsonProperty("is_give")
    Boolean isGive = true;

    @Column(name = "closed", nullable = false)
    @JsonProperty("closed")
    Boolean closed = false;

    public Boolean getIsGive() {
        return isGive;
    }

    public void setIsGive(Boolean isGive) {
        this.isGive = isGive;
    }

    public Boolean getClosed() {
        return closed;
    }

    public void setClosed(Boolean closed) {
        this.closed = closed;
    }
}
