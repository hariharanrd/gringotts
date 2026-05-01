package com.luna.Gringotts.records;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;

public enum TimeRange {
    LAST_WEEK {
        @Override
        public LocalDateTime getFrom() { return LocalDateTime.now().minusDays(7); }
    },
    LAST_30_DAYS {
        @Override
        public LocalDateTime getFrom() { return LocalDateTime.now().minusDays(30); }
    },
    LAST_90_DAYS {
        @Override
        public LocalDateTime getFrom() { return LocalDateTime.now().minusDays(90); }
    },
    THIS_MONTH {
        @Override
        public LocalDateTime getFrom() {
            return LocalDateTime.now().with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
        }
    },
    PREVIOUS_MONTH {
        @Override
        public LocalDateTime getFrom() {
            return LocalDateTime.now().minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
        }
        @Override
        public LocalDateTime getTo() {
            return LocalDateTime.now().minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).with(LocalTime.MAX);
        }
    },
    THIS_YEAR {
        @Override
        public LocalDateTime getFrom() {
            return LocalDateTime.now().with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN);
        }
    },
    LAST_YEAR {
        @Override
        public LocalDateTime getFrom() {
            return LocalDateTime.now().minusYears(1).with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN);
        }
        @Override
        public LocalDateTime getTo() {
            return LocalDateTime.now().minusYears(1).with(TemporalAdjusters.lastDayOfYear()).with(LocalTime.MAX);
        }
    };

    public abstract LocalDateTime getFrom();
    public LocalDateTime getTo() { return LocalDateTime.now(); }
}
