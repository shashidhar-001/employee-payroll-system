package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.CreateUserRequest;
import com.payroll.employee_service.dto.ResetPasswordRequest;
import com.payroll.employee_service.dto.UserSummary;
import com.payroll.employee_service.entity.AppUser;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.entity.Role;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.repository.UserRepository;
import com.payroll.employee_service.security.AuthUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserRepository userRepo;
  private final EmployeeRepository employeeRepo;
  private final PasswordEncoder encoder;

  public UserController(
    UserRepository userRepo,
    EmployeeRepository employeeRepo,
    PasswordEncoder encoder
  ) {
    this.userRepo = userRepo;
    this.employeeRepo = employeeRepo;
    this.encoder = encoder;
  }

  @GetMapping
  public List<UserSummary> list() {
    return userRepo.findAll().stream().map(this::toSummary).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserSummary create(@Valid @RequestBody CreateUserRequest req) {
    if (userRepo.existsByEmail(req.email())) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Email already has an account"
      );
    }

    Employee emp = null;
    if (req.employeeId() != null) {
      emp = employeeRepo
        .findById(req.employeeId())
        .orElseThrow(() ->
          new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Employee not found"
          )
        );
      if (userRepo.existsByEmployeeId(req.employeeId())) {
        throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "This employee already has an account"
        );
      }
    }
    if (req.role() != Role.ADMIN && emp == null) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "HR and EMPLOYEE accounts must be linked to an employeeId"
      );
    }

    AppUser u = new AppUser();
    u.setEmail(req.email());
    u.setPassword(encoder.encode(req.password()));
    u.setRole(req.role());
    u.setEmployee(emp);
    return toSummary(userRepo.save(u));
  }

  @DeleteMapping("/{id}")
  public UserSummary deactivate(
    @AuthenticationPrincipal AuthUser me,
    @PathVariable Long id
  ) {
    AppUser u = findUser(id);
    if (u.getEmail().equalsIgnoreCase(me.email())) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "You cannot deactivate your own account"
      );
    }
    u.setActive(false);
    return toSummary(userRepo.save(u));
  }

  @PutMapping("/{id}/activate")
  public UserSummary activate(@PathVariable Long id) {
    AppUser u = findUser(id);
    u.setActive(true);
    return toSummary(userRepo.save(u));
  }

  @PutMapping("/{id}/password")
  public UserSummary resetPassword(
    @PathVariable Long id,
    @Valid @RequestBody ResetPasswordRequest req
  ) {
    AppUser u = findUser(id);
    u.setPassword(encoder.encode(req.newPassword()));
    return toSummary(userRepo.save(u));
  }

  private AppUser findUser(Long id) {
    return userRepo
      .findById(id)
      .orElseThrow(() ->
        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
      );
  }

  private UserSummary toSummary(AppUser u) {
    return new UserSummary(
      u.getId(),
      u.getEmail(),
      u.getRole().name(),
      u.getEmployee() == null ? null : u.getEmployee().getId(),
      u.isActive()
    );
  }
}
