package com.payroll.employee_service.dto;

import java.math.BigDecimal;

public record PayslipSummaryItem(
  Long employeeId,
  String employeeName,
  String department,
  BigDecimal gross,
  BigDecimal totalDeductions,
  BigDecimal netSalary
) {}
