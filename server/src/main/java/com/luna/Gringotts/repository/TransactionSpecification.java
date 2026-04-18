package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.SearchCriteria;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import java.sql.Timestamp;

public class TransactionSpecification {

    public static <T extends Transaction> Specification<T> getSpecification(List<SearchCriteria> criteriaList) {
        return (root, query, builder) -> {
            if (criteriaList == null || criteriaList.isEmpty()) {
                return builder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();
            for (SearchCriteria criteria : criteriaList) {
                Path<?> path = getPath(root, criteria.getField());
                String condition = criteria.getCondition().toLowerCase();
                String value = criteria.getValue();

                switch (condition) {
                    case "eq":
                        predicates.add(builder.equal(path, castToRequiredType(path.getJavaType(), value)));
                        break;
                    case "like":
                    case "contains":
                        predicates.add(builder.like(builder.lower(path.as(String.class)), "%" + value.toLowerCase() + "%"));
                        break;
                    case "gt":
                        predicates.add(builder.greaterThan((Expression<Comparable>) path, (Comparable) castToRequiredType(path.getJavaType(), value)));
                        break;
                    case "ge":
                        predicates.add(builder.greaterThanOrEqualTo((Expression<Comparable>) path, (Comparable) castToRequiredType(path.getJavaType(), value)));
                        break;
                    case "lt":
                        predicates.add(builder.lessThan((Expression<Comparable>) path, (Comparable) castToRequiredType(path.getJavaType(), value)));
                        break;
                    case "le":
                        predicates.add(builder.lessThanOrEqualTo((Expression<Comparable>) path, (Comparable) castToRequiredType(path.getJavaType(), value)));
                        break;
                }
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Returns a Specification that filters by the owning user. */
    public static <T extends Transaction> Specification<T> userFilter(User user) {
        return (root, query, builder) -> builder.equal(root.get("user"), user);
    }

    /**
     * Builds a combined user-scoped specification:
     * always filters by user, and optionally applies additional criteria.
     */
    public static <T extends Transaction> Specification<T> forUser(
            User user, List<SearchCriteria> criteriaList) {
        Specification<T> spec = userFilter(user);
        if (criteriaList != null && !criteriaList.isEmpty()) {
            spec = spec.and(getSpecification(criteriaList));
        }
        return spec;
    }

    private static Path<?> getPath(Root<?> root, String field) {
        if (field.contains(".")) {
            String[] parts = field.split("\\.");
            Path<?> path = root.get(parts[0]);
            for (int i = 1; i < parts.length; i++) {
                path = path.get(parts[i]);
            }
            return path;
        }
        return root.get(field);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Object castToRequiredType(Class<?> fieldType, String value) {
        try {
            if (fieldType.isAssignableFrom(Double.class) || fieldType.isAssignableFrom(double.class)) return Double.valueOf(value);
            if (fieldType.isAssignableFrom(Long.class) || fieldType.isAssignableFrom(long.class)) return Long.valueOf(value);
            if (fieldType.isAssignableFrom(Integer.class) || fieldType.isAssignableFrom(int.class)) return Integer.valueOf(value);
            if (fieldType.isAssignableFrom(Boolean.class) || fieldType.isAssignableFrom(boolean.class)) return Boolean.valueOf(value);
            if (fieldType.isAssignableFrom(LocalDateTime.class)) {
                // Handle common ISO formats
                if (value.length() == 10) { // e.g., 2023-01-01
                    return LocalDateTime.parse(value + "T00:00:00");
                }
                return LocalDateTime.parse(value);
            }
            if (Enum.class.isAssignableFrom(fieldType)) return Enum.valueOf((Class<Enum>) fieldType, value);
        } catch (Exception e) {
            // fallback for parsing failures
        }
        return value;
    }
}
