package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "leave_requests")
@Data
@NoArgsConstructor
public class LeaveRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Enumerated(EnumType.STRING)
  private LeaveType leaveType;

  private LocalDate fromDate;
  private LocalDate toDate;

  // Working days in the range (Sundays excluded)
  private int days;

  private String reason;

  @Enumerated(EnumType.STRING)
  private LeaveStatus status;

  private LocalDateTime appliedAt;

  private String decidedBy; // email of the HR/Admin who decided
  private LocalDateTime decidedAt;
  private String remarks;
}
