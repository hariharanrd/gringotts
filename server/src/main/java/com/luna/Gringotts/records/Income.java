package com.luna.Gringotts.records;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "income", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Income extends Transaction {

    public Income(){

    }

    public Income(String refNo, LocalDateTime date, String description, Double value) {
        super(refNo,date,description,value);
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    String source;

    public enum IncomeMode {
        SALARY,CASHBACK,RETURNS,OTHERS;
    }
}
