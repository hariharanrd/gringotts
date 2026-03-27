package com.luna.Gringotts.records;

public class SearchCriteria {
    private String field;
    private String value;
    private String condition;

    public SearchCriteria() {}

    public SearchCriteria(String field, String condition, String value) {
        this.field = field;
        this.condition = condition;
        this.value = value;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }
}
