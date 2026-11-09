package com.payroll.employee_service.repository;

import com.payroll.employee_service.entity.Payslip;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
  Optional<Payslip> findByEmployeeIdAndMonthAndYear(
    Long employeeId,
    int month,
    int year
  );
  List<Payslip> findByEmployeeIdOrderByYearDescMonthDesc(Long employeeId);
  List<Payslip> findByMonthAndYear(int month, int year);
}
