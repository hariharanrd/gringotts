package com.luna.Gringotts.records;

public enum GoalType {
    PERSISTENT("PERSISTENT"),
    ONE_TIME("ONE_TIME");

    private final String value;

    GoalType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static GoalType fromString(String value) {
        for (GoalType type : GoalType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid goal type: " + value);
    }
}
