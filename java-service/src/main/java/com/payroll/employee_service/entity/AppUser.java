package com.payroll.employee_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;          // stored as a BCrypt hash, never plain text

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Links the login to an employee record (null for a pure Admin account)
    @OneToOne
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    private boolean active = true;
}