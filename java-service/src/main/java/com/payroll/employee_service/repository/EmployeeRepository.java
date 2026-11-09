package com.payroll.employee_service.repository;

import com.payroll.employee_service.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByActiveTrue();
    List<Employee> findByDepartmentId(Long departmentId);
    Optional<Employee> findByEmail(String email);
}