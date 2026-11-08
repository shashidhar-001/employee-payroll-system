// dto/LeaveApplyRequest.java
package com.payroll.employee_service.dto;

import com.payroll.employee_service.entity.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record LeaveApplyRequest(
  @NotNull LeaveType leaveType,
  @NotNull LocalDate fromDate,
  @NotNull LocalDate toDate,
  @NotBlank String reason
) {}
