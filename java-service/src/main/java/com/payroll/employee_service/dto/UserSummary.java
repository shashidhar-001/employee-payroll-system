// dto/UserSummary.java  (never returns the password hash)
package com.payroll.employee_service.dto;
public record UserSummary(Long id, String email, String role, Long employeeId, boolean active) {}