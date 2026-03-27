package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.SearchCriteria;
import com.luna.Gringotts.records.Transaction;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;

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
                    case "lt":
                        predicates.add(builder.lessThan((Expression<Comparable>) path, (Comparable) castToRequiredType(path.getJavaType(), value)));
                        break;
                }
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
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
            if (Enum.class.isAssignableFrom(fieldType)) return Enum.valueOf((Class<Enum>) fieldType, value);
        } catch (Exception e) {
            // fallback for parsing failures
        }
        return value;
    }
}
