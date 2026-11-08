package com.payroll.employee_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private String phone;
    private String designation;
    private LocalDate joiningDate;

    @NotNull
    @Positive
    private BigDecimal basicSalary;

    @NotNull
    private Long departmentId;
}