package com.luna.Gringotts.config;

import com.luna.Gringotts.services.IAMService;
import com.luna.Gringotts.records.User;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TenantFilterAspect {

    private static final ThreadLocal<Boolean> IS_FETCHING_USER = ThreadLocal.withInitial(() -> false);

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private IAMService iamService;

    @Before("execution(* com.luna.Gringotts.repository..*(..))")
    public void enableTenantFilter() {
        if (IS_FETCHING_USER.get()) {
            return;
        }
        try {
            IS_FETCHING_USER.set(true);
            User currentUser = iamService.getCurrentUser();
            if (currentUser != null && currentUser.getId() != null) {
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("tenantFilter").setParameter("userId", currentUser.getId());
            }
        } finally {
            IS_FETCHING_USER.set(false);
        }
    }
}
