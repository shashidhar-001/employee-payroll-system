package com.payroll.employee_service.dto;

import java.math.BigDecimal;

public record PayrollCalcResponse(Long employeeId, String name, BigDecimal basic, BigDecimal hra,
                                  BigDecimal da, BigDecimal gross, BigDecimal pf,
                                  BigDecimal professionalTax, BigDecimal incomeTax,
                                  BigDecimal lossOfPay, BigDecimal totalDeductions,
                                  BigDecimal netSalary) {}