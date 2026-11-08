package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.LeaveApplyRequest;
import com.payroll.employee_service.dto.LeaveBalance;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.entity.LeaveRequest;
import com.payroll.employee_service.entity.LeaveStatus;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.repository.LeaveRequestRepository;
import com.payroll.employee_service.security.AuthUser;
import com.payroll.employee_service.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveRequestRepository leaveRepo;
    private final EmployeeRepository employeeRepo;
    private final LeaveService leaveService;

    public LeaveController(LeaveRequestRepository leaveRepo, EmployeeRepository employeeRepo,
                           LeaveService leaveService) {
        this.leaveRepo = leaveRepo;
        this.employeeRepo = employeeRepo;
        this.leaveService = leaveService;
    }

    // ---------- Employee ----------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequest apply(@AuthenticationPrincipal AuthUser user,
                              @Valid @RequestBody LeaveApplyRequest req) {
        if (!"EMPLOYEE".equals(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only employees apply for leave through this system");
        }
        Long employeeId = user.requireEmployeeId();
        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        LocalDate from = req.fromDate();
        LocalDate to = req.toDate();

        if (from.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave cannot start in the past");
        }
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date is before start date");
        }
        if (!YearMonth.from(from).equals(YearMonth.from(to))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A leave request must stay within one month. Apply separately for each month.");
        }
        int days = LeaveService.countWorkingDays(from, to);
        if (days == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The selected dates are only Sundays, which are already holidays");
        }
        boolean overlaps = !leaveRepo
                .findByEmployeeIdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                        employeeId, List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED), to, from)
                .isEmpty();
        if (overlaps) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have a pending or approved leave on these dates");
        }

        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(emp);
        lr.setLeaveType(req.leaveType());
        lr.setFromDate(from);
        lr.setToDate(to);
        lr.setDays(days);
        lr.setReason(req.reason());
        lr.setStatus(LeaveStatus.PENDING);
        lr.setAppliedAt(LocalDateTime.now());
        return leaveRepo.save(lr);
    }

    @GetMapping("/my")
    public List<LeaveRequest> myLeaves(@AuthenticationPrincipal AuthUser user) {
        return leaveRepo.findByEmployeeIdOrderByAppliedAtDesc(user.requireEmployeeId());
    }

    @GetMapping("/balance")
    public LeaveBalance balance(@AuthenticationPrincipal AuthUser user,
                                @RequestParam int month, @RequestParam int year) {
        Long employeeId = user.requireEmployeeId();
        YearMonth ym = YearMonth.of(year, month);
        int approved = leaveService.approvedLeaveDates(employeeId, ym).size();
        int quota = leaveService.getPaidQuota();
        return new LeaveBalance(month, year, quota, approved,
                leaveService.pendingDays(employeeId, ym),
                Math.max(0, quota - approved),
                Math.max(0, approved - quota));
    }

    @PutMapping("/{id}/cancel")
    public LeaveRequest cancel(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        LeaveRequest lr = find(id);
        if (!lr.getEmployee().getId().equals(user.requireEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your leave request");
        }
        if (lr.getStatus() != LeaveStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending requests can be cancelled");
        }
        lr.setStatus(LeaveStatus.CANCELLED);
        return leaveRepo.save(lr);
    }

    // ---------- HR / Admin ----------

    @GetMapping("/pending")
    public List<LeaveRequest> pending() {
        return leaveRepo.findByStatusOrderByAppliedAtAsc(LeaveStatus.PENDING);
    }

    @GetMapping("/employee/{employeeId}")
    public List<LeaveRequest> ofEmployee(@PathVariable Long employeeId) {
        return leaveRepo.findByEmployeeIdOrderByAppliedAtDesc(employeeId);
    }

    @PutMapping("/{id}/approve")
    public LeaveRequest approve(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                                @RequestParam(required = false) String remarks) {
        return decide(user, id, LeaveStatus.APPROVED, remarks);
    }

    @PutMapping("/{id}/reject")
    public LeaveRequest reject(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                               @RequestParam(required = false) String remarks) {
        return decide(user, id, LeaveStatus.REJECTED, remarks);
    }

    private LeaveRequest decide(AuthUser user, Long id, LeaveStatus newStatus, String remarks) {
        LeaveRequest lr = find(id);
        if (lr.getStatus() != LeaveStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This request is already " + lr.getStatus());
        }
        if (lr.getEmployee().getId().equals(user.employeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot decide your own leave request");
        }
        lr.setStatus(newStatus);
        lr.setDecidedBy(user.email());
        lr.setDecidedAt(LocalDateTime.now());
        lr.setRemarks(remarks);
        return leaveRepo.save(lr);
    }

    private LeaveRequest find(Long id) {
        return leaveRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found"));
    }
}