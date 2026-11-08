// dto/CreateUserRequest.java
package com.payroll.employee_service.dto;
import com.payroll.employee_service.entity.Role;
import jakarta.validation.constraints.*;
public record CreateUserRequest(@Email @NotBlank String email,
                                @NotBlank @Size(min = 6) String password,
                                @NotNull Role role,
                                Long employeeId) {}