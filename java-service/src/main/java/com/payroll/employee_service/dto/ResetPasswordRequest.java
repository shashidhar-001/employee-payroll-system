package com.payroll.employee_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
  @NotBlank @Size(min = 6) String newPassword
) {}
