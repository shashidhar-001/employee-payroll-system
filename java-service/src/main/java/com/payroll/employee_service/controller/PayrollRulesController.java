package com.payroll.employee_service.controller;

import com.payroll.employee_service.security.AuthUser;
import com.payroll.employee_service.service.PayrollClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payroll/rules")
public class PayrollRulesController {

    private final PayrollClient payrollClient;

    public PayrollRulesController(PayrollClient payrollClient) {
        this.payrollClient = payrollClient;
    }

    @GetMapping
    public Object get() {
        return payrollClient.getRules();
    }

    @PutMapping
    public Object update(@AuthenticationPrincipal AuthUser user, @RequestBody Map<String, Object> rules) {
        return payrollClient.updateRules(rules, user.email());
    }
}