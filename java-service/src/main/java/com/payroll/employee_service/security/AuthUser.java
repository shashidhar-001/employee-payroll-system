package com.payroll.employee_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record AuthUser(String email, String role, Long employeeId) {
    public Long requireEmployeeId() {
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This account is not linked to an employee record");
        }
        return employeeId;
    }
}