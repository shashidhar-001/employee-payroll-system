package com.payroll.employee_service.controller;

import com.payroll.employee_service.service.PayrollClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final PayrollClient payrollClient;

    public ReportController(PayrollClient payrollClient) {
        this.payrollClient = payrollClient;
    }

    @GetMapping("/payroll-summary")
    public Object payrollSummary(@RequestParam int month, @RequestParam int year) {
        return payrollClient.summary(month, year);
    }
}