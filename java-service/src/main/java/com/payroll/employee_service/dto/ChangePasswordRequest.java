// dto/ChangePasswordRequest.java
package com.payroll.employee_service.dto;
import jakarta.validation.constraints.*;
public record ChangePasswordRequest(@NotBlank String oldPassword,
                                    @NotBlank @Size(min = 6) String newPassword) {}