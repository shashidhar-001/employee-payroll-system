package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "holidays", uniqueConstraints = @UniqueConstraint(columnNames = "date"))
@Data
@NoArgsConstructor
public class Holiday {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 100)
    private String name;

    private String createdBy;
}