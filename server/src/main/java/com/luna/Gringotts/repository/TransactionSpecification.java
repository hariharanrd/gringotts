package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.SearchCriteria;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.lang.reflect.Field;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TransactionSpecification {

    private static final Set<String> ALLOWED_SEARCH_FIELDS = Set.of(
            "description",
            "notes",
            "value",
            "transactiontime",
            "createdat",
            "category.name",
            "category.id",
            "subcategory.name",
            "subcategory.id",
            "item.name",
            "item.id",
            "paymentmode",
            "creditcard.id",
            "creditcard.nickname",
            "creditcard.name",
            "isin",
            "isgive",
            "closed",
            "group.id",
            "group.name",
            "fundinggoal.id",
            "fundingloan.id",
            "loan.id",
            "includeinbudget",
            "createdby"
    );

    @SuppressWarnings({ "unchecked", "rawtypes" })
    public static <T extends Transaction> Specification<T> getSpecification(List<SearchCriteria> criteriaList) {
        return (root, query, builder) -> {
            if (criteriaList == null || criteriaList.isEmpty()) {
                return builder.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();
            for (SearchCriteria criteria : criteriaList) {
                try {
                    if (criteria.getField() == null || criteria.getCondition() == null || criteria.getValue() == null) {
                        continue;
                    }
                    String normalizedField = criteria.getField().toLowerCase().replace("_", "");
                    if (!ALLOWED_SEARCH_FIELDS.contains(normalizedField)) {
                        continue;
                    }

                    Path<?> path = getPath(root, criteria.getField());
                    String condition = criteria.getCondition().toLowerCase();
                    String value = criteria.getValue();

                    Class<?> targetType = path.getJavaType();

                    if (targetType.equals(LocalDateTime.class)) {
                        switch (condition) {
                            case "eq":
                                if (value.length() == 10) {
                                    LocalDateTime startOfDay = LocalDateTime.parse(value + "T00:00:00");
                                    LocalDateTime endOfDay = LocalDateTime.parse(value + "T23:59:59.999999999");
                                    predicates.add(builder.between((Expression<LocalDateTime>) path, startOfDay, endOfDay));
                                } else {
                                    predicates.add(builder.equal(path, LocalDateTime.parse(value)));
                                }
                                break;
                            case "gt":
                                LocalDateTime gtTime = value.length() == 10 ? LocalDateTime.parse(value + "T23:59:59.999999999") : LocalDateTime.parse(value);
                                predicates.add(builder.greaterThan((Expression<LocalDateTime>) path, gtTime));
                                break;
                            case "ge":
                                LocalDateTime geTime = value.length() == 10 ? LocalDateTime.parse(value + "T00:00:00") : LocalDateTime.parse(value);
                                predicates.add(builder.greaterThanOrEqualTo((Expression<LocalDateTime>) path, geTime));
                                break;
                            case "lt":
                                LocalDateTime ltTime = value.length() == 10 ? LocalDateTime.parse(value + "T00:00:00") : LocalDateTime.parse(value);
                                predicates.add(builder.lessThan((Expression<LocalDateTime>) path, ltTime));
                                break;
                            case "le":
                                LocalDateTime leTime = value.length() == 10 ? LocalDateTime.parse(value + "T23:59:59.999999999") : LocalDateTime.parse(value);
                                predicates.add(builder.lessThanOrEqualTo((Expression<LocalDateTime>) path, leTime));
                                break;
                        }
                    } else {
                        switch (condition) {
                            case "eq":
                                predicates.add(builder.equal(path, castToRequiredType(targetType, value)));
                                break;
                            case "like":
                            case "contains":
                                predicates.add(builder.like(builder.lower(path.as(String.class)),
                                        "%" + value.toLowerCase() + "%"));
                                break;
                            case "gt":
                                predicates.add(builder.greaterThan((Expression<Comparable>) path,
                                        (Comparable) castToRequiredType(targetType, value)));
                                break;
                            case "ge":
                                predicates.add(builder.greaterThanOrEqualTo((Expression<Comparable>) path,
                                        (Comparable) castToRequiredType(targetType, value)));
                                break;
                            case "lt":
                                predicates.add(builder.lessThan((Expression<Comparable>) path,
                                        (Comparable) castToRequiredType(targetType, value)));
                                break;
                            case "le":
                                predicates.add(builder.lessThanOrEqualTo((Expression<Comparable>) path,
                                        (Comparable) castToRequiredType(targetType, value)));
                                break;
                        }
                    }
                } catch (IllegalArgumentException ignored) {
                    // Ignore criteria if the field doesn't exist for the current transaction type
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
            Class<?> currentClass = root.getJavaType();
            String resolvedFirstPart = resolveFieldName(currentClass, parts[0]);
            Path<?> path = root.get(resolvedFirstPart);

            for (int i = 1; i < parts.length; i++) {
                currentClass = path.getJavaType();
                String resolvedPart = resolveFieldName(currentClass, parts[i]);
                path = path.get(resolvedPart);
            }
            return path;
        }
        return root.get(resolveFieldName(root.getJavaType(), field));
    }

    private static String resolveFieldName(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        String normalizedInput = fieldName.replace("_", "");
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                if (field.isAnnotationPresent(JsonProperty.class)) {
                    String jsonValue = field.getAnnotation(JsonProperty.class).value();
                    if (fieldName.equalsIgnoreCase(jsonValue) || normalizedInput.equalsIgnoreCase(jsonValue.replace("_", ""))) {
                        return field.getName();
                    }
                }
                if (fieldName.equalsIgnoreCase(field.getName()) || normalizedInput.equalsIgnoreCase(field.getName().replace("_", ""))) {
                    return field.getName();
                }
            }
            current = current.getSuperclass();
        }
        return fieldName;
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })
    private static Object castToRequiredType(Class<?> fieldType, String value) {
        try {
            if (fieldType.isAssignableFrom(Double.class) || fieldType.isAssignableFrom(double.class))
                return Double.valueOf(value);
            if (fieldType.isAssignableFrom(Long.class) || fieldType.isAssignableFrom(long.class))
                return Long.valueOf(value);
            if (fieldType.isAssignableFrom(Integer.class) || fieldType.isAssignableFrom(int.class))
                return Integer.valueOf(value);
            if (fieldType.isAssignableFrom(Boolean.class) || fieldType.isAssignableFrom(boolean.class))
                return Boolean.valueOf(value);
            if (fieldType.isAssignableFrom(LocalDateTime.class)) {
                if (value.length() == 10) {
                    return LocalDateTime.parse(value + "T00:00:00");
                }
                return LocalDateTime.parse(value);
            }
            if (Enum.class.isAssignableFrom(fieldType))
                return Enum.valueOf((Class<Enum>) fieldType, value);
        } catch (Exception e) {
            // fallback for parsing failures
        }
        return value;
    }
}

