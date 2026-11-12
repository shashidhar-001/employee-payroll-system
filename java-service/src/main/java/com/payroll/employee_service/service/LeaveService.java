package com.payroll.employee_service.service;

import com.payroll.employee_service.entity.LeaveRequest;
import com.payroll.employee_service.entity.LeaveStatus;
import com.payroll.employee_service.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Set;
import java.util.TreeSet;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRepo;
    private final HolidayService holidayService;

    @Value("${leave.paid-per-month}")
    private int paidPerMonth;

    public LeaveService(LeaveRequestRepository leaveRepo, HolidayService holidayService) {
        this.leaveRepo = leaveRepo;
        this.holidayService = holidayService;
    }

    public int getPaidQuota() {
        return paidPerMonth;
    }

    /** Working days between two dates, inclusive: Sundays and declared holidays are skipped. */
    public int countWorkingDays(LocalDate from, LocalDate to) {
        return holidayService.countWorkingDays(from, to);
    }

    /** Every working day covered by an APPROVED leave in the given month. */
    public Set<LocalDate> approvedLeaveDates(Long employeeId, YearMonth ym) {
        Set<LocalDate> declared = holidayService.declaredBetween(ym.atDay(1), ym.atEndOfMonth());
        Set<LocalDate> dates = new TreeSet<>();
        for (LeaveRequest lr : leaveRepo.findByEmployeeIdAndStatusAndFromDateBetween(
                employeeId, LeaveStatus.APPROVED, ym.atDay(1), ym.atEndOfMonth())) {
            for (LocalDate d = lr.getFromDate(); !d.isAfter(lr.getToDate()); d = d.plusDays(1)) {
                if (!HolidayService.isOff(d, declared)) {
                    dates.add(d);
                }
            }
        }
        return dates;
    }

    public int pendingDays(Long employeeId, YearMonth ym) {
        return leaveRepo.findByEmployeeIdAndStatusAndFromDateBetween(
                        employeeId, LeaveStatus.PENDING, ym.atDay(1), ym.atEndOfMonth())
                .stream().mapToInt(LeaveRequest::getDays).sum();
    }
}