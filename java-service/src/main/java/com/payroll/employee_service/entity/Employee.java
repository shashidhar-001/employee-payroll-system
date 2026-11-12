package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  private String name;

  @Email
  @NotBlank
  @Column(unique = true)
  private String email;

  private String phone;
  private String designation;
  private LocalDate joiningDate;

  @NotNull
  @Positive
  private BigDecimal basicSalary;

  private boolean active = true;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "department_id")
  private Department department;

  // Display ID such as EMP0007, derived from the database id
  public String getEmployeeCode() {
    return id == null ? null : String.format("EMP%04d", id);
  }
}
