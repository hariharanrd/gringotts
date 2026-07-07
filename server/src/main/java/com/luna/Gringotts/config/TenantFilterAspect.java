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

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private IAMService iamService;

    @Before("execution(* com.luna.Gringotts.repository..*(..))")
    public void enableTenantFilter() {
        User currentUser = iamService.getCurrentUser();
        if (currentUser != null && currentUser.getId() != null) {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("tenantFilter").setParameter("userId", currentUser.getId());
        }
    }
}
