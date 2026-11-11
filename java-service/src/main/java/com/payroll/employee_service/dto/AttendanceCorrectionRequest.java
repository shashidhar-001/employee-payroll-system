package com.payroll.employee_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceCorrectionRequest(
  @NotNull LocalDate date,
  @NotBlank String status,
  LocalTime checkIn,
  LocalTime checkOut,
  @NotBlank @Size(max = 255) String reason
) {}
