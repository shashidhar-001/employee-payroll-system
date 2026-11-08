package com.payroll.employee_service.repository;

import com.payroll.employee_service.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    Optional<Payslip> findByEmployeeIdAndMonthAndYear(Long employeeId, int month, int year);
    List<Payslip> findByEmployeeIdOrderByYearDescMonthDesc(Long employeeId);
}