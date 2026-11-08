package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payslips",
       uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "month", "year"}))
@Data
@NoArgsConstructor
public class Payslip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "month", nullable = false)
    private int month;

    @Column(name = "year", nullable = false)
    private int year;

    private int workingDays;
    private BigDecimal absentDays;

    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal da;
    private BigDecimal gross;
    private BigDecimal pf;
    private BigDecimal professionalTax;
    private BigDecimal incomeTax;
    private BigDecimal lossOfPay;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;

    private LocalDateTime generatedAt;
}