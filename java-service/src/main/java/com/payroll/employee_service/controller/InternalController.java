package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.PayslipSummaryItem;
import com.payroll.employee_service.repository.PayslipRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/internal")
public class InternalController {

  private final PayslipRepository payslipRepo;

  @Value("${internal.api-key}")
  private String apiKey;

  public InternalController(PayslipRepository payslipRepo) {
    this.payslipRepo = payslipRepo;
  }

  @GetMapping("/payslips")
  public List<PayslipSummaryItem> payslips(
    @RequestHeader(value = "X-Service-Key", required = false) String key,
    @RequestParam int month,
    @RequestParam int year
  ) {
    if (
      key == null ||
      !MessageDigest.isEqual(
        key.getBytes(StandardCharsets.UTF_8),
        apiKey.getBytes(StandardCharsets.UTF_8)
      )
    ) {
      throw new ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Invalid service key"
      );
    }

    return payslipRepo
      .findByMonthAndYear(month, year)
      .stream()
      .map(p ->
        new PayslipSummaryItem(
          p.getEmployee().getId(),
          p.getEmployee().getName(),
          p.getEmployee().getDepartment() == null
            ? null
            : p.getEmployee().getDepartment().getName(),
          p.getGross(),
          p.getTotalDeductions(),
          p.getNetSalary()
        )
      )
      .toList();
  }
}
