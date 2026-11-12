package com.payroll.employee_service.repository;

import com.payroll.employee_service.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);
    Optional<Holiday> findByDate(LocalDate date);
    boolean existsByDate(LocalDate date);
}