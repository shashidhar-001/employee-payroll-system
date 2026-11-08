package com.payroll.employee_service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PayslipTestController {

    private final RestTemplate restTemplate;

    @Value("${payroll.service.url}")
    private String payrollUrl;

    public PayslipTestController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/test-payslip")
    public Object testPayslip() {
        Map<String, Object> body = Map.of(
                "employeeId", 1,
                "name", "Ravi",
                "basicSalary", 30000,
                "workingDays", 26,
                "absentDays", 2);
        return restTemplate.postForObject(payrollUrl + "/calculate", body, Object.class);
    }
}