package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.HolidayRequest;
import com.payroll.employee_service.entity.Holiday;
import com.payroll.employee_service.repository.HolidayRepository;
import com.payroll.employee_service.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayRepository repo;

    public HolidayController(HolidayRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Holiday> list(@RequestParam(required = false) Integer year) {
        int y = year == null ? LocalDate.now().getYear() : year;
        if (y < 2000 || y > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Year is not valid");
        }
        return repo.findByDateBetweenOrderByDateAsc(LocalDate.of(y, 1, 1), LocalDate.of(y, 12, 31));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Holiday create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody HolidayRequest req) {
        LocalDate date = req.date();
        if (date.getYear() < 2000 || date.getYear() > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date is not valid");
        }
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sunday is already a weekly holiday");
        }
        if (repo.existsByDate(date)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A holiday is already declared on this date");
        }
        Holiday h = new Holiday();
        h.setDate(date);
        h.setName(req.name().trim());
        h.setCreatedBy(user.email());
        return repo.save(h);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        Holiday h = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holiday not found"));
        repo.delete(h);
        return Map.of("message", "Holiday removed");
    }
}