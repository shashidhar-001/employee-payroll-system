// dto/LoginResponse.java
package com.payroll.employee_service.dto;
public record LoginResponse(String token, String email, String role, Long employeeId) {}