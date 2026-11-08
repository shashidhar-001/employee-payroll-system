package com.payroll.employee_service.service;

import com.payroll.employee_service.entity.LeaveRequest;
import com.payroll.employee_service.entity.LeaveStatus;
import com.payroll.employee_service.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Set;
import java.util.TreeSet;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRepo;

    @Value("${leave.paid-per-month}")
    private int paidPerMonth;

    public LeaveService(LeaveRequestRepository leaveRepo) {
        this.leaveRepo = leaveRepo;
    }

    public int getPaidQuota() {
        return paidPerMonth;
    }

    /** Working days (Monday to Saturday) between two dates, inclusive. */
    public static int countWorkingDays(LocalDate from, LocalDate to) {
        int count = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SUNDAY) {
                count++;
            }
        }
        return count;
    }

    /** Every working day covered by an APPROVED leave in the given month. */
    public Set<LocalDate> approvedLeaveDates(Long employeeId, YearMonth ym) {
        Set<LocalDate> dates = new TreeSet<>();
        for (LeaveRequest lr : leaveRepo.findByEmployeeIdAndStatusAndFromDateBetween(
                employeeId, LeaveStatus.APPROVED, ym.atDay(1), ym.atEndOfMonth())) {
            for (LocalDate d = lr.getFromDate(); !d.isAfter(lr.getToDate()); d = d.plusDays(1)) {
                if (d.getDayOfWeek() != DayOfWeek.SUNDAY) {
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