// dto/LoginRequest.java
package com.payroll.employee_service.dto;
import jakarta.validation.constraints.NotBlank;
public record LoginRequest(@NotBlank String email, @NotBlank String password) {}