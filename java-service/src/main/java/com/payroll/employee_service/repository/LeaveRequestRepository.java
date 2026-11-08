package com.payroll.employee_service.repository;

import com.payroll.employee_service.entity.LeaveRequest;
import com.payroll.employee_service.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByAppliedAtDesc(Long employeeId);

    List<LeaveRequest> findByStatusOrderByAppliedAtAsc(LeaveStatus status);

    // Requests of an employee in a month with a given status (requests never cross months)
    List<LeaveRequest> findByEmployeeIdAndStatusAndFromDateBetween(
            Long employeeId, LeaveStatus status, LocalDate from, LocalDate to);

    // Overlap check: existing.from <= newTo AND existing.to >= newFrom
    List<LeaveRequest> findByEmployeeIdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
            Long employeeId, Collection<LeaveStatus> statuses, LocalDate newTo, LocalDate newFrom);
}