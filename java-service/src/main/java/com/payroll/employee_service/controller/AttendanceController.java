package com.payroll.employee_service.controller;

import com.payroll.employee_service.entity.Attendance;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.repository.AttendanceRepository;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.security.AuthUser;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

  private static final LocalTime LATE_AFTER = LocalTime.of(9, 30);
  private static final long HALF_DAY_MINUTES = 4 * 60;

  private final AttendanceRepository attendanceRepo;
  private final EmployeeRepository employeeRepo;

  public AttendanceController(
    AttendanceRepository attendanceRepo,
    EmployeeRepository employeeRepo
  ) {
    this.attendanceRepo = attendanceRepo;
    this.employeeRepo = employeeRepo;
  }

  @PostMapping("/check-in")
  @ResponseStatus(HttpStatus.CREATED)
  public Attendance checkIn(@AuthenticationPrincipal AuthUser user) {
    Long employeeId = user.requireEmployeeId();
    Employee emp = employeeRepo
      .findById(employeeId)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found")
      );
    if (!emp.isActive()) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Employee is inactive"
      );
    }

    LocalDate today = LocalDate.now();
    if (attendanceRepo.findByEmployeeIdAndDate(employeeId, today).isPresent()) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Already checked in today"
      );
    }

    LocalTime now = LocalTime.now().withNano(0);
    Attendance a = new Attendance();
    a.setEmployee(emp);
    a.setDate(today);
    a.setCheckIn(now);
    a.setStatus(now.isAfter(LATE_AFTER) ? "LATE" : "PRESENT");
    return attendanceRepo.save(a);
  }

  @PostMapping("/check-out")
  public Attendance checkOut(@AuthenticationPrincipal AuthUser user) {
    Long employeeId = user.requireEmployeeId();
    Attendance a = attendanceRepo
      .findByEmployeeIdAndDate(employeeId, LocalDate.now())
      .orElseThrow(() ->
        new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "You have not checked in today"
        )
      );
    if (a.getCheckOut() != null) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Already checked out today"
      );
    }

    LocalTime now = LocalTime.now().withNano(0);
    a.setCheckOut(now);
    if (Duration.between(a.getCheckIn(), now).toMinutes() < HALF_DAY_MINUTES) {
      a.setStatus("HALF_DAY");
    }
    return attendanceRepo.save(a);
  }

  @GetMapping("/my")
  public List<Attendance> myAttendance(
    @AuthenticationPrincipal AuthUser user,
    @RequestParam int month,
    @RequestParam int year
  ) {
    YearMonth ym = YearMonth.of(year, month);
    return attendanceRepo.findByEmployeeIdAndDateBetween(
      user.requireEmployeeId(),
      ym.atDay(1),
      ym.atEndOfMonth()
    );
  }

  // HR / Admin: view any employee's attendance
  @GetMapping("/employee/{employeeId}")
  public List<Attendance> employeeAttendance(
    @PathVariable Long employeeId,
    @RequestParam int month,
    @RequestParam int year
  ) {
    YearMonth ym = YearMonth.of(year, month);
    return attendanceRepo.findByEmployeeIdAndDateBetween(
      employeeId,
      ym.atDay(1),
      ym.atEndOfMonth()
    );
  }
}
