package com.payroll.employee_service.dto;

import java.math.BigDecimal;

public record PayrollCalcRequest(Long employeeId, String name, BigDecimal basicSalary,
                                 int workingDays, BigDecimal absentDays) {}