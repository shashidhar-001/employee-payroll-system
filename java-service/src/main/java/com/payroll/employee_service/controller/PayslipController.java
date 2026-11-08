package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.PayrollCalcRequest;
import com.payroll.employee_service.dto.PayrollCalcResponse;
import com.payroll.employee_service.entity.Attendance;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.entity.Payslip;
import com.payroll.employee_service.repository.AttendanceRepository;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.repository.PayslipRepository;
import com.payroll.employee_service.service.PayrollClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/payslips")
public class PayslipController {

    private final EmployeeRepository employeeRepo;
    private final AttendanceRepository attendanceRepo;
    private final PayslipRepository payslipRepo;
    private final PayrollClient payrollClient;

    public PayslipController(EmployeeRepository employeeRepo, AttendanceRepository attendanceRepo,
                             PayslipRepository payslipRepo, PayrollClient payrollClient) {
        this.employeeRepo = employeeRepo;
        this.attendanceRepo = attendanceRepo;
        this.payslipRepo = payslipRepo;
        this.payrollClient = payrollClient;
    }

    @PostMapping("/generate")
    public Payslip generate(@RequestParam Long employeeId, @RequestParam int month, @RequestParam int year) {
        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        YearMonth ym;
        try {
            ym = YearMonth.of(year, month);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid month or year");
        }
        if (ym.isAfter(YearMonth.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot generate a payslip for a future month");
        }

        // 1. Working days = all days in the month except Sundays
        int workingDays = 0;
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            if (ym.atDay(d).getDayOfWeek() != DayOfWeek.SUNDAY) {
                workingDays++;
            }
        }

        // 2. Present days from attendance (PRESENT and LATE = 1, HALF_DAY = 0.5)
        List<Attendance> records = attendanceRepo.findByEmployeeIdAndDateBetween(
                employeeId, ym.atDay(1), ym.atEndOfMonth());
        double present = 0;
        for (Attendance a : records) {
            switch (a.getStatus()) {
                case "PRESENT", "LATE", "ON_LEAVE" -> present += 1;
                case "HALF_DAY" -> present += 0.5;
                default -> { }
            }
        }

        // 3. Absent days (never below zero, e.g. if someone worked on a Sunday)
        BigDecimal absent = BigDecimal.valueOf(Math.max(0, workingDays - present));

        // 4. Remote call to the .NET payroll service
        PayrollCalcResponse r = payrollClient.calculate(new PayrollCalcRequest(
                emp.getId(), emp.getName(), emp.getBasicSalary(), workingDays, absent));

        // 5. Save the payslip (regenerating the same month overwrites the old one)
        Payslip p = payslipRepo.findByEmployeeIdAndMonthAndYear(employeeId, month, year)
                .orElseGet(Payslip::new);
        p.setEmployee(emp);
        p.setMonth(month);
        p.setYear(year);
        p.setWorkingDays(workingDays);
        p.setAbsentDays(absent);
        p.setBasic(r.basic());
        p.setHra(r.hra());
        p.setDa(r.da());
        p.setGross(r.gross());
        p.setPf(r.pf());
        p.setProfessionalTax(r.professionalTax());
        p.setIncomeTax(r.incomeTax());
        p.setLossOfPay(r.lossOfPay());
        p.setTotalDeductions(r.totalDeductions());
        p.setNetSalary(r.netSalary());
        p.setGeneratedAt(LocalDateTime.now());
        return payslipRepo.save(p);
    }

    @GetMapping
    public List<Payslip> history(@RequestParam Long employeeId) {
        return payslipRepo.findByEmployeeIdOrderByYearDescMonthDesc(employeeId);
    }

    @GetMapping("/one")
    public Payslip getOne(@RequestParam Long employeeId, @RequestParam int month, @RequestParam int year) {
        return payslipRepo.findByEmployeeIdAndMonthAndYear(employeeId, month, year)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payslip not found"));
    }
}