package com.luna.Gringotts.records;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

public enum TimeRange {
    LAST_WEEK {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) { return ZonedDateTime.now(zoneId).minusDays(7).toLocalDateTime(); }
    },
    LAST_30_DAYS {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) { return ZonedDateTime.now(zoneId).minusDays(30).toLocalDateTime(); }
    },
    LAST_90_DAYS {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) { return ZonedDateTime.now(zoneId).minusDays(90).toLocalDateTime(); }
    },
    THIS_MONTH {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN).toLocalDateTime();
        }
    },
    PREVIOUS_MONTH {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN).toLocalDateTime();
        }
        @Override
        public LocalDateTime getTo(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).with(LocalTime.MAX).toLocalDateTime();
        }
    },
    THIS_YEAR {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN).toLocalDateTime();
        }
    },
    LAST_YEAR {
        @Override
        public LocalDateTime getFrom(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).minusYears(1).with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN).toLocalDateTime();
        }
        @Override
        public LocalDateTime getTo(ZoneId zoneId) {
            return ZonedDateTime.now(zoneId).minusYears(1).with(TemporalAdjusters.lastDayOfYear()).with(LocalTime.MAX).toLocalDateTime();
        }
    };

    public abstract LocalDateTime getFrom(ZoneId zoneId);
    public LocalDateTime getTo(ZoneId zoneId) { return ZonedDateTime.now(zoneId).toLocalDateTime(); }
}

