package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.*;
import com.payroll.employee_service.entity.AppUser;
import com.payroll.employee_service.repository.EmployeeRepository;
import com.payroll.employee_service.repository.UserRepository;
import com.payroll.employee_service.security.AuthUser;
import com.payroll.employee_service.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final EmployeeRepository employeeRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepo, EmployeeRepository employeeRepo,
                          PasswordEncoder encoder, JwtService jwtService) {
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        ResponseStatusException invalid =
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");

        AppUser user = userRepo.findByEmail(req.email()).orElseThrow(() -> invalid);
        if (!user.isActive() || !encoder.matches(req.password(), user.getPassword())) {
            throw invalid;
        }
        if (user.getEmployee() != null && !user.getEmployee().isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee account is deactivated");
        }
        Long empId = user.getEmployee() == null ? null : user.getEmployee().getId();
        return new LoginResponse(jwtService.generate(user), user.getEmail(), user.getRole().name(), empId);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal AuthUser user) {
        Map<String, Object> result = new HashMap<>();
        result.put("email", user.email());
        result.put("role", user.role());
        result.put("employeeId", user.employeeId());
        if (user.employeeId() != null) {
            employeeRepo.findById(user.employeeId()).ifPresent(e -> result.put("employee", e));
        }
        return result;
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(@AuthenticationPrincipal AuthUser user,
                                              @Valid @RequestBody ChangePasswordRequest req) {
        AppUser u = userRepo.findByEmail(user.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!encoder.matches(req.oldPassword(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is incorrect");
        }
        u.setPassword(encoder.encode(req.newPassword()));
        userRepo.save(u);
        return Map.of("message", "Password changed");
    }
}