package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.*;

@Entity
@Table(
  name = "attendance",
  uniqueConstraints = @UniqueConstraint(columnNames = { "employee_id", "date" })
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Column(nullable = false)
  private LocalDate date;

  private LocalTime checkIn;
  private LocalTime checkOut;

  // PRESENT, LATE, HALF_DAY, ON_LEAVE
  private String status;

  private String correctedBy;
  private LocalDateTime correctedAt;
  private String correctionReason;
}
