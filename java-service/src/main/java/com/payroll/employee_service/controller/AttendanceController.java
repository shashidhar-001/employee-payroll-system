package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.AttendanceCorrectionRequest;
import com.payroll.employee_service.entity.Attendance;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.repository.AttendanceRepository;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.security.AuthUser;
import jakarta.validation.Valid;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

  private static final LocalTime LATE_AFTER = LocalTime.of(9, 30);
  private static final long HALF_DAY_MINUTES = 4 * 60;
  private static final Set<String> CORRECTABLE = Set.of(
    "PRESENT",
    "LATE",
    "HALF_DAY",
    "ABSENT"
  );

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
    if (a.getCheckIn() == null) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "No check-in is recorded for today"
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

  // HR / Admin: add or fix one day's attendance, with a recorded reason
  @PutMapping("/employee/{employeeId}/correct")
  public Attendance correct(
    @AuthenticationPrincipal AuthUser user,
    @PathVariable Long employeeId,
    @Valid @RequestBody AttendanceCorrectionRequest req
  ) {
    if (employeeId.equals(user.employeeId())) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "You cannot correct your own attendance"
      );
    }
    Employee emp = employeeRepo
      .findById(employeeId)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found")
      );

    String status = req.status().trim().toUpperCase();
    if (!CORRECTABLE.contains(status)) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Status must be PRESENT, LATE, HALF_DAY or ABSENT"
      );
    }
    LocalDate date = req.date();
    if (date.isAfter(LocalDate.now())) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Cannot correct a future date"
      );
    }
    if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Sunday is a holiday"
      );
    }

    LocalTime inTime = req.checkIn();
    LocalTime outTime = req.checkOut();
    if ("ABSENT".equals(status)) {
      inTime = null;
      outTime = null;
    } else {
      if (inTime == null) {
        throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Check-in time is required"
        );
      }
      if (outTime != null && !outTime.isAfter(inTime)) {
        throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Check-out must be after check-in"
        );
      }
    }

    Attendance a = attendanceRepo
      .findByEmployeeIdAndDate(employeeId, date)
      .orElseGet(() -> {
        Attendance n = new Attendance();
        n.setEmployee(emp);
        n.setDate(date);
        return n;
      });
    a.setStatus(status);
    a.setCheckIn(inTime);
    a.setCheckOut(outTime);
    a.setCorrectedBy(user.email());
    a.setCorrectedAt(LocalDateTime.now());
    a.setCorrectionReason(req.reason().trim());
    return attendanceRepo.save(a);
  }
}
